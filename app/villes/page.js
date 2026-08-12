import VillesIndexClient from './VillesIndexClient';

export const metadata = {
  title: 'Répertoire National : Qualité de l\'eau par Ville | EauPotable.net',
  description: 'Accédez à la base de données synchronisée de la potabilité en France. Recherche par ville pour un verdict immédiat sur les polluants, le calcaire et les PFAS en 2026.',
  alternates: {
    canonical: 'https://www.eaupotable.net/villes',
  },
  openGraph: {
    title: 'Qualité de l\'eau en France : Annuaire des Villes',
    description: 'Accédez aux rapports officiels de potabilité pour chaque commune française. Score de pureté et analyses ARS 2026.',
    images: ['https://www.eaupotable.net/images/og-default.webp'],
  }
};

async function getDepartements() {
  try {
    const res = await fetch('https://geo.api.gouv.fr/departements');
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function VillesIndexPage() {
  const departements = await getDepartements();
  
  return <VillesIndexClient initialDepartements={departements} />;
}
