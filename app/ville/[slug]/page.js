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

let cityIndexCache = null;
let deptDataCache = new Map();

async function getLocalData(slug) {
  try {
    // 1. On cherche le département de la ville dans l'index (avec cache mémoire)
    if (!cityIndexCache) {
      const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
      if (fs.existsSync(indexPath)) {
        cityIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      }
    }
    
    if (!cityIndexCache) return null;
    const cityIndex = cityIndexCache;
    
    // Normalisation de sécurité du slug entrant
    const cleanSlug = slug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');
    const deptCode = cityIndex[cleanSlug] || cityIndex[slug];
    
    if (!deptCode) return null;

    // 2. On charge le fichier du département correspondant (avec cache mémoire)
    let fullData = null;
    if (deptDataCache.has(deptCode)) {
      fullData = deptDataCache.get(deptCode);
    } else {
      const filePath = path.join(process.cwd(), 'public', 'data', 'departments', `${deptCode}.json`);
      if (fs.existsSync(filePath)) {
        fullData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        deptDataCache.set(deptCode, fullData);
      }
    }

    if (!fullData) return null;
    
    // On cherche la ville par son slug dans le fichier
    const rawCityData = fullData.cities[slug];
    if (!rawCityData) return null;

    // NETTOYAGE DU PAYLOAD : On n'envoie que le strict nécessaire au client
    const cityData = {
      cityName: rawCityData.cityName,
      crystal: rawCityData.crystal,
      stats: {
        microbiology: rawCityData.stats?.microbiology,
        nitrates: rawCityData.stats?.nitrates,
        pesticides: rawCityData.stats?.pesticides,
        pfas: rawCityData.stats?.pfas,
        chlorine: rawCityData.stats?.chlorine,
        hardness: rawCityData.stats?.hardness,
        ph: rawCityData.stats?.ph,
        turbidity: rawCityData.stats?.turbidity,
        conductivity: rawCityData.stats?.conductivity,
        iron: rawCityData.stats?.iron,
        manganese: rawCityData.stats?.manganese,
        copper: rawCityData.stats?.copper,
        organic_carbon: rawCityData.stats?.organic_carbon,
      },
      meta: {
        code_departement: rawCityData.meta?.code_departement,
        date_prelevement: rawCityData.meta?.date_prelevement,
        nom_distributeur: rawCityData.meta?.nom_distributeur,
        nom_reseau: rawCityData.meta?.nom_reseau,
        conclusion: rawCityData.meta?.conclusion
      }
    };

    const isConform = rawCityData.meta?.is_conform !== false;

    // On prépare la liste des voisins (déjà filtrée)
    const neighborList = fullData.deptInfo.topCities.map(c => ({
      nom: c.name,
      score: c.score,
      code: c.slug,
      isCurrent: c.slug === slug
    })).slice(0, 8); // Limiter à 8 pour le SEO/Mobile

    return {
      ...cityData,
      isConform,
      initialDeptAvg: {
        score: fullData.deptInfo.avgScore,
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


import { POPULAR_CITIES } from '../../../lib/water-utils';

export async function generateStaticParams() {
  // On pré-génère les pages des villes les plus populaires pour un TTFB de 0ms
  return POPULAR_CITIES.map((city) => ({
    slug: city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-')
  }));
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
    other: {
      'preconnect': 'https://hubeau.eaufrance.fr'
    }
  };
}

import CityHero from '../../components/CityHero';

export default async function CityPage({ params }) {
  const { slug } = await params;
  const cityNameFromSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  
  let summary = await getLocalData(slug);
  if (!summary) {
    summary = await getCachedSummary(cityNameFromSlug);
  }

  const officialName = summary?.cityName || cityNameFromSlug;
  const nomReseau = (summary?.meta?.nom_distributeur || summary?.meta?.nom_reseau || officialName).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return (
    <>
      <Navbar />
      <CityHero 
        cityName={officialName}
        dpt={summary?.meta?.code_departement || ''}
        dateAnalyse={summary?.meta?.date_prelevement ? new Date(summary.meta.date_prelevement).toLocaleDateString('fr-FR') : '2026'}
        score={summary?.crystal?.final || '--'}
        label={summary?.crystal?.label || 'ANALYSE'}
        nomReseau={nomReseau}
      />
      <WaterApp initialCity={officialName} initialData={summary} />
    </>
  );
}


