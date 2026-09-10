const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.eaupotable.net';
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// Dernière date de prélèvement ARS d'une ville (clé = slug de base dans le fichier dept).
// Le city-index peut porter un slug suffixé "base-dept" (collision d'homonymes) : on retire
// le suffixe uniquement si la clé de base existe bien dans le fichier du département.
function cityLastmod(deptData, slug, deptCode) {
  if (!deptData || !deptData.cities) return null;
  let city = deptData.cities[slug];
  if (!city && slug.endsWith(`-${deptCode}`)) {
    city = deptData.cities[slug.slice(0, -(deptCode.length + 1))];
  }
  const date = city?.meta?.date_prelevement;
  return ISO_RE.test(date || '') ? date : null;
}

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

    // Le lastmod n'est PAS la date de génération : il reflète la date du dernier prélèvement
    // ARS affiché sur la page. Une régénération de sitemap sans nouvelle donnée ne doit pas
    // faire croire à Google que les 35 000 pages ont changé (source de recrawls massifs).
    let sitemapFiles = [];
    const buildDate = new Date().toISOString().split('T')[0];

    // --- SITEMAP PRINCIPAL (Pages Statiques) ---
    // Pages statiques indexables UNIQUEMENT — les pages noindex (contact, mentions-legales)
    // ne doivent pas apparaître dans un sitemap.
    const staticUrls = [`${DOMAIN}/`, `${DOMAIN}/villes`, `${DOMAIN}/definitions`, `${DOMAIN}/faq`, `${DOMAIN}/methodologie`, `${DOMAIN}/pfas-eau-potable`, `${DOMAIN}/eau-bebe` ];
    const staticXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `  <url><loc>${url}</loc><lastmod>${buildDate}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`).join('\n')}
</urlset>`;
    fs.writeFileSync(path.join(sitemapsDir, 'sitemap-main.xml'), staticXml);
    sitemapFiles.push({ file: 'sitemap-main.xml', lastmod: buildDate });

    console.log(`📑 Génération des sitemaps pour ${Object.keys(departements).length} départements référencés...`);

    // --- SITEMAPS PAR DEPARTEMENT ---
    for (const [deptCode, slugs] of Object.entries(departements)) {
      const deptPriority = '0.8';
      const metroPriority = '1.0';
      const stdPriority = '0.7';
      const metroChangefreq = 'daily';
      const stdChangefreq = 'weekly';

      // Charger les données du département pour extraire les dates de prélèvement réelles
      let deptData = null;
      const deptPath = path.join(__dirname, '../public/data/departments', `${deptCode}.json`);
      try {
        if (fs.existsSync(deptPath)) {
          deptData = JSON.parse(fs.readFileSync(deptPath, 'utf8'));
        }
      } catch (e) {
        console.warn(`⚠️  Impossible de lire ${deptCode}.json pour le lastmod : ${e.message}`);
      }

      const cityLastmods = {};
      let deptMax = null;
      slugs.forEach(slug => {
        const d = cityLastmod(deptData, slug, deptCode);
        cityLastmods[slug] = d;
        if (d && (!deptMax || d > deptMax)) deptMax = d;
      });
      // Repli : date du département (max des prélèvements) ; en dernier recours date de build.
      const deptLastmod = deptMax || buildDate;

      const deptUrls = [
        `  <url><loc>${DOMAIN}/departement/${deptCode}</loc><lastmod>${deptLastmod}</lastmod><changefreq>${stdChangefreq}</changefreq><priority>${deptPriority}</priority></url>`
      ];

      slugs.forEach(slug => {
        const isMetropole = metropoleSlugs.has(slug);
        const priority = isMetropole ? metroPriority : stdPriority;
        const changefreq = isMetropole ? metroChangefreq : stdChangefreq;
        const lastmod = cityLastmods[slug] || deptLastmod;
        deptUrls.push(`  <url><loc>${DOMAIN}/ville/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`);
      });

      const deptXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${deptUrls.join('\n')}
</urlset>`;
      
      const fileName = `sitemap-dept-${deptCode}.xml`;
      fs.writeFileSync(path.join(sitemapsDir, fileName), deptXml);
      sitemapFiles.push({ file: fileName, lastmod: deptLastmod });
      process.stdout.write('.');
    }

    // --- SITEMAP INDEX ---
    // Le lastmod de chaque entrée = max des lastmod du sitemap concerné (jamais la date du jour).
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(({ file, lastmod }) => `  <sitemap>
    <loc>${DOMAIN}/sitemaps/${file}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), indexXml);
    
    console.log(`\n🎉 Sitemap Index et ${sitemapFiles.length} fichiers générés avec succès !`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
  }
}

generateSitemap();
