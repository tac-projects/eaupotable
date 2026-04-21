const fs = require('fs');
const path = require('path');

const host = "www.eaupotable.net";
const key = "7be75716d932ac5e09522369aa85b026";

async function notifyIndexNow() {
  console.log(`🚀 Préparation de la notification IndexNow pour ${host}...`);

  let finalUrlList = [
    `https://${host}/`,
    `https://${host}/villes`,
    `https://${host}/faq`,
    `https://${host}/sitemap.xml`,
    `https://${host}/contact`,
    `https://${host}/mentions-legales`
  ];

  try {
    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const xml = fs.readFileSync(sitemapPath, 'utf8');
      
      // 1. On récupère TOUTES les URLs du sitemap
      const allUrls = xml.match(/https:\/\/www\.eaupotable\.net\/[a-z0-9\/-]+/g) || [];
      
      // 2. On sépare les villes du reste (départements, etc.)
      const cityUrls = allUrls.filter(url => url.includes('/ville/'));
      const otherUrls = allUrls.filter(url => !url.includes('/ville/') && !finalUrlList.includes(url));

      // 3. On ajoute TOUTES les "autres" pages (départements notamment)
      finalUrlList = [...new Set([...finalUrlList, ...otherUrls])];
      console.log(`📂 Pages structurelles (Home, Depts, etc.) : ${finalUrlList.length}`);

      // 4. On ajoute 500 villes aléatoires pour la rotation
      const randomCities = cityUrls.sort(() => 0.5 - Math.random()).slice(0, 500);
      finalUrlList = [...finalUrlList, ...randomCities];
      
      console.log(`🎲 Rotation : ${randomCities.length} villes sélectionnées.`);
    }
  } catch (err) {
    console.error("⚠️ Erreur lors de la lecture du sitemap :", err.message);
  }
  
  const url = "https://www.bing.com/indexnow";
  const data = {
    host: host,
    key: key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: finalUrlList
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data)
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`✅ Succès ! ${data.urlList.length} URLs ont été poussées vers Bing/Seznam.`);
    } else {
      console.error("❌ Erreur lors de la notification IndexNow.");
      console.log("Status:", response.status);
    }
  } catch (err) {
    console.error("❌ Erreur réseau IndexNow :", err);
  }
}

notifyIndexNow();
