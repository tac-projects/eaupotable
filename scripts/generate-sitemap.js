const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://eaupotable.net';

async function generateSitemap() {
  console.log('🚀 Démarrage de la génération du sitemap géant...');

  try {
    // 1. Récupérer les départements
    const deptRes = await fetch('https://geo.api.gouv.fr/departements');
    const departements = await deptRes.json();
    
    let urls = [];

    // Pages Statiques de base
    urls.push(`${DOMAIN}/`);
    urls.push(`${DOMAIN}/villes`);

    console.log(`📑 Traitement de ${departements.length} départements...`);

    for (const dept of departements) {
      // Page du département
      urls.push(`${DOMAIN}/departement/${dept.code}`);

      // Récupérer les communes du département
      const cityRes = await fetch(`https://geo.api.gouv.fr/departements/${dept.code}/communes`);
      const communes = await cityRes.json();

      for (const city of communes) {
        // Générer le slug de la même manière que dans l'app
        const slug = city.nom
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '-');
        
        urls.push(`${DOMAIN}/ville/${slug}`);
      }
      process.stdout.write('.'); // Indicateur de progression
    }

    console.log(`\n✅ ${urls.length} URLs générées.`);

    // Génération du XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url.includes('/ville/') ? '0.8' : url.includes('/departement/') ? '0.6' : '1.0'}</priority>
  </url>`).join('\n')}
</urlset>`;

    const dest = path.join(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(dest, xml);
    
    console.log(`\n🎉 Sitemap sauvegardé avec succès dans : ${dest}`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
  }
}

generateSitemap();
