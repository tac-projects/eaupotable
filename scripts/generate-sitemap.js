const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.eaupotable.net';

async function generateSitemap() {
  console.log('🚀 Démarrage de la génération du sitemap basé sur l\'index local...');

  try {
    const sitemapsDir = path.join(__dirname, '../public/sitemaps');
    const indexPath = path.join(__dirname, '../public/city-index.json');
    
    if (!fs.existsSync(sitemapsDir)) {
      fs.mkdirSync(sitemapsDir, { recursive: true });
    }

    if (!fs.existsSync(indexPath)) {
      console.error('❌ Erreur : city-index.json introuvable. Lancez d\'abord le script de build des données.');
      return;
    }

    // 1. Charger l'index local
    const cityIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const departements = {};

    // 2. Grouper les slugs par département
    Object.entries(cityIndex).forEach(([slug, deptCode]) => {
      // On ignore les entrées qui sont des codes INSEE numériques (5 chiffres)
      if (/^\d{5}$/.test(slug)) return;

      if (!departements[deptCode]) departements[deptCode] = [];
      departements[deptCode].push(slug);
    });

    // 2bis. Charger la liste des métropoles pour priorisation
    const metropolisPath = path.join(__dirname, '../public/data/metropolis.json');
    const metropoleSlugs = new Set();
    if (fs.existsSync(metropolisPath)) {
      const metropolisData = JSON.parse(fs.readFileSync(metropolisPath, 'utf8'));
      metropolisData.forEach(city => metropoleSlugs.add(city.slug));
      console.log(`🏙️  ${metropoleSlugs.size} métropoles détectées pour priorisation`);
    }

    let sitemapFiles = [];
    const todayDate = new Date().toISOString().split('T')[0];

    // --- SITEMAP PRINCIPAL (Pages Statiques) ---
    const staticUrls = [`${DOMAIN}/`, `${DOMAIN}/villes`, `${DOMAIN}/faq`, `${DOMAIN}/methodologie`, `${DOMAIN}/mentions-legales`, `${DOMAIN}/contact` ];
    const staticXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `  <url><loc>${url}</loc><lastmod>${todayDate}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`).join('\n')}
</urlset>`;
    fs.writeFileSync(path.join(sitemapsDir, 'sitemap-main.xml'), staticXml);
    sitemapFiles.push('sitemap-main.xml');

    console.log(`📑 Génération des sitemaps pour ${Object.keys(departements).length} départements référencés...`);

    // --- SITEMAPS PAR DEPARTEMENT ---
    for (const [deptCode, slugs] of Object.entries(departements)) {
      const deptPriority = '0.8';
      const metroPriority = '1.0';
      const stdPriority = '0.7';
      const metroChangefreq = 'daily';
      const stdChangefreq = 'weekly';

      const deptUrls = [
        `  <url><loc>${DOMAIN}/departement/${deptCode}</loc><lastmod>${todayDate}</lastmod><changefreq>${stdChangefreq}</changefreq><priority>${deptPriority}</priority></url>`
      ];

      slugs.forEach(slug => {
        const isMetropole = metropoleSlugs.has(slug);
        const priority = isMetropole ? metroPriority : stdPriority;
        const changefreq = isMetropole ? metroChangefreq : stdChangefreq;
        deptUrls.push(`  <url><loc>${DOMAIN}/ville/${slug}</loc><lastmod>${todayDate}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`);
      });

      const deptXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${deptUrls.join('\n')}
</urlset>`;
      
      const fileName = `sitemap-dept-${deptCode}.xml`;
      fs.writeFileSync(path.join(sitemapsDir, fileName), deptXml);
      sitemapFiles.push(fileName);
      process.stdout.write('.');
    }

    // --- SITEMAP INDEX ---
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(file => `  <sitemap>
    <loc>${DOMAIN}/sitemaps/${file}</loc>
    <lastmod>${todayDate}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), indexXml);
    
    console.log(`\n🎉 Sitemap Index et ${sitemapFiles.length} fichiers générés avec succès !`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
  }
}

generateSitemap();
