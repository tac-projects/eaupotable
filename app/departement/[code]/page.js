import fs from 'fs';
import path from 'path';
import DepartementClient from './DepartementClient';

export async function generateMetadata({ params }) {
  const { code } = await params;
  let deptName = `Département ${code}`;
  let avgScore = "";
  let cityCount = 0;

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'departments', `${code}.json`);
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileData);
      deptName = data.deptInfo?.name || deptName;
      avgScore = data.deptInfo?.avgScore || "";
      cityCount = data.cities ? Object.keys(data.cities).length : 0;
    }
  } catch (e) {}

  const currentYear = new Date().getFullYear();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
  const currentMonthYear = `${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${currentYear}`;

  const scoreString = typeof avgScore === 'number' ? avgScore.toFixed(1).replace('.', ',') : avgScore;
  const title = `Qualité de l'eau : ${deptName} (${code}) | Calcaire & PFAS - ${currentMonthYear}`;
  const description = `Votre eau du robinet est-elle saine ? 💧 Classement ${deptName} (${code}). Score moyen : ${scoreString}/10 (${cityCount} communes). Bilan PFAS, Calcaire & Prix par commune.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.eaupotable.net/departement/${code}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.eaupotable.net/departement/${code}`,
      images: [`/api/og?city=${encodeURIComponent(deptName)}&score=${avgScore}&label=CLASSEMENT&status=status-good`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function DepartementPage({ params }) {
  const { code } = await params;
  let deptData = null;

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'departments', `${code}.json`);
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      deptData = JSON.parse(fileData);
    }
  } catch (e) {
    console.error("Erreur lors de la lecture des données départementales:", e);
  }

  const deptName = deptData?.deptInfo?.name || `Département ${code}`;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
  const currentMonthYear = `${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${currentYear}`;

  // JSON-LD pour la FAQ et la page
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `Peut-on boire l'eau du robinet sans risque en ${deptName} ?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Avec un taux de conformité de ${deptData?.deptInfo?.conformRate}%, l'eau en ${deptName} est officiellement potable selon les normes de l'ARS. Le Crystal Score moyen de ${deptData?.deptInfo?.avgScore}/10 permet d'évaluer la pureté réelle au-delà de la simple conformité.`
            }
          },
          {
            "@type": "Question",
            "name": `Quels sont les polluants recherchés en ${deptName} ?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Les analyses couvrent la microbiologie, les nitrates, les pesticides et, depuis 2026, la recherche systématique des polluants éternels (PFAS) dans l'ensemble du département ${deptName}.`
            }
          },
          {
            "@type": "Question",
            "name": `Où trouver le rapport officiel de l'ARS pour ${deptName} ?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Les données brutes sont disponibles sur le portail SISE-Eaux du Ministère de la Santé. EauPotable.net synthétise ces informations pour chaque commune de ${deptName}.`
            }
          }
        ]
      },
      {
        "@type": "Dataset",
        "name": `Bilan de la qualité de l'eau : département ${deptName} (${currentMonthYear})`,
        "description": `Synthèse consolidée des analyses d'eau potable pour le département ${deptName}. Inclut les statistiques de conformité, PFAS et pesticides pour l'ensemble des communes du secteur. Analyse mise à jour en ${currentMonthYear}.`,
        "url": `https://www.eaupotable.net/departement/${code}`,
        "variableMeasured": [
          "Taux de conformité départemental",
          "Moyenne Crystal Score",
          "Présence de polluants éternels (PFAS)",
          "Nitrates et Pesticides"
        ],
        "creator": { "@id": "https://www.eaupotable.net/#organization" },
        "spatialCoverage": { "@type": "Place", "name": deptName },
        "temporalCoverage": `${currentYear}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DepartementClient 
        code={code} 
        deptData={deptData}
      />
    </>
  );
}
