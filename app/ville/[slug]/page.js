import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';
import { fetchCitySummary } from '../../../lib/water-utils';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  
  // On récupère le score réel pour l'image sociale
  const summary = await fetchCitySummary(cityName);
  const score = summary?.score || 'N/A';
  const label = summary?.label || 'ANALYSE';
  const statusClass = summary?.statusClass || 'status-good';

  const ogImageUrl = `/api/og?city=${encodeURIComponent(cityName)}&score=${score}&label=${encodeURIComponent(label)}&status=${statusClass}`;

  return {
    title: `Qualité de l'eau potable : ${cityName} (2026) | Analyses & PFAS`,
    description: `📊 Qualité de l'eau à ${cityName} en temps réel. Analyse PFAS et verdict ARS 2026 via flux officiel direct : découvrez ce que contient votre eau du robinet aujourd'hui.`,
    openGraph: {
      title: `Qualité de l'eau potable : ${cityName} (2026)`,
      description: `L'eau de ${cityName} est-elle saine ? Score : ${score}/10. Consultez l'analyse complète du verdict ARS : PFAS et pesticides.`,
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

