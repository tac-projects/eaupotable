const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.eaupotable.net';

async function generateSitemap() {
  console.log('🚀 Démarrage de la génération du sitemap indexé par départements...');

  try {
    const sitemapsDir = path.join(__dirname, '../public/sitemaps');
    if (!fs.existsSync(sitemapsDir)) {
      fs.mkdirSync(sitemapsDir, { recursive: true });
    }

    // 1. Récupérer les départements
    const deptRes = await fetch('https://geo.api.gouv.fr/departements');
    const departements = await deptRes.json();
    
    let sitemapFiles = [];

    // --- SITEMAP PRINCIPAL (Pages Statiques) ---
    const staticUrls = [`${DOMAIN}/`, `${DOMAIN}/villes`, `${DOMAIN}/faq`, `${DOMAIN}/mentions-legales`, `${DOMAIN}/contact` ];
    const staticXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `  <url><loc>${url}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`).join('\n')}
</urlset>`;
    fs.writeFileSync(path.join(sitemapsDir, 'sitemap-main.xml'), staticXml);
    sitemapFiles.push('sitemap-main.xml');

    console.log(`📑 Génération des sitemaps pour ${departements.length} départements...`);

    // --- SITEMAPS PAR DEPARTEMENT ---
    for (const dept of departements) {
      let deptUrls = [];
      deptUrls.push(`${DOMAIN}/departement/${dept.code}`);

      const cityRes = await fetch(`https://geo.api.gouv.fr/departements/${dept.code}/communes`);
      const communes = await cityRes.json();

      for (const city of communes) {
        const slug = city.nom
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '-');
        
        deptUrls.push(`${DOMAIN}/ville/${slug}`);
      }

      const deptXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${deptUrls.map(url => `  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;
      
      const fileName = `sitemap-dept-${dept.code}.xml`;
      fs.writeFileSync(path.join(sitemapsDir, fileName), deptXml);
      sitemapFiles.push(fileName);
      process.stdout.write('.');
    }

    // --- SITEMAP INDEX ---
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(file => `  <sitemap>
    <loc>${DOMAIN}/sitemaps/${file}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), indexXml);
    
    console.log(`\n🎉 Sitemap Index et ${sitemapFiles.length} fichiers générés avec succès !`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
  }
}

generateSitemap();
