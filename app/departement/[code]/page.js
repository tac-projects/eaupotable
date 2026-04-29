import fs from 'fs';
import path from 'path';
import DepartementClient from './DepartementClient';

export async function generateMetadata({ params }) {
  const { code } = await params;
  let deptName = `Département ${code}`;
  let avgScore = "";

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'departments', `${code}.json`);
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileData);
      deptName = data.deptInfo?.name || deptName;
      avgScore = data.deptInfo?.avgScore || "";
    }
  } catch (e) {}

  const currentYear = new Date().getFullYear();

  return {
    title: `Qualité de l'eau : ${deptName} (${code}) | Bilan ${currentYear} & PFAS`,
    description: `✅ Eau potable en ${deptName} (${code}) : Score de pureté moyen ${avgScore}/10. Consultez les analyses PFAS, calcaire et nitrates pour les communes du département.`,
    alternates: {
      canonical: `https://www.eaupotable.net/departement/${code}`,
    },
    openGraph: {
      title: `Qualité de l'eau : ${deptName} (${code}) | Rapport Officiel`,
      description: `Analyses consolidées de l'eau potable pour le département ${deptName}. Focus PFAS et conformité ARS ${currentYear}.`,
      type: 'website',
      url: `https://www.eaupotable.net/departement/${code}`,
      images: [`/api/og?city=${encodeURIComponent(deptName)}&score=${avgScore}&label=BILAN&status=status-good`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Qualité de l'eau : ${deptName}`,
      description: `Bilan complet de la potabilité en ${deptName}.`,
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

  // JSON-LD pour la FAQ et la page
  const jsonLd = {
    "@context": "https://schema.org",
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
