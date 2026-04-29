import { notFound, redirect } from 'next/navigation';
import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';
import { calculateCrystalScore } from '../../../lib/water-utils';
import { cache } from 'react';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://www.eaupotable.net';

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
    
    // RECALCUL DYNAMIQUE : On recalcule le score et les labels pour garantir la prise en compte 
    // des nouvelles règles métier (labels masculins, arrondis) sans attendre un nouveau crawl.
    const recalculatedCrystal = calculateCrystalScore(cityData.stats, isConform);
    cityData.crystal = recalculatedCrystal;

    // 1. Liste pour le Benchmark (Top 10 des plus grandes villes)
    const benchmarkCities = (fullData.deptInfo.topCities || [])
      .map(c => ({
        nom: c.name,
        score: c.score,
        code: c.slug,
        isCurrent: c.slug === slug
      }))
      .sort((a, b) => b.score - a.score); // Tri par score pour le classement

    // 2. Liste pour le maillage SEO (Top 10 + 20 au hasard = 30 villes)
    const otherCities = Object.entries(fullData.cities)
      .filter(([cSlug]) => !benchmarkCities.some(bc => bc.code === cSlug))
      .map(([cSlug, cData]) => ({
        nom: cData.cityName,
        score: cData.crystal?.final || 0,
        code: cSlug,
        isCurrent: cSlug === slug
      }));

    const random20 = otherCities
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);

    const neighborList = [...benchmarkCities, ...random20];

    return {
      ...cityData,
      isConform,
      initialDeptAvg: {
        score: fullData.deptInfo.avgScore,
        name: fullData.deptInfo.name,
        conformRate: fullData.deptInfo.conformRate,
        averages: fullData.deptInfo.averages
      },
      initialNeighborCities: neighborList,
      benchmarkCities,
      regionalInfo: fullData.regionalInfo
    };

  } catch (e) {
    console.error("Local data error:", e);
    return null;
  }
}


import { POPULAR_CITIES } from '../../../lib/water-utils';

export const revalidate = 86400; // Cache de 24h après la première visite

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const cleanSlug = slug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');
  if (slug !== cleanSlug) return {}; // La redirection sera gérée par la page
  
  const summary = await getLocalData(cleanSlug);
  if (!summary) return { title: "Ville non trouvée" };

  const officialName = summary.cityName;
  const score = summary.crystal?.final || 'N/A';
  const label = summary.crystal?.label || 'ANALYSE';
  const statusClass = summary.crystal?.label?.toLowerCase().replace(/\s/g, '-') || 'status-good';

  const ogImageUrl = `/api/og?city=${encodeURIComponent(officialName)}&score=${score}&label=${encodeURIComponent(label)}&status=${statusClass}`;

  return {
    title: `Qualité de l'eau potable à ${officialName} (2026) | Crystal Score`,
    description: `Analyse complète de la qualité de l'eau à ${officialName} en 2026. Découvrez le verdict officiel ARS, les taux de pesticides et de PFAS détectés dans votre réseau de distribution.`,
    alternates: {
      canonical: `${DOMAIN}/ville/${cleanSlug}`,
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
  
  // 1. Normalisation du slug (sécurité SEO)
  const cleanSlug = slug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');
  
  // 2. Redirection 301 si le slug est mal formé
  if (slug !== cleanSlug) {
    redirect(`/ville/${cleanSlug}`);
  }

  // 3. Récupération des données locales uniquement
  const summary = await getLocalData(cleanSlug);
  
  // 4. Si aucune donnée locale n'est trouvée -> Vraie 404
  if (!summary) {
    notFound();
  }

  const officialName = summary.cityName;
  const nomReseau = (summary.meta?.nom_distributeur || summary.meta?.nom_reseau || officialName)
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <>
      <Navbar />
      <CityHero 
        cityName={officialName}
        dpt={summary.meta?.code_departement || ''}
        dateAnalyse={summary.meta?.date_prelevement ? new Date(summary.meta.date_prelevement).toLocaleDateString('fr-FR') : '2026'}
        score={summary.crystal?.final || '--'}
        label={summary.crystal?.label || 'ANALYSE'}
        nomReseau={nomReseau}
      />
      <WaterApp initialCity={officialName} initialData={summary} />
    </>
  );
}


