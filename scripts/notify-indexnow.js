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
    const sitemapDir = path.join(__dirname, '../public/sitemaps');
    if (fs.existsSync(sitemapDir)) {
      const files = fs.readdirSync(sitemapDir).filter(f => f.endsWith('.xml'));
      console.log(`🔍 Exploration de ${files.length} sitemaps...`);

      let allCityUrls = [];
      for (const file of files) {
        const content = fs.readFileSync(path.join(sitemapDir, file), 'utf8');
        const urls = content.match(/https:\/\/www\.eaupotable\.net\/ville\/[a-z0-9\/-]+/g) || [];
        allCityUrls = [...allCityUrls, ...urls];
        // Si c'est un sitemap de département, on ajoute aussi l'URL du sitemap lui-même
        finalUrlList.push(`https://${host}/sitemaps/${file}`);
      }

      console.log(`🏙️ Total villes découvertes : ${allCityUrls.length}`);

      // 4. On ajoute 500 villes aléatoires pour la rotation
      const randomCities = allCityUrls.sort(() => 0.5 - Math.random()).slice(0, 500);
      finalUrlList = [...new Set([...finalUrlList, ...randomCities])];
      
      console.log(`🎲 Rotation : ${randomCities.length} villes sélectionnées pour notification.`);
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
