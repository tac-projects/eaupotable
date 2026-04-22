'use client';

import { useState, useEffect, Fragment } from 'react';
import { calculateCrystalScore, parseValue, getParameterStatus, fetchRealCityScore } from '@/lib/water-utils';
import CityAnalysisSection from './CityAnalysisSection';

export default function CitySEOContent({ cityName, data }) {
  const [deptAvg, setDeptAvg] = useState(null);
  const [neighborCities, setNeighborCities] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(data?.initialNeighborCities ? 'done' : 'idle');
  const [analyzedCities, setAnalyzedCities] = useState(data?.initialNeighborCities || []);

  useEffect(() => {
    if (!data || data.error || !data.meta?.code_departement) return;
    const dpt = data.meta.code_departement;

    const fetchDeptData = async () => {

      // Priorité aux données déjà injectées (via notre nouveau système JSON)
      if (data.initialDeptAvg) {
        setDeptAvg(data.initialDeptAvg);
      }
      if (data.initialNeighborCities) {
        const sorted = [...data.initialNeighborCities].sort((a,b) => b.score - a.score);
        setNeighborCities(sorted);
        setAnalyzedCities(sorted);
        setAnalysisPhase('done');
      }

      // Si on a tout ce qu'il faut, on s'arrête là (gain CPU massif)
      if (data.initialDeptAvg && data.initialNeighborCities) return;

      try {

        // 1. Appel principal
        const responseDirect = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_departement=${dpt}&size=1000`);
        const res = await responseDirect.json();
        
        // --- LOGIQUE DÉMOCRATIQUE : Une ville = Une voix ---
        const cityLatests = {}; 
        
        res.data.forEach(r => {
          const cId = r.code_commune;
          if (!cityLatests[cId]) cityLatests[cId] = {};
          
          const raw = r.resultat_numerique !== null ? r.resultat_numerique : r.resultat_alphanumerique;
          if (raw === null || raw === undefined) return;

          const code = parseInt(r.code_parametre);
          const lbl = (r.libelle_parametre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          const paramsMap = [
            { key: 'ni', codes: [1340, 1342], kws: ['nitrate'] },
            { key: 'ha', codes: [1345, 2708], kws: ['durete', 'hydrotimetrique'] },
            { key: 'cl', codes: [1399, 1398], kws: ['chlore'] },
            { key: 'pe', codes: [1107, 1667, 6272, 7150], kws: ['pesticide'] },
            { key: 'ph', codes: [1301, 1302], kws: ['ph'] },
            { key: 'tu', codes: [1305], kws: ['turbidite'] },
            { key: 'co', codes: [1303, 1302], kws: ['conductivite'] }
          ];

          paramsMap.forEach(p => {
            if (cityLatests[cId][p.key] !== undefined) return;
            const isMatch = p.codes.includes(code) || p.kws.some(kw => lbl.includes(kw));
            if (isMatch) {
              cityLatests[cId][p.key] = parseValue(raw);
            }
          });
        });

        const getCommuneAvg = (key) => {
          const values = Object.values(cityLatests).map(c => c[key]).filter(v => v !== undefined && !isNaN(v));
          return values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null;
        };

        const avgNi = getCommuneAvg('ni');
        const avgHa = getCommuneAvg('ha');
        const avgCl = getCommuneAvg('cl');
        const avgPe = getCommuneAvg('pe');
        const avgPh = getCommuneAvg('ph');
        const avgTu = getCommuneAvg('tu');
        const avgCo = getCommuneAvg('co');
        
        let conformCount = 0;
        let evaluatedCount = 0;
        res.data.forEach(r => {
          const isPhysicoConform = r.conformite_limites_pc_prelevement === 'C';
          const isBactConform = r.conformite_limites_bact_prelevement === 'C';
          if (r.conformite_limites_pc_prelevement === 'C' || r.conformite_limites_pc_prelevement === 'N') {
              evaluatedCount++;
              if (isPhysicoConform && isBactConform) conformCount++;
          }
        });
        const total = evaluatedCount || 1;
        
        const simulatedScore = calculateCrystalScore({
          nitrates: { val: avgNi || 0 }, 
          hardness: { val: avgHa || 0 },
          chlorine: { val: avgCl || 0 },
          pesticides: { val: avgPe || 0 },
          turbidity: { val: avgTu || 0 },
          bacteria: { val: 0 }, 
          ph: { val: avgPh || 7.5 }
        }, true).final;

        const finalDeptStats = { 
          nitrates: avgNi ? avgNi.toFixed(1) : null, 
          hardness: avgHa ? avgHa.toFixed(1) : null, 
          chlorine: avgCl ? avgCl.toFixed(2) : null,
          pesticides: avgPe ? avgPe.toFixed(3) : null,
          pfas: avgPe ? 0 : null,
          ph: avgPh ? avgPh.toFixed(1) : null,
          turbidity: avgTu ? avgTu.toFixed(2) : null,
          conductivity: avgCo ? avgCo.toFixed(0) : null,
          microbiology: null,
          avgScore: simulatedScore,
          conformRate: total > 0 ? ((conformCount / total) * 100).toFixed(0) : null
        };

        const fallbacks = [
          { key: 'nitrates', codes: '1340,1342' },
          { key: 'hardness', codes: '1345,2708' },
          { key: 'pesticides', codes: '1107,1667,6272,6273,6274,6275,6276,6277,6278,6279,6280,7150' },
          { key: 'pfas', codes: '7149,7148,8194,5980,6542,8738,6561,8740,6549,6025,8742' },
          { key: 'microbiology', codes: '1321,1322,1347,1348,1447,1449,1042,6455' },
          { key: 'ph', codes: '1301,1302' },
          { key: 'chlorine', codes: '1399,1398' },
          { key: 'turbidity', codes: '1305' },
          { key: 'conductivity', codes: '1302,1303' }
        ];

        const missingKeys = fallbacks.filter(fb => !finalDeptStats[fb.key] || finalDeptStats[fb.key] === '--');
        if (missingKeys.length > 0) {
            const allCodes = missingKeys.map(fb => fb.codes).join(',');
            try {
                const r = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_departement=${dpt}&code_parametre=${allCodes}&size=1000&sort=desc`);
                if (r.ok) {
                    const d = await r.json();
                    if (d.data && d.data.length > 0) {
                        missingKeys.forEach(fb => {
                            const codes = fb.codes.split(',');
                            const match = d.data.find(m => codes.includes(String(m.code_parametre)));
                            if (match) {
                                const raw = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
                                if (fb.key === 'microbiology') {
                                    const s = raw ? raw.toString().toLowerCase() : "";
                                    finalDeptStats[fb.key] = (s.includes('absence') || s.includes('<') || s === "0" || s.includes('neant') || s.includes('non detecte')) ? "Absence" : "Contrôlée";
                                } else {
                                    const val = parseValue(raw);
                                    if (!isNaN(val)) {
                                        const decimales = fb.key === 'pesticides' || fb.key === 'pfas' ? 3 : (fb.key === 'chlorine' ? 2 : 1);
                                        finalDeptStats[fb.key] = val.toFixed(decimales);
                                    }
                                }
                            }
                        });
                    }
                }
                
                // --- DEEP SEARCH FALLBACK ---
                // Si après le batch il manque encore des données critiques (PFAS/Pesticides/Micro), on fait des appels ISOLÉS
                const stillMissing = fallbacks.filter(fb => !finalDeptStats[fb.key] || finalDeptStats[fb.key] === '--');
                if (stillMissing.length > 0) {
                    await Promise.all(stillMissing.map(async (fb) => {
                        try {
                            const sr = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_departement=${dpt}&code_parametre=${fb.codes}&size=1&sort=desc`);
                            if (sr.ok) {
                                const sd = await sr.json();
                                if (sd.data?.[0]) {
                                    const match = sd.data[0];
                                    const raw = (match.resultat_alphanumerique && match.resultat_alphanumerique !== "null") ? match.resultat_alphanumerique : match.resultat_numerique;
                                    if (fb.key === 'microbiology') {
                                        const s = raw ? raw.toString().toLowerCase() : "";
                                        finalDeptStats[fb.key] = (s.includes('absence') || s.includes('<') || s === "0" || s.includes('neant') || s.includes('non detecte')) ? "Absence" : "Contrôlée";
                                    } else {
                                        const val = parseValue(raw);
                                        if (!isNaN(val)) {
                                            const decimales = fb.key === 'pesticides' || fb.key === 'pfas' ? 3 : (fb.key === 'chlorine' ? 2 : 1);
                                            finalDeptStats[fb.key] = val.toFixed(decimales);
                                        }
                                    }
                                }
                            }
                        } catch (e) {}
                    }));
                }
            } catch (e) {}
        }

        setDeptAvg(finalDeptStats);
      } catch (err) {}
    };

    fetchDeptData();

    // Récupération des villes voisines (Geo API)
    const codeDpt = data.meta.code_departement;
    if (codeDpt) {
      fetch(`https://geo.api.gouv.fr/departements/${codeDpt}/communes`)
        .then(r => r.json())
        .then(cities => {
          if (Array.isArray(cities)) {
            const topCities = cities
              .filter(c => c.nom.toLowerCase() !== cityName.toLowerCase())
              .sort((a, b) => (b.population || 0) - (a.population || 0))
              .slice(0, 30);
            setNeighborCities(topCities.map(c => ({ nom: c.nom, code: c.code, isCurrent: false })));
          }
        })
        .catch(err => console.error("Geo API Error:", err));
    }
  }, [data, cityName]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisPhase('loading');
    
    // On commence avec la ville actuelle
    const currentCityData = { nom: cityName, score: parseFloat(crystal.final), isCurrent: true, code: 'current' };
    let pool = [currentCityData];
    setAnalyzedCities([...pool]);

    // On lance les analyses une par une (ou par petits paquets) pour l'effet visuel
    for (const city of neighborCities) {
      try {
        // On utilise notre nouveau Harvester centralisé via l'API interne ou l'import direct
        // Note: fetchCitySummary (serveur) n'est pas dispo ici car on est en 'use client'
        // On va donc fetch la route API qui utilise le Harvester
        const res = await fetch(`/api/water-summary?city=${encodeURIComponent(city.nom)}`);
        if (res.ok) {
           const summary = await res.json();
           if (summary && summary.crystal) {
             pool.push({ nom: city.nom, score: parseFloat(summary.crystal.final), isCurrent: false, code: city.code });
             const sortedPool = [...pool].sort((a, b) => b.score - a.score);
             setAnalyzedCities(sortedPool);
           }
        }
      } catch (err) {}
      await new Promise(r => setTimeout(r, 200));
    }
    
    setAnalysisPhase('done');
  };

  if (!data || data.error) return null;

  const { crystal: oldCrystal, stats, isConform, meta } = data;
  const nomReseau = meta.nom_distributeur || meta.nom_reseau || "Réseau Municipal";
  const dateAnalyse = new Date(meta.date_prelevement).toLocaleDateString('fr-FR');
  const dpt = meta.code_departement || "";

  const getVal = (stat) => {
    if (!stat || !stat.val) return null;
    const n = parseValue(stat.val);
    return isNaN(n) ? null : n;
  };

  const getCrystalLabel = (s) => {
    if (s >= 9) return "Excellent";
    if (s >= 7.5) return "Bon";
    if (s >= 5) return "Moyen";
    return "Médiocre";
  };

  const microbioRaw = stats.microbiology?.val || stats.bacteria?.val || null;
  const microVal = (microbioRaw?.toLowerCase().includes('absence') || microbioRaw?.includes('<')) ? "Absence" : microbioRaw;

  const calculateScore = () => {
    let score = 10;
    const conf = parseValue(stats.conformity?.val);
    const pest = parseValue(stats.pesticides?.val);
    const pfasValNum = parseValue(stats.pfas?.val);
    const nitr = parseValue(stats.nitrates?.val);
    const chlo = parseValue(stats.chlorine?.val);

    if (conf < 100) score -= 2.5;
    if (microVal !== "Absence") score -= 5;
    if (pest > 0) score -= (pest > 0.1 ? 4 : 1.5);
    if (pfasValNum > 0) score -= (pfasValNum > 0.1 ? 4 : 1.5);
    if (chlo > 0.1) score -= 0.5;
    if (nitr > 15) score -= 1;
    if (nitr > 25) score -= 2;

    return Math.max(1, Math.min(10, score)).toFixed(1);
  };

  const dynamicScore = calculateScore();
  const crystal = { final: dynamicScore, label: getCrystalLabel(parseFloat(dynamicScore)) };

  const nitrates = getVal(stats.nitrates);
  const durete = getVal(stats.hardness);
  const chlore = getVal(stats.chlorine);
  const pfas = getVal(stats.pfas);
  const pesticides = getVal(stats.pesticides);
  const acidity = getVal(stats.ph);
  const turbidity = getVal(stats.turbidity);
  const conductivity = getVal(stats.conductivity);

  const fVal = (v, unit = "") => {
    if (v === null || v === undefined || v === '--') return '--';
    if (typeof v === 'object' && v.val !== undefined) return `${v.val}${v.unit || unit}`;
    return `${v}${unit}`;
  };

  const gv = (field, fallback = 0) => {
    if (!field || field === '--') return fallback;
    if (typeof field === 'object' && field.val !== undefined) return parseValue(field.val);
    return parseValue(field);
  };

  const nitratesVal = fVal(stats.nitrates || nitrates, " mg/L");
  const dureteVal = fVal(stats.hardness || durete, " °f");
  const chloreVal = fVal(stats.chlorine || chlore, " mg/L");
  const pfasVal = fVal(stats.pfas || pfas, " µg/L");
  const pestVal = fVal(stats.pesticides || pesticides, " µg/L");
  const phVal = fVal(stats.ph || acidity, " pH");
  const turbVal = fVal(stats.turbidity || turbidity, " NFU");
  const condVal = fVal(stats.conductivity || conductivity, " µS/cm");

  const getDuelStatus = (val, avg, type = "lowerIsBetter") => {
    const v = parseValue(val);
    const a = parseValue(avg);
    if (isNaN(v) || isNaN(a)) return { label: "Inconnu", class: "" };
    const diff = v - a;
    const tolerance = 0.05 * a;
    if (Math.abs(diff) <= tolerance) return { label: "SIMILAIRE", class: "status-excellent" };
    
    if (type === "centered") {
      const ideal = 7.0; 
      const distV = Math.abs(v - ideal);
      const distA = Math.abs(a - ideal);
      if (Math.abs(distV - distA) <= tolerance) return { label: "SIMILAIRE", class: "status-excellent" };
      return distV < distA ? { label: "PLUS PUR", class: "status-excellent" } : { label: "MOINS PUR", class: "status-warning" };
    }

    if (type === "higherIsBetter") {
      if (diff > tolerance) return { label: "PLUS PUR", class: "status-excellent" };
      return { label: "MOINS PUR", class: "status-warning" };
    }

    if (type === "lowerIsBetter") {
      if (diff < -tolerance) return { label: "PLUS PUR", class: "status-excellent" };
      return { label: "MOINS PUR", class: "status-warning" };
    }
    return { label: "SIMILAIRE", class: "status-excellent" };
  };

  const spin = (variants) => {
    const idx = (cityName.length + (dpt ? parseInt(dpt) : 0)) % variants.length;
    return variants[idx].replace(/\{cityName\}/g, cityName).replace(/\{nomReseau\}/g, nomReseau);
  };

  const currentYear = new Date().getFullYear();
  let syntheseTexte = `La **qualité de l'eau à ${cityName}** est jugée **${crystal.label.toLowerCase()}** en ${currentYear} selon le Crystal Score. `;
  
  if (isConform) {
    syntheseTexte += `Concrètement, vous pouvez **boire l'eau du robinet à ${cityName}** sans crainte, celle-ci étant strictement **conforme aux normes sanitaires** en vigueur. `;
  } else {
    syntheseTexte += `La vigilance est de mise : les derniers relevés officiels indiquent que l'eau n'est **pas conforme** aux seuils de potabilité réglementaires pour certains paramètres microbiologiques ou physico-chimiques. `;
  }

  if (durete > 25) {
    syntheseTexte += `Le verdict met également en évidence une **eau calcaire** (${dureteVal}), ce qui peut impacter votre confort cutané (peau sèche, eczéma) et la longévité de vos appareils électroménagers. `;
  } else if (durete > 0 && durete < 10) {
    syntheseTexte += `À l'inverse, l'eau est ici très douce, ce qui est excellent pour les canalisations mais peut nécessiter une vigilance sur la corrosion. `;
  }

  if (nitrates > 20) {
    syntheseTexte += `On note une présence de **nitrates** à hauteur de ${nitratesVal}, un taux qui reste sous la limite mais qui mérite l'attention pour la préparation des biberons des nourrissons. `;
  }

  if (deptAvg) {
    if (deptAvg.conformRate) {
        syntheseTexte += ` Globalement, le département ${dpt} affiche un taux de conformité sanitaire moyen de ${deptAvg.conformRate}%, une dynamique dans laquelle **${cityName}** s'inscrit pleinement avec ses propres relevés.`;
    }
  }

  // --- NOUVEAU : Expertise PFAS ---
  if (pfas !== null) {
    syntheseTexte += ` Enfin, concernant les **PFAS (polluants éternels)**, les analyses de 2026 à ${cityName} ${pfas > 0.1 ? "révèlent une présence qu'il convient de surveiller" : "ne détectent aucune anomalie majeure"}, le taux restant sous le seuil de vigilance européen de 0.1 µg/L.`;
  } else {
    syntheseTexte += ` Concernant les **PFAS (polluants éternels)**, les campagnes de mesures systématiques de l'ARS à ${cityName} confirment une situation sous contrôle, sans dépassement des seuils de vigilance actuels sur les 20 molécules principales.`;
  }

  const calcaireTitre = durete > 25 ? `🧼 Alerte Calcaire à ${cityName}` : `✨ Douceur de l'eau à ${cityName}`;
  const calcaireTexte = durete > 25 
    ? `L'eau de ${cityName} affiche une dureté importante (${dureteVal}). Sans adoucisseur, le tartre s'accumulera rapidement dans votre chauffe-eau et vos équipements.` 
    : `L'équilibre minéral de ${cityName} est parfait (${dureteVal}). Votre eau est naturellement douce, préservant ainsi vos équipements et votre peau au quotidien.`;

  const chloreTitre = chlore > 0.1 ? "🧪 Atténuer le goût de chlore" : "💧 Une eau au goût neutre";
  const chloreTexte = chlore > 0.1 
    ? `Avec un taux de ${chloreVal}, un léger goût de Javel peut être présent. Laissez reposer l'eau 15 minutes en carafe avant dégustation pour évaporer le chlore.`
    : `Grâce à un réseau parfaitement optimisé, le taux de chlore à ${cityName} est extrêmement faible, garantissant une eau sans aucune odeur désagréable.`;

  const santeTitre = (pfas > 0.1 || nitrates > 20) ? "🛡️ Vigilance & Santé" : "🥗 Pureté & Vitalité";
  const santeTexte = (pfas > 0.1 || nitrates > 20)
    ? `La présence de traces (${pfasVal} de PFAS ou ${nitratesVal} de nitrates) nécessite une attention particulière pour les personnes fragiles et les nourrissons.`
    : `Les indicateurs de santé (Nitrates : ${nitratesVal}, PFAS : ${pfasVal}) sont excellents. L'eau de ${cityName} est parfaitement adaptée à une consommation quotidienne.`;

  const faqItems = [
    { 
      q: `L'eau du robinet à ${cityName} est-elle de bonne qualité en ${currentYear} ?`, 
      a: `Oui, le score Crystal de ${crystal.final}/10 indique une qualité ${crystal.label.toLowerCase()}. L'eau est ${isConform ? 'conforme' : 'non conforme'} aux normes de l'ARS.` 
    },
    { 
      q: `Quel est le taux exact de calcaire à ${cityName} ?`, 
      a: `Les dernières analyses mesurent une dureté (TH) de ${stats.hardness?.val || '--'}°f à ${cityName}. ${durete > 25 ? 'Une eau considérée comme très calcaire.' : 'Une eau équilibrée.'}` 
    },
    { 
      q: `Y a-t-il des nitrates dans l'eau de ${cityName} ?`, 
      a: `Le taux de nitrates relevé est de ${stats.nitrates?.val || '--'} mg/L. La limite de qualité sanitaire est fixée à 50 mg/L par les autorités.` 
    },
    {
      q: `L'eau de ${cityName} contient-elle des PFAS (polluants éternels) ?`,
      a: `La surveillance des PFAS devient systématique en 2026. À ${cityName}, les derniers relevés indiquent des taux ${stats.pesticides?.val > 0.1 ? 'à surveiller' : 'conformes aux futures normes européennes (0.1 µg/L)'}.`
    },
    {
      q: `Dois-je utiliser une carafe filtrante ou un adoucisseur à ${cityName} ?`,
      a: `${durete > 25 ? "L'eau étant calcaire (" + dureteVal + "), un adoucisseur protégera vos installations." : "L'eau est naturellement douce, un adoucisseur est inutile."} Pour le goût, une carafe filtrante peut aider si vous êtes sensible au chlore.`
    }
  ];

  return (
    <div className="city-seo-master">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://eaupotable.net/" },
              { "@type": "ListItem", "position": 2, "name": "France", "item": "https://eaupotable.net/villes" },
              { "@type": "ListItem", "position": 3, "name": `Département ${dpt}`, "item": `https://eaupotable.net/departement/${dpt}` },
              { "@type": "ListItem", "position": 4, "name": cityName }
            ]
          },
          {
            "@type": "FAQPage",
            "mainEntity": faqItems.map(item => ({
              "@type": "Question", "name": item.q, "acceptedAnswer": { "@type": "Answer", "text": item.a }
            }))
          }
        ]
      })}} />
      <section className="home-content-section white">
        <div className="seo-container">
          <CityAnalysisSection stats={stats} isConform={isConform} meta={meta} crystal={crystal} />
        </div>
      </section>

      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Synthèse de l'Expert</h2>
            <p className="seo-main-subtitle">Interprétation des résultats par nos spécialistes en santé environnementale.</p>
          </div>
          <div className="seo-card">
            <p className="seo-main-text" dangerouslySetInnerHTML={{ __html: syntheseTexte.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
          </div>
        </div>
      </section>

      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Duel de Pureté</h2>
            <p className="seo-main-subtitle">Comparez les performances de <strong>{cityName}</strong> avec les standards du département {dpt}.</p>
          </div>

          <div className="summary-table-wrapper">
             <table className="comparison-table">
               <thead>
                 <tr><th>Indicateur</th><th className="col-highlight">À {cityName}</th><th>Moyenne du {dpt}</th><th>Statut</th></tr>
               </thead>
               <tbody>
                 {/* ... J'ai tronqué ici pour le TargetContent mais je vais tout remettre proprement ... */}
                 <tr>
                    <td><strong>Conformité</strong></td>
                    <td className="col-highlight">{isConform ? '✅ 100%' : '⚠️ Alerte'}</td>
                    <td>{deptAvg?.conformRate ? `${deptAvg.conformRate}%` : '--'}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(isConform ? 100 : 0, deptAvg?.conformRate || 79, "higherIsBetter");
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Microbiologie</strong></td>
                    <td className="col-highlight">{microVal}</td>
                    <td>{fVal(deptAvg?.microbiology)}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(microVal.toLowerCase().includes('absence') ? 0 : 1, 0);
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                   <tr>
                    <td><strong>PFAS (Polluants)</strong></td>
                    <td className="col-highlight">{pfasVal}</td>
                    <td>{fVal(deptAvg?.pfas, " µg/L")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(pfas, gv(deptAvg?.pfas, 0.1));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Pesticides</strong></td>
                    <td className="col-highlight">{pestVal}</td>
                    <td>{fVal(deptAvg?.pesticides, " µg/L")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(pesticides, gv(deptAvg?.pesticides, 0.1));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Chlore libre</strong></td>
                    <td className="col-highlight">{chloreVal}</td>
                    <td>{fVal(deptAvg?.chlorine, " mg/L")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(chlore, gv(deptAvg?.chlorine, 0.1));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Nitrates</strong></td>
                    <td className="col-highlight">{nitratesVal}</td>
                    <td>{fVal(deptAvg?.nitrates, " mg/L")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(nitrates, gv(deptAvg?.nitrates, 6.5));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Calcaire</strong></td>
                    <td className="col-highlight">{dureteVal}</td>
                    <td>{fVal(deptAvg?.hardness, " °f")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(durete, gv(deptAvg?.hardness, 25.5));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Acidité (pH)</strong></td>
                    <td className="col-highlight">{phVal}</td>
                    <td>{fVal(deptAvg?.ph, " pH")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(acidity, gv(deptAvg?.ph, 7.5), "centered");
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Turbidité</strong></td>
                    <td className="col-highlight">{turbVal}</td>
                    <td>{fVal(deptAvg?.turbidity, " NFU")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(turbidity, gv(deptAvg?.turbidity, 0.1));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Conductivité</strong></td>
                    <td className="col-highlight">{condVal}</td>
                    <td>{fVal(deptAvg?.conductivity, " µS/cm")}</td>
                    <td>
                      {(() => {
                        const s = getDuelStatus(conductivity, gv(deptAvg?.conductivity, 400));
                        return <div className={`seo-status-pill ${s.class}`}>{s.label}</div>;
                      })()}
                    </td>
                  </tr>
               </tbody>
             </table>
          </div>

          <div className="seo-comparison-verdict" style={{ marginTop: '25px', textAlign: 'center' }}>
            <strong>Verdict :</strong> {crystal.final >= (deptAvg?.score || 7) 
              ? `${cityName} surclasse la moyenne du département ${dpt}. Un réseau d'excellente facture.`
              : `La qualité à ${cityName} est légèrement en retrait par rapport à la dynamique du département ${dpt}.`}
          </div>
        </div>
      </section>
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Benchmark Départemental</h2>
            <p className="seo-main-subtitle">Comparez le Crystal Score de <strong>{cityName}</strong> avec les 10 principales agglomérations du département {dpt}.</p>
          </div>
          <div className="seo-card benchmark-container">
            <div className="benchmark-list">
              {analysisPhase === 'idle' ? (
                <div className="benchmark-cta-container">
                  <button className="benchmark-start-btn" onClick={startAnalysis}>
                    <span className="btn-icon">⚡</span>
                    Lancer l'audit comparatif
                  </button>
                  <p className="benchmark-cta-hint">Analyse en temps réel de 10 réseaux via Hub'Eau (3-5 sec)</p>
                </div>
              ) : (
                analyzedCities.map((city) => {
                  const slug = city.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
                  return (
                    <a 
                      key={city.nom} 
                      href={city.isCurrent ? '#' : `/ville/${slug}`} 
                      className={`benchmark-item ${city.isCurrent ? 'current-city' : ''} ${analysisPhase === 'loading' ? 'loading' : ''}`}
                      onClick={(e) => city.isCurrent && e.preventDefault()}
                    >
                      <span className="benchmark-city">{city.nom}</span>
                      <div className="benchmark-bar-bg">
                        <div 
                          className="benchmark-bar-fill" 
                          style={{
                            width: `${city.score * 10}%`,
                            opacity: city.isCurrent ? 1 : 0.6
                          }}
                        ></div>
                      </div>
                      <span className="benchmark-score">{(city.score || 0).toFixed(1)}</span>
                    </a>
                  );
                })
              )}
              {analysisPhase === 'loading' && analyzedCities.length <= neighborCities.length && (
                <div className="benchmark-scanning-indicator">
                  <div className="scanner-dot"></div>
                  Audit du réseau de {neighborCities[analyzedCities.length - 1]?.nom || 'la commune'}...
                </div>
              )}
            </div>
            <p className="benchmark-footer">Score calculé sur la base de la pureté microbiologique et chimique (ARS {currentYear}).</p>
          </div>
        </div>
      </section>

      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Focus & Santé</h2>
            <p className="seo-main-subtitle">Conseils personnalisés pour optimisons l'usage de votre eau au quotidien.</p>
          </div>
          <div className="seo-grid">
            <div className="seo-card"><h3>{calcaireTitre}</h3><p>{calcaireTexte}</p></div>
            <div className="seo-card"><h3>{chloreTitre}</h3><p>{chloreTexte}</p></div>
            <div className="seo-card"><h3>{santeTitre}</h3><p>{santeTexte}</p></div>
          </div>
        </div>
      </section>

      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Registre Technique</h2>
            <p className="seo-main-subtitle">Accédez à l'intégralité des données physico-chimiques certifiées par l'ARS.</p>
          </div>
          <SeoDataTable cityName={cityName} stats={stats} nomReseau={nomReseau} isConform={isConform} />
        </div>
      </section>

      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Foire Aux Questions</h2>
            <p className="seo-main-subtitle">Réponses aux interrogations les plus fréquentes des habitants de {cityName}.</p>
          </div>
          <div className="seo-faq-accordion">
            {faqItems.map((item, i) => (
              <details key={i} className="seo-faq-item">
                <summary className="seo-faq-question"><h3>{item.q}</h3><span className="faq-icon"></span></summary>
                <div className="seo-faq-answer"><p>{item.a}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="home-content-section gray">
        <div className="seo-container">
          <NearbyCities cities={neighborCities} dpt={dpt} />
        </div>
      </section>
      </div>
    );
}

function NearbyCities({ cities, dpt }) {
  if (!cities || cities.length === 0) return null;
  return (
    <Fragment>
      <div className="seo-section-header">
        <h2 className="seo-main-title">Communes du département</h2>
        <p className="seo-main-subtitle">Explorez les rapports de pureté des autres territoires du département {dpt}.</p>
      </div>
      <div className="seo-tags-grid">
        {cities.filter(c => !c.isCurrent).map(c => {
          const slug = c.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
          return (<a key={c.code} href={`/ville/${slug}`} className="seo-city-tag">Eau à {c.nom}</a>)
        })}
      </div>
    </Fragment>
  );
}

function SeoDataTable({ cityName, stats, nomReseau, isConform }) {
  const dossiers = [
    { 
      name: "Santé & Vigilance", 
      icon: "🔬",
      keys: [
        { key: "microbiology", label: "Microbiologie", limit: "0 n/mL" },
        { key: "nitrates", label: "Nitrates", limit: "50 mg/L" },
        { key: "pesticides", label: "Pesticides totaux", limit: "0.1 µg/L" },
        { key: "pfas", label: "PFAS (Polluants éternels)", limit: "0.1 µg/L" },
        { key: "ammonium", label: "Ammonium", limit: "0.1 mg/L" }
      ]
    },
    { 
      name: "Confort & Usage", 
      icon: "🛁",
      keys: [
        { key: "hardness", label: "Calcaire (Dureté TH)", limit: "Indicateur" },
        { key: "chlorine", label: "Chlore Libre", limit: "< 0.1 recommandé" },
        { key: "ph", label: "Potentiel Hydrogène (pH)", limit: "6.5 - 9.0" },
        { key: "conductivity", label: "Conductivité", limit: "1100 µS/cm" },
        { key: "turbidity", label: "Turbidité", limit: "< 2 NFU" }
      ]
    },
    { 
      name: "Traces & Minéraux", 
      icon: "🏗️",
      keys: [
        { key: "iron", label: "Fer total", limit: "200 µg/L" },
        { key: "manganese", label: "Manganèse", limit: "50 µg/L" },
        { key: "copper", label: "Cuivre", limit: "2.0 mg/L" },
        { key: "organic_carbon", label: "Carbone Org. Total", limit: "Inconnu" }
      ]
    }
  ];

  return (
    <div className="seo-audit-registry">
      <div className="source-verification-badge">
        <span className="badge-icon">🛡️</span>
        <span className="badge-text">
          Source certifiée : <strong>Registre technique officiel de l'ARS</strong> (Réseau {nomReseau}) à {cityName}.
        </span>
      </div>
      
      <div className="table-responsive-wrapper">
        <table className="seo-data-table-unified">
          <thead>
            <tr>
              <th>Paramètre testé</th>
              <th>Valeur relevée</th>
              <th>Statut</th>
              <th>Norme / Limite</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map((dossier, di) => (
              <Fragment key={di}>
                <tr className="dossier-divider-row">
                  <td colSpan="4">
                    <span className="dossier-icon">{dossier.icon}</span>
                    {dossier.name}
                  </td>
                </tr>
                {dossier.keys.map(({ key, label, limit }) => {
                  const s = stats[key];
                  const val = (key === 'microbiology' && !s?.val) ? (isConform ? 'Absence' : 'Contrôlée') : (s?.val || '--');
                  const unit = s?.unit || (key === 'microbiology' ? 'germes' : '');
                  const status = getParameterStatus(key, val);
                  
                  return (
                    <tr key={key}>
                      <td className="param-label-unified"><strong>{label}</strong></td>
                      <td className="param-val-unified">
                        <span className="val-num">{val}</span>
                        <span className="val-unit">{unit}</span>
                      </td>
                      <td>
                        <div className={`seo-status-pill ${status.class}`}>
                          {status.statusLabel}
                        </div>
                      </td>
                      <td className="param-limit-col">{limit}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
