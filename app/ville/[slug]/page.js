import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';
import { fetchCitySummary } from '../../../lib/water-utils';
import { cache } from 'react';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://www.eaupotable.net';

// Dédoublage de l'audit pour diviser le temps de chargement par 2
const getCachedSummary = cache(async (cityName) => {
  return await fetchCitySummary(cityName);
});

async function getLocalData(slug) {
  try {
    // 1. On cherche le département de la ville dans l'index
    const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
    if (!fs.existsSync(indexPath)) return null;
    
    const cityIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const deptCode = cityIndex[slug];
    
    if (!deptCode) return null;

    // 2. On charge le fichier du département correspondant
    const filePath = path.join(process.cwd(), 'data', 'departments', `${deptCode}.json`);
    if (!fs.existsSync(filePath)) return null;
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fullData = JSON.parse(fileContent);
    
    // On cherche la ville par son slug dans le fichier
    const cityData = fullData.cities[slug];
    
    if (!cityData) return null;

    // On injecte les données départementales pour éviter le fetch client
    // On s'assure que la ville actuelle est dans la liste du benchmark
    let neighborList = fullData.deptInfo.topCities.map(c => ({
      nom: c.name,
      score: c.score,
      code: c.slug,
      isCurrent: c.slug === slug
    }));

    const isCurrentInTop = neighborList.some(c => c.isCurrent);
    if (!isCurrentInTop) {
      // On AJOUTE la ville actuelle au lieu de remplacer (on aura 11 villes)
      neighborList.push({
        nom: cityData.cityName,
        score: cityData.crystal.final,
        code: slug,
        isCurrent: true
      });
    }
    
    // On retrie toujours par score pour l'esthétique
    neighborList.sort((a, b) => b.score - a.score);

    return {
      ...cityData,
      initialDeptAvg: {
        ...fullData.deptInfo.averages,
        conformRate: fullData.deptInfo.conformRate,
        score: fullData.deptInfo.avgScore,
        avgScore: fullData.deptInfo.avgScore,
        name: fullData.deptInfo.name
      },

      initialNeighborCities: neighborList,
      regionalInfo: fullData.regionalInfo
    };

  } catch (e) {
    console.error("Local data error:", e);
    return null;
  }
}



export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cityNameFromSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  
  let summary = await getLocalData(slug);
  if (!summary) {
    summary = await getCachedSummary(cityNameFromSlug);
  }

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
  const cityNameFromSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  
  let summary = await getLocalData(slug);
  if (!summary) {
    summary = await getCachedSummary(cityNameFromSlug);
  }

  const officialName = summary?.cityName || cityNameFromSlug;

  return (
    <>
      <Navbar />
      <WaterApp initialCity={officialName} initialData={summary} />
    </>
  );
}


