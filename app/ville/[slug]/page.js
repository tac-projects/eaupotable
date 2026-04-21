import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';
import { fetchCitySummary } from '../../../lib/water-utils';
import { cache } from 'react';

const DOMAIN = 'https://www.eaupotable.net';

// Dédoublage de l'audit pour diviser le temps de chargement par 2
const getCachedSummary = cache(async (cityName) => {
  return await fetchCitySummary(cityName);
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  // On transforme le slug proprement (ex: saint-herblain -> Saint-Herblain)
  const cityNameFromSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  
  const summary = await getCachedSummary(cityNameFromSlug);
  const officialName = summary?.cityName || cityNameFromSlug;
  const score = summary?.crystal?.final || 'N/A';
  const label = summary?.crystal?.label || 'ANALYSE';
  const statusClass = summary?.crystal?.label?.toLowerCase().replace(/\s/g, '-') || 'status-good';

  const ogImageUrl = `/api/og?city=${encodeURIComponent(officialName)}&score=${score}&label=${encodeURIComponent(label)}&status=${statusClass}`;

  return {
    title: `Qualité de l'eau potable à ${officialName} (2026) | Crystal Score`,
    description: `📊 Analyse complète de la qualité de l'eau à ${officialName} en 2026. Découvrez le verdict officiel ARS, les pesticides et PFAS détectés.`,
    alternates: {
      canonical: `${DOMAIN}/ville/${slug}`,
    },
    openGraph: {
      title: `Qualité de l'eau potable : ${officialName} (2026)`,
      description: `L'eau de ${officialName} est-elle saine ? Score : ${score}/10. Consultez l'analyse complète du verdict ARS : PFAS et pesticides.`,
      images: [ogImageUrl],
    },
  };
}

export default async function CityPage({ params }) {
  const { slug } = await params;
  
  // On transforme le slug
  const cityNameFromSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  
  const summary = await getCachedSummary(cityNameFromSlug);
  const officialName = summary?.cityName || cityNameFromSlug;

  return (
    <>
      <Navbar />
      <WaterApp initialCity={officialName} initialData={summary} />
    </>
  );
}

