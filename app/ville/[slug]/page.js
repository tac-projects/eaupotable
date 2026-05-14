import { notFound, permanentRedirect } from 'next/navigation';
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
    let deptCode = cityIndex[cleanSlug] || cityIndex[slug];
    
    // LOGIQUE DE RÉCUPÉRATION (RECOVERY) :
    // Si le slug n'est pas trouvé, on tente des méthodes de secours (Fuzzy Matching)
    if (!deptCode) {
      const allSlugs = Object.keys(cityIndex);
      
      // 1. Normalisation ultra-agressive (on ne garde que les consonnes et chiffres pour le "son")
      const fuzzy = (s) => s.toLowerCase().replace(/[aeiouyœæ]/g, '').replace(/-+/g, '');
      const cleanFuzzy = fuzzy(cleanSlug);
      
      const fuzzyMatch = allSlugs.find(s => fuzzy(s) === cleanFuzzy);
      if (fuzzyMatch) return { redirect: fuzzyMatch };

      // 2. Patchs syntaxiques (tirets surnuméraires hérités de l'ancien makeSlug)
      // On tente de supprimer les tirets qui pourraient être des ligatures mal gérées
      const noDash = cleanSlug.replace(/-/g, '');
      const noDashMatch = allSlugs.find(s => s.replace(/-/g, '') === noDash);
      if (noDashMatch) return { redirect: noDashMatch };

      // 3. Patch d'inversion d'article (ex: ulmes-les -> les-ulmes, puy-notre-dame-le -> le-puy-notre-dame)
      if (cleanSlug.includes('-')) {
        const parts = cleanSlug.split('-');
        if (parts.length > 1) {
          const lastToFront = [parts[parts.length - 1], ...parts.slice(0, -1)].join('-');
          if (cityIndex[lastToFront]) return { redirect: lastToFront };
        }
      }

      // 4. Recherche par inclusion (ex: saint-ouen-sur-seine -> saint-ouen)
      const partialMatch = allSlugs.find(s => 
        (cleanSlug.startsWith(s + '-') || s.startsWith(cleanSlug + '-')) && 
        Math.abs(s.length - cleanSlug.length) < 20
      );
      if (partialMatch) return { redirect: partialMatch };

      return null;
    }

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
    
    // On cherche la ville par son slug normalisé dans le fichier (évite les 404 sur les majuscules)
    let rawCityData = fullData.cities[cleanSlug] || fullData.cities[slug];

    // GESTION DES HOMONYMES : Si non trouvé, on tente de retirer le suffixe de département (ex: apremont-01 -> apremont)
    // Cela permet d'avoir des URLs uniques dans l'index global tout en gardant des clés simples dans les fichiers JSON.
    if (!rawCityData && cleanSlug.includes('-')) {
      const parts = cleanSlug.split('-');
      const lastPart = parts[parts.length - 1].toUpperCase();
      // Test si le dernier segment est un code département (ex: 01, 44, 974, 2A, 2B)
      if (/^\d{2,3}$|^2[AB]$/.test(lastPart)) {
        const baseSlug = parts.slice(0, -1).join('-');
        rawCityData = fullData.cities[baseSlug];
      }
    }

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
      prix: rawCityData.prix || null,
      meta: {
        code_departement: rawCityData.meta?.code_departement,
        date_prelevement: rawCityData.meta?.date_prelevement,
        nom_distributeur: rawCityData.meta?.nom_distributeur,
        nom_reseau: rawCityData.meta?.nom_reseau,
        conclusion: rawCityData.meta?.conclusion,
        insee: rawCityData.meta?.insee
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
  if (!summary || summary.redirect) return { title: "Qualité de l'eau - EauPotable.net" };

  const officialName = summary.cityName;
  const score = summary.crystal?.final || 'N/A';
  const label = summary.crystal?.label || 'ANALYSE';
  const statusClass = summary.crystal?.label?.toLowerCase().replace(/\s/g, '-') || 'status-good';

  const ogImageUrl = `/api/og?city=${encodeURIComponent(officialName)}&score=${score}&label=${encodeURIComponent(label)}&status=${statusClass}`;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
  const currentMonthYear = `${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${currentYear}`;

  const deptCode = summary.meta?.code_departement || '';
  const scoreString = typeof score === 'number' ? score.toFixed(1).replace('.', ',') : score;
  const priceString = summary.prix?.total ? `${summary.prix.total.toFixed(2).replace('.', ',')}€/m³` : null;

  const title = `Qualité de l'eau à ${officialName} (${deptCode}) : Calcaire & PFAS - ${currentMonthYear}`;
  const description = `Votre eau du robinet est-elle saine ? 💧 Score : ${scoreString}/10${priceString ? ` - Prix : ${priceString}` : ''}. Découvrez le bilan complet (Calcaire, Nitrates & PFAS) selon les données de l'ARS.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${DOMAIN}/ville/${cleanSlug}`,
    },
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

import CityHero from '../../components/CityHero';

export default async function CityPage({ params }) {
  const { slug } = await params;
  
  // 1. Normalisation du slug (sécurité SEO)
  const cleanSlug = slug.toLowerCase().replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');
  
  // 2. Redirection 301 si le slug est mal formé
  if (slug !== cleanSlug) {
    permanentRedirect(`/ville/${cleanSlug}`);
  }

  // 3. Récupération des données locales uniquement
  const result = await getLocalData(cleanSlug);
  
  // 3bis. Gestion de la redirection de récupération
  if (result?.redirect) {
    permanentRedirect(`/ville/${result.redirect}`);
  }

  const summary = result;

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


