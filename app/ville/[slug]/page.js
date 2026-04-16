import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';
import { fetchCitySummary } from '../../../lib/water-utils';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  
  // On récupère le score réel pour l'image sociale
  const summary = await fetchCitySummary(cityName);
  const score = summary?.crystal?.final || 'N/A';
  const label = summary?.crystal?.label || 'ANALYSE';
  const statusClass = summary?.crystal?.statusClass || 'status-good';

  const ogImageUrl = `/api/og?city=${encodeURIComponent(cityName)}&score=${score}&label=${encodeURIComponent(label)}&status=${statusClass}`;

  return {
    title: `Qualité de l'eau potable à ${cityName} (2026) | EauPotable.net`,
    description: `Découvrez si l'eau du robinet est potable à ${cityName}. Analyse complète : nitrates, calcaire, pesticides et pH. Données officielles ARS.`,
    openGraph: {
      title: `Qualité de l'eau potable à ${cityName}`,
      description: `L'eau de ${cityName} est-elle saine ? Score : ${score}/10. Consultez l'analyse complète.`,
      images: [ogImageUrl],
    },
  };
}

export default async function CityPage({ params }) {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  return (
    <>
      <Navbar />
      <WaterApp initialCity={cityName} />
    </>
  );
}

