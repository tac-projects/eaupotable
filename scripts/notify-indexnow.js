const fs = require('fs');
const path = require('path');

const host = "www.eaupotable.net";
const key = "7be75716d932ac5e09522369aa85b026";

async function notifyIndexNow() {
  console.log(`🚀 Préparation de la notification IndexNow pour ${host}...`);

  // 1. Extraction de 50 URLs de villes aléatoires depuis le sitemap pour rotation
  let randomUrls = [];
  try {
    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const xml = fs.readFileSync(sitemapPath, 'utf8');
      // Regex pour capturer les URLs des villes uniquement
      const allUrls = xml.match(/https:\/\/www\.eaupotable\.net\/ville\/[a-z0-9-]+/g) || [];
      
      if (allUrls.length > 0) {
        // Mélange et sélection de 1000 URLs
        randomUrls = allUrls.sort(() => 0.5 - Math.random()).slice(0, 1000);
        console.log(`🎲 Rotation : ${randomUrls.length} villes sélectionnées aléatoirement.`);
      }
    }
  } catch (err) {
    console.error("⚠️ Erreur lors de la lecture du sitemap pour la rotation :", err.message);
  }
  
  const url = "https://www.bing.com/indexnow";
  const data = {
    host: host,
    key: key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: [
      `https://${host}/`,
      `https://${host}/villes`,
      `https://${host}/sitemap.xml`,
      ...randomUrls
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data)
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`✅ Succès ! ${data.urlList.length} URLs ont été poussées vers Bing/Seznam.`);
      console.log("Status:", response.status);
    } else {
      console.error("❌ Erreur lors de la notification IndexNow.");
      console.log("Status:", response.status);
      const text = await response.text();
      console.log("Response:", text);
    }
  } catch (err) {
    console.error("❌ Erreur réseau IndexNow :", err);
  }
}

notifyIndexNow();
