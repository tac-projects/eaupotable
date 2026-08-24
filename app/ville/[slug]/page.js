import { notFound, permanentRedirect } from 'next/navigation';
import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';
import { calculateCrystalScore } from '../../../lib/water-utils';
import { hashCity } from '../../../lib/content-variants';
import { cache } from 'react';
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://www.eaupotable.net';

// Normalisation identique au makeSlug du build : œ→oe, æ→ae, suppression des accents,
// collapse des tirets. Convertit les slugs hérités accentués/ligaturés (vandœuvre-lès-nancy)
// vers leur forme canonique ASCII (vandoeuvre-les-nancy) de façon déterministe.
const normalizeSlug = (s) => s.toLowerCase()
  .replace(/œ/g, 'oe')
  .replace(/æ/g, 'ae')
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/-$/, '')
  .replace(/^-/, '');

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
    
    // Normalisation de sécurité du slug entrant (même normalisation que makeSlug du build)
    const cleanSlug = normalizeSlug(slug);
    let deptCode = cityIndex[cleanSlug];

    // LOGIQUE DE RÉCUPÉRATION (RECOVERY) :
    // Uniquement des transformations EXACTES qui préservent l'identité de la commune.
    // Interdiction du matching "à la sonorité" (consonnes, inclusion partielle) qui redirigeait
    // vers des homonymes d'autres départements (ex: grandchamp-des-fontaines → grandchamp 08).
    if (!deptCode) {
      const allSlugs = Object.keys(cityIndex);

      // 1. Patchs syntaxiques (tirets surnuméraires hérités de l'ancien makeSlug)
      const noDash = cleanSlug.replace(/-/g, '');
      const noDashMatch = allSlugs.find(s => s.replace(/-/g, '') === noDash);
      if (noDashMatch) return { redirect: noDashMatch };

      // 2. Patch d'inversion d'article (ex: ulmes-les -> les-ulmes, puy-notre-dame-le -> le-puy-notre-dame)
      if (cleanSlug.includes('-')) {
        const parts = cleanSlug.split('-');
        if (parts.length > 1) {
          const lastToFront = [parts[parts.length - 1], ...parts.slice(0, -1)].join('-');
          if (cityIndex[lastToFront]) return { redirect: lastToFront };
        }
      }

      // 3. Slug de collision "base-dept" (ex: saint-cloud-92, aubenton-08) : ancien artefact de
      // dédoublonnage dont l'entrée a disparu de l'index après correction de l'attribution dépt.
      // Les homonymes légitimes restent DANS l'index (ce chemin n'est jamais atteint pour eux) ;
      // si la base existe, c'est la même commune → redirection en 301.
      const suffixMatch = cleanSlug.match(/^(.*)-(\d{2,3}|2[AB])$/);
      if (suffixMatch && cityIndex[suffixMatch[1]]) return { redirect: suffixMatch[1] };

      // 4. Anciens slugs de communes renommées/fusionnées → slug canonique actuel.
      // Liste fermée : aucune redirection "devineresse" au-delà. Une commune absente du jeu de
      // données (fusionnée/supprimée) doit renvoyer une vraie 404, pas une mauvaise cible.
      const legacyRedirects = {
        'arrancy-sur-crusnes': 'arrancy-sur-crusne',
        'castellet-en-luberon': 'castellet',
        'champdeniers': 'champdeniers-saint-denis',
        'corbieres-en-provence': 'corbieres',
        'exideuil-sur-vienne': 'exideuil',
        'grandchamp-des-fontaines': 'grandchamps-des-fontaines',
        'grigny-sur-rhone': 'grigny-69',
        'labatut-figuieres': 'labatut-40',
        'laval-en-belledonne': 'laval',
        'menitre': 'la-menitre',
        'moncourt-fromonville': 'montcourt-fromonville',
        'montignac-lascaux': 'montignac',
        'ponts-de-ce': 'les-ponts-de-ce',
        'rairies': 'les-rairies',
        'tessoualle': 'la-tessoualle',
      };
      const target = legacyRedirects[cleanSlug];
      if (target && cityIndex[target]) return { redirect: target };

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
    let rawCityData = fullData.cities[cleanSlug];

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

    const isConform = rawCityData.isConform !== false;
    
    // RECALCUL DYNAMIQUE : On recalcule le score et les labels pour garantir la prise en compte 
    // des nouvelles règles métier (labels masculins, arrondis) sans attendre un nouveau crawl.
    const recalculatedCrystal = calculateCrystalScore(cityData.stats, isConform);
    cityData.crystal = recalculatedCrystal;

    // 1. Liste pour le Benchmark (Top 10 des plus grandes villes)
    let benchmarkCities = [];
    let isMetropolis = false;

    if (deptCode === '75') {
      try {
        const metroPath = path.join(process.cwd(), 'public', 'data', 'metropolis.json');
        if (fs.existsSync(metroPath)) {
          const metroData = JSON.parse(fs.readFileSync(metroPath, 'utf8'));
          benchmarkCities = metroData.map(c => ({
            nom: c.name,
            score: parseFloat(c.score),
            code: c.slug,
            isCurrent: c.slug === cleanSlug || c.slug === slug
          }));
          isMetropolis = true;
        }
      } catch (e) {
        console.error("Error loading metropolis data:", e);
      }
    }

    if (benchmarkCities.length === 0) {
      benchmarkCities = (fullData.deptInfo.topCities || [])
        .map(c => ({
          nom: c.name,
          score: c.score,
          code: c.slug,
          isCurrent: c.slug === cleanSlug || c.slug === slug
        }));
    }

    benchmarkCities.sort((a, b) => b.score - a.score); // Tri par score pour le classement

    // 2. Liste pour le maillage SEO (Top 10 + 20 au hasard = 30 villes)
    const otherCities = Object.entries(fullData.cities)
      .filter(([cSlug]) => !benchmarkCities.some(bc => bc.code === cSlug))
      .map(([cSlug, cData]) => ({
        nom: cData.cityName,
        score: cData.crystal?.final || 0,
        code: cSlug,
        isCurrent: cSlug === cleanSlug || cSlug === slug
      }));

    const random20 = otherCities
      .sort((a, b) => (hashCity(a.code, slug) % 1000) - (hashCity(b.code, slug) % 1000))
      .slice(0, 20);

    const neighborList = isMetropolis ? [
      { name: "Marseille", slug: "marseille" },
      { name: "Lyon", slug: "lyon" },
      { name: "Toulouse", slug: "toulouse" },
      { name: "Nice", slug: "nice" },
      { name: "Nantes", slug: "nantes" },
      { name: "Montpellier", slug: "montpellier" },
      { name: "Strasbourg", slug: "strasbourg" },
      { name: "Bordeaux", slug: "bordeaux" },
      { name: "Lille", slug: "lille" },
      { name: "Rennes", slug: "rennes" },
      { name: "Reims", slug: "reims" },
      { name: "Saint-Étienne", slug: "saint-etienne" },
      { name: "Le Havre", slug: "le-havre" },
      { name: "Toulon", slug: "toulon" },
      { name: "Grenoble", slug: "grenoble" },
      { name: "Dijon", slug: "dijon" },
      { name: "Angers", slug: "angers" },
      { name: "Nîmes", slug: "nimes" },
      { name: "Villeurbanne", slug: "villeurbanne" },
      { name: "Saint-Denis", slug: "saint-denis" },
      { name: "Aix-en-Provence", slug: "aix-en-provence" },
      { name: "Le Mans", slug: "le-mans" },
      { name: "Clermont-Ferrand", slug: "clermont-ferrand" },
      { name: "Brest", slug: "brest" },
      { name: "Tours", slug: "tours" },
      { name: "Amiens", slug: "amiens" },
      { name: "Limoges", slug: "limoges" },
      { name: "Annecy", slug: "annecy" },
      { name: "Perpignan", slug: "perpignan" }
    ].map(v => ({ nom: v.name, code: v.slug, isCurrent: false })) : [...benchmarkCities, ...random20];

    return {
      ...cityData,
      isConform,
      isMetropolis,
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
  
  const cleanSlug = normalizeSlug(slug);
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
import CityJsonLd from '../../components/CityJsonLd';

export default async function CityPage({ params }) {
  const { slug } = await params;
  
  // 1. Normalisation du slug (sécurité SEO) : convertit les formes héritées
  // (accents/ligatures, double tirets) vers la forme canonique ASCII.
  const cleanSlug = normalizeSlug(slug);

  // 2. Récupération des données locales uniquement
  const result = await getLocalData(cleanSlug);
  
  // 2bis. Gestion de la redirection de récupération
  if (result?.redirect) {
    permanentRedirect(`/ville/${result.redirect}`);
  }

  const summary = result;

  // 3. Si aucune donnée locale n'est trouvée -> Vraie 404
  if (!summary) {
    notFound();
  }

  // 4. Redirection 301 si le slug entrant n'était pas dans sa forme canonique
  // (ex: vandœuvre-lès-nancy -> vandoeuvre-les-nancy). Vérifié APRÈS la résolution
  // pour ne jamais rediriger vers un slug invalide (évite les chaînes à 2 sauts).
  if (slug !== cleanSlug) {
    permanentRedirect(`/ville/${cleanSlug}`);
  }

  const officialName = summary.cityName;
  const nomReseau = (summary.meta?.nom_distributeur || summary.meta?.nom_reseau || officialName)
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <>
      <CityJsonLd
        cityName={officialName}
        cleanSlug={cleanSlug}
        dpt={summary.meta?.code_departement || ''}
        isConform={summary.isConform}
        crystal={summary.crystal}
        stats={summary.stats}
      />
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


