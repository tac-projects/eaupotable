import fs from 'fs';
import path from 'path';
import { buildDeptFaq } from '../../../lib/dept-editorial';
import DepartementClient from './DepartementClient';

export const revalidate = 86400; // Cache ISR de 24h après la première visite

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
  const title = `Qualité de l'eau en ${deptName} (${code}) : Calcaire & PFAS - ${currentMonthYear}`;
  const description = `Votre eau du robinet est-elle saine ? 💧 Score moyen : ${scoreString}/10. Découvrez le classement et le bilan complet (Calcaire, Nitrates & PFAS) des ${cityCount} communes de ${deptName}.`;

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

  // FAQ contextuelle (mêmes questions que la FAQ visible de la page)
  const deptFaq = deptData ? buildDeptFaq(deptData, currentYear) : [];

  // JSON-LD pour la FAQ et la page
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": deptFaq.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a }
        }))
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
        "creator": {
          "@type": "Person",
          "name": "Thomas-Alexis Cailleau",
          "url": "https://www.linkedin.com/in/thomasalexiscailleau"
        },
        "license": "https://www.eaupotable.net/mentions-legales",
        "spatialCoverage": {
          "@type": "Place",
          "name": deptName,
          "containedInPlace": {
            "@type": "Place",
            "name": "France"
          }
        },
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
