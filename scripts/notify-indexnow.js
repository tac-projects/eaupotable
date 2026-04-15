const host = "www.eaupotable.net";
const key = "7be75716d932ac5e09522369aa85b026";

async function notifyIndexNow() {
  console.log(`🚀 Notification IndexNow pour ${host}...`);
  
  const url = "https://www.bing.com/indexnow";
  const data = {
    host: host,
    key: key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: [
      `https://${host}/`,
      `https://${host}/villes`,
      `https://${host}/sitemap.xml`
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data)
    });

    if (response.status === 200 || response.status === 202) {
      console.log("✅ Succès ! Les moteurs de recherche (Bing, Seznam...) ont été notifiés.");
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
