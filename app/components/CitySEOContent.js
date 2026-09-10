'use client';

import { useMemo, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { parseValue, getParameterStatus, PARAM_ICONS, NATIONAL_STATS } from '@/lib/water-utils';
import { ANALYSIS_CARDS } from '@/lib/params-registry';
import { generateExpertVerdict, FOCUS_VARIANTS, FAQ_VARIANTS, hashCity } from '@/lib/content-variants';

// Correspondance locale paramètre -> accès aux valeurs comparées (métriques ville + agrégats).
const DUEL_METRIC = {
  microbiology: { city: 'microVal', agg: 'micro' },
  nitrates: { city: 'nitratesVal', agg: 'nitrates' },
  pesticides: { city: 'pestVal', agg: 'pest' },
  pfas: { city: 'pfasVal', agg: 'pfas' },
  chlorine: { city: 'chloreVal', agg: 'chlorine' },
  hardness: { city: 'dureteVal', agg: 'hardness' },
  ph: { city: 'phVal', agg: 'ph' },
  turbidity: { city: 'turbVal', agg: 'turbidity' },
  conductivity: { city: 'condVal', agg: 'conductivity' }
};
import dynamic from 'next/dynamic';
import CityLocalContext from './CityLocalContext';
const CityAnalysisSection = dynamic(() => import('./CityAnalysisSection'), { ssr: true });
const BenchmarkAudit = dynamic(() => import('./BenchmarkAudit'), { ssr: true });
const NearbyCities = dynamic(() => import('./NearbyCities'), { ssr: true });

export default function CitySEOContent({ cityName, data }) {
  const pathname = usePathname();
  const pageSlug = pathname ? pathname.replace(/^\/ville\//, '') : '';
  if (!data || data.error || !data.meta) return null;

  const { crystal, stats, isConform, meta, prix } = data;
  const deptAvg = data.initialDeptAvg;
  const neighborCities = data.initialNeighborCities || [];
  const benchmarkCities = data.benchmarkCities || neighborCities.slice(0, 10);
  const regionalInfo = data.regionalInfo || {};
  const dpt = meta.code_departement || "";

  const currentYear = new Date().getFullYear();
  const currentMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());
  const currentMonthYear = `${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${currentYear}`;

  // 1. Formatage du gestionnaire de réseau
  const nomReseau = useMemo(() => {
    const raw = meta?.nom_distributeur || meta?.nom_reseau || "Réseau Municipal";
    if (!raw || raw.includes('ARS') || raw.includes('SISE')) return "le gestionnaire local";
    if (raw === raw.toUpperCase()) {
      return raw.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
    return raw;
  }, [meta]);

  // 2. Préparation des valeurs pour le Duel
  const metrics = useMemo(() => {
    const fVal = (v, unit = "") => {
      if (v === null || v === undefined || v === '--') return '--';
      if (typeof v === 'object' && v.val !== undefined) return `${v.val}${v.unit || unit}`;
      return `${v}${unit}`;
    };

    const microbioRaw = stats.microbiology?.val || stats.bacteria?.val || null;
    const microVal = (microbioRaw?.toLowerCase().includes('absence') || microbioRaw?.includes('<')) ? "Absence" : microbioRaw;
    const regional = regionalInfo.averages || {};

    return {
      microVal,
      nitratesVal: fVal(stats.nitrates, " mg/L"),
      dureteVal: fVal(stats.hardness, " °f"),
      chloreVal: fVal(stats.chlorine, " mg/L"),
      pfasVal: fVal(stats.pfas, " µg/L"),
      pestVal: fVal(stats.pesticides, " µg/L"),
      phVal: fVal(stats.ph, " pH"),
      turbVal: fVal(stats.turbidity, " NFU"),
      condVal: fVal(stats.conductivity, " µS/cm"),
      dept: {
        conform: deptAvg?.conformRate ? `${deptAvg.conformRate}%` : "--",
        micro: fVal(deptAvg?.averages?.microbiology),
        pfas: fVal(deptAvg?.averages?.pfas, " µg/L"),
        pest: fVal(deptAvg?.averages?.pesticides, " µg/L"),
        chlorine: fVal(deptAvg?.averages?.chlorine, " mg/L"),
        nitrates: fVal(deptAvg?.averages?.nitrates, " mg/L"),
        hardness: fVal(deptAvg?.averages?.hardness, " °f"),
        ph: fVal(deptAvg?.averages?.ph, " pH"),
        turbidity: fVal(deptAvg?.averages?.turbidity, " NFU"),
        conductivity: fVal(deptAvg?.averages?.conductivity, " µS/cm")
      },
      region: {
        conform: regionalInfo.conformity ? `${regionalInfo.conformity}%` : "--",
        micro: fVal(regional.microbiology),
        pfas: fVal(regional.pfas, " µg/L"),
        pest: fVal(regional.pesticides, " µg/L"),
        chlorine: fVal(regional.chlorine, " mg/L"),
        nitrates: fVal(regional.nitrates, " mg/L"),
        hardness: fVal(regional.hardness, " °f"),
        ph: fVal(regional.ph, " pH"),
        turbidity: fVal(regional.turbidity, " NFU"),
        conductivity: fVal(regional.conductivity, " µS/cm")
      }
    };
  }, [stats, deptAvg, regionalInfo]);

  // 3. Synthèse de l'Expert (nouveau système à 4 profils + 15 variantes par slot)
  const syntheseTexte = useMemo(() => {
    const cityScore = crystal?.final ?? 0;
    return generateExpertVerdict({
      cityName,
      nomReseau,
      isConform,
      cityScore,
      deptAvg,
      dpt,
      regionalInfo,
      currentYear,
      metrics,
    });
  }, [cityName, nomReseau, isConform, crystal, deptAvg, dpt, regionalInfo, currentYear, metrics]);

  // 4. Focus & Santé (variantes enrichies)
  const focusContent = useMemo(() => {
    const durete = parseValue(stats.hardness?.val);
    const chlore = parseValue(stats.chlorine?.val);
    const nitrates = parseValue(stats.nitrates?.val);
    const pfas = parseValue(stats.pfas?.val);

    const h = hashCity(cityName, dpt);

    // Calcaire
    let calcaire;
    if (durete > 25) {
      const pool = FOCUS_VARIANTS.calcaire.eleve;
      calcaire = pool[h % pool.length];
    } else if (durete > 0 && durete < 10) {
      const pool = FOCUS_VARIANTS.calcaire.douce;
      calcaire = pool[h % pool.length];
    } else {
      const pool = FOCUS_VARIANTS.calcaire.moyenne;
      calcaire = pool[h % pool.length];
    }

    // Chlore
    let chloreObj;
    if (chlore > 0.1) {
      const pool = FOCUS_VARIANTS.chlore.present;
      chloreObj = pool[(h + 1) % pool.length];
    } else {
      const pool = FOCUS_VARIANTS.chlore.absent;
      chloreObj = pool[(h + 1) % pool.length];
    }

    // Santé
    const pfasValNum = parseFloat(String(metrics.pfasVal).replace("<", "").replace(",", "."));
    let sante;
    if (!isConform || (pfasValNum > 0.08) || (nitrates > 30)) {
      const pool = FOCUS_VARIANTS.sante.vigilance;
      sante = pool[(h + 2) % pool.length];
    } else if (pfasValNum > 0.04 || nitrates > 20) {
      const pool = FOCUS_VARIANTS.sante.bonne;
      sante = pool[(h + 2) % pool.length];
    } else {
      const pool = FOCUS_VARIANTS.sante.excellent;
      sante = pool[(h + 2) % pool.length];
    }

    const vars = { cityName, dureteVal: metrics.dureteVal, chloreVal: metrics.chloreVal, nitratesVal: metrics.nitratesVal, pfasVal: metrics.pfasVal };

    return {
      calcaire: {
        titre: calcaire.titre.replace(/\{cityName\}/g, cityName).replace(/\{dureteVal\}/g, metrics.dureteVal),
        texte: calcaire.texte.replace(/\{cityName\}/g, cityName).replace(/\{dureteVal\}/g, metrics.dureteVal),
      },
      chlore: {
        titre: chloreObj.titre.replace(/\{cityName\}/g, cityName).replace(/\{chloreVal\}/g, metrics.chloreVal),
        texte: chloreObj.texte.replace(/\{cityName\}/g, cityName).replace(/\{chloreVal\}/g, metrics.chloreVal),
      },
      sante: {
        titre: sante.titre.replace(/\{cityName\}/g, cityName).replace(/\{nitratesVal\}/g, metrics.nitratesVal).replace(/\{pfasVal\}/g, metrics.pfasVal),
        texte: sante.texte.replace(/\{cityName\}/g, cityName).replace(/\{nitratesVal\}/g, metrics.nitratesVal).replace(/\{pfasVal\}/g, metrics.pfasVal),
      },
    };
  }, [cityName, isConform, stats, metrics, dpt]);

  const faqItems = useMemo(() => {
    const durete = parseValue(stats.hardness?.val);
    const nit = stats.nitrates ? parseValue(stats.nitrates.val) : NaN;
    const pfasVal = stats.pfas?.val || "--";
    const score = crystal?.final ?? "--";
    const h = hashCity(cityName, dpt);

    // Qualité
    let qualiteAnswer;
    if (score >= 7) {
      const pool = FAQ_VARIANTS.qualite.bonne;
      qualiteAnswer = pool[h % pool.length];
    } else if (score >= 4) {
      const pool = FAQ_VARIANTS.qualite.moyenne;
      qualiteAnswer = pool[h % pool.length];
    } else {
      const pool = FAQ_VARIANTS.qualite.mauvaise;
      qualiteAnswer = pool[h % pool.length];
    }
    qualiteAnswer = qualiteAnswer.replace(/\{score\}/g, String(score)).replace(/\{cityName\}/g, cityName).replace(/\{currentYear\}/g, String(currentYear));

    // Calcaire
    let dureteConclusion;
    if (durete > 25) dureteConclusion = FAQ_VARIANTS.calcaireConclusion.dur;
    else if (durete > 10) dureteConclusion = FAQ_VARIANTS.calcaireConclusion.moyen;
    else dureteConclusion = FAQ_VARIANTS.calcaireConclusion.doux;
    const calcaireAnswer = FAQ_VARIANTS.calcaire[0]
      .replace(/\{durete\}/g, String(stats.hardness?.val || "--"))
      .replace(/\{cityName\}/g, cityName)
      .replace(/\{conclusion\}/g, dureteConclusion);

    // PFAS
    const pfasValNum = parseFloat(String(pfasVal).replace("<", "").replace(",", "."));
    const pfasKey = (pfasValNum > 0.08) ? "present" : "absent";
    const pfasAnswer = FAQ_VARIANTS.pfas[pfasKey]
      .replace(/\{cityName\}/g, cityName)
      .replace(/\{pfas\}/g, String(pfasVal));

    // Carafe
    let carafeKey = "moyenne";
    if (durete > 25) carafeKey = "calcaire";
    else if (durete < 10) carafeKey = "douce";
    const carafeAnswer = FAQ_VARIANTS.carafe[carafeKey]
      .replace(/\{cityName\}/g, cityName)
      .replace(/\{dureteVal\}/g, metrics.dureteVal);

    return [
      {
        q: `L'eau du robinet à ${cityName} est-elle de bonne qualité en ${currentYear} ?`,
        a: qualiteAnswer,
      },
      {
        q: `Quel est le taux exact de calcaire à ${cityName} ?`,
        a: calcaireAnswer,
      },
      {
        q: `Y a-t-il des nitrates dans l'eau de ${cityName} ?`,
        a: `Le taux de nitrates relevé est de ${stats.nitrates?.val || "--"} mg/L. La limite de qualité sanitaire est fixée à 50 mg/L par les autorités.`,
        aHtml: nit > 15
          ? `Le taux de nitrates relevé est de <strong>${stats.nitrates?.val || "--"} mg/L</strong> à ${cityName}. La limite de qualité sanitaire est fixée à 50 mg/L : l'eau reste conforme pour les adultes, mais la préparation des biberons appelle à la vigilance au-delà de 15 mg/L. Retrouvez les seuils nourrissons et la méthode de vérification sur notre page <a href="/eau-bebe">eau du robinet pour bébé</a>.`
          : null,
      },
      {
        q: `L'eau de ${cityName} contient-elle des PFAS (polluants éternels) ?`,
        a: pfasAnswer,
      },
      {
        q: `Dois-je utiliser une carafe filtrante ou un adoucisseur à ${cityName} ?`,
        a: carafeAnswer,
      },
      {
        q: `Peut-on boire l'eau chaude du robinet à ${cityName} ?`,
        a: "Non, il est fortement déconseillé de boire ou de cuisiner avec l'eau chaude. La chaleur favorise le développement bactérien et la dissolution de métaux lourds issus de votre installation intérieure. Utilisez toujours l'eau froide.",
      }
    ];
  }, [cityName, isConform, crystal, stats, metrics, currentYear, dpt]);

  // 5. Encart SEO « eau pour bébé » — maillage contextuel vers /eau-bebe depuis toutes les fiches ville
  const babyCta = useMemo(() => {
    const nit = stats.nitrates ? parseValue(stats.nitrates.val) : NaN;
    const nitVal = (() => {
      const v = stats.nitrates?.val;
      return v && v !== '--' ? `${v} mg/L` : null;
    })();

    if (isConform === false || (!isNaN(nit) && nit >= 50)) {
      return {
        tone: 'critical',
        title: 'Biberons : eau non recommandée',
        text: `Ne préparez pas les biberons avec l'eau de ${cityName} tant que la levée de restriction n'a pas été annoncée par l'ARS${nitVal ? ` (nitrates à ${nitVal})` : ''}. Suivez les consignes officielles et utilisez une eau en bouteille adaptée.`,
      };
    }
    if (!isNaN(nit) && nit >= 15) {
      return {
        tone: 'warning',
        title: 'Préparation des biberons : vigilance recommandée',
        text: `Avec ${nitVal || 'un taux de nitrates mesuré'} à ${cityName}, l'eau reste conforme pour les adultes mais la prudence s'impose pour les biberons d'un nourrisson de moins de 6 mois. Préférez une eau pauvre en nitrates ou demandez conseil à votre médecin.`,
      };
    }
    return {
      tone: 'ok',
      title: 'Une eau adaptée pour les biberons',
      text: nitVal
        ? `Faible en nitrates (${nitVal}) et conforme aux contrôles ARS, l'eau de ${cityName} convient à la préparation des biberons : laissez couler l'eau froide quelques secondes avant de remplir le biberon.`
        : `Conforme aux contrôles ARS, l'eau de ${cityName} peut être utilisée pour la préparation des biberons en respectant les précautions d'usage : eau froide et purge des canalisations.`,
    };
  }, [cityName, isConform, stats]);

  return (
    <div className="city-seo-master">
      {/* SECTION 1 : ANALYSE (BLANC) */}
      <section className="home-content-section white">
        <div className="seo-container">
          <CityAnalysisSection stats={stats} isConform={isConform} meta={meta} crystal={crystal} />
        </div>
      </section>

      {/* SECTION 2 : DUEL (GRIS) */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Qualité de l'eau : Duel de Pureté</h2>
            <p className="seo-main-subtitle">Comparez les analyses de <strong>{cityName}</strong> avec le département <strong>{deptAvg?.name || `Département ${dpt}`} ({dpt})</strong> et la région <strong>{regionalInfo?.name || 'la région'}</strong>.</p>
          </div>

          <div className="summary-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th className="col-highlight">À {cityName}</th>
                  {neighborCities.length > 0 && (
                    <th>
                      <Link href={`/departement/${dpt}`} className="table-header-link">
                        {deptAvg?.name || `Département ${dpt}`}
                      </Link>
                    </th>
                  )}
                  <th>{regionalInfo?.name || 'Région'}</th>
                  <th>France</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = [
                    { key: "conformity", label: "Conformité", city: isConform ? "100%" : "Alerte", dept: metrics.dept.conform, region: metrics.region.conform, france: NATIONAL_STATS.conform, higherIsBetter: true },
                    ...ANALYSIS_CARDS.map((p) => {
                      const m = DUEL_METRIC[p.dataKey];
                      return {
                        key: p.dataKey,
                        label: p.name,
                        city: metrics[m.city],
                        dept: metrics.dept[m.agg],
                        region: metrics.region[m.agg],
                        france: NATIONAL_STATS[m.agg],
                        ...(p.dataKey === 'ph' ? { centered: 7.5 } : {})
                      };
                    })
                  ];

                  const getWinner = (row) => {
                    const vCity = parseValue(row.city);
                    const vDept = parseValue(row.dept);
                    const vReg = parseValue(row.region);
                    const vFra = parseValue(row.france);

                    const vals = [
                      { id: 'city', v: vCity },
                      { id: 'dept', v: vDept },
                      { id: 'region', v: vReg },
                      { id: 'france', v: vFra }
                    ].filter(x => !isNaN(x.v));
                    
                    if (vals.length === 0) return null;

                    if (row.higherIsBetter) {
                      const max = Math.max(...vals.map(x => x.v));
                      return vals.find(x => x.v === max)?.id;
                    }
                    if (row.centered) {
                      const target = row.centered;
                      const diffs = vals.map(x => ({ id: x.id, d: Math.abs(x.v - target) }));
                      const minDiff = Math.min(...diffs.map(x => x.d));
                      return diffs.find(x => x.d === minDiff)?.id;
                    }

                    const min = Math.min(...vals.map(x => x.v));
                    return vals.find(x => x.v === min)?.id;
                  };

                  return rows.map((ind, i) => {
                    const winner = getWinner(ind);
                    return (
                      <tr key={i}>
                        <td className="indicator-label">
                          <div className="indicator-with-icon">
                            <span className="indicator-icon-small" dangerouslySetInnerHTML={{ __html: PARAM_ICONS[ind.key] || PARAM_ICONS[ind.key.replace('idity', '')] }} />
                            {ind.label}
                          </div>
                        </td>
                        <td className={`col-highlight ${winner === 'city' ? 'winner-highlight' : ''}`}>{ind.city}</td>
                        {neighborCities.length > 0 && <td className={winner === 'dept' ? 'winner-highlight' : ''}>{ind.dept}</td>}
                        <td className={winner === 'region' ? 'winner-highlight' : ''}>{ind.region}</td>
                        <td className={winner === 'france' ? 'winner-highlight' : ''}>{ind.france}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION : CONTEXTE LOCAL & RÉSEAU (BLANC) */}
      <section className="home-content-section white">
        <div className="seo-container">
          <CityLocalContext cityName={cityName} data={data} />
        </div>
      </section>

      {/* SECTION : BENCHMARK (GRIS) */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">
              {data.isMetropolis ? "Top 10 des métropoles" : `Benchmark : Top 10 du département ${dpt}`}
            </h2>
            <p className="seo-main-subtitle">
              {data.isMetropolis 
                ? `Performance de ${cityName} face aux 10 plus grandes agglomérations de France.`
                : `Performance de ${cityName} face aux 10 plus grandes agglomérations de ${deptAvg?.name || 'votre département'} (${dpt}).`}
            </p>
          </div>
          <BenchmarkAudit
            cityName={cityName}
            neighborCities={benchmarkCities}
            dpt={dpt}
            initialAnalyzedCities={benchmarkCities}
            initialPhase="done"
          />
        </div>
      </section>

      {/* SECTION : L'ANALYSE DE L'EXPERT (BLANC) */}
      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Verdict de l'Expert : L'eau est-elle saine ?</h2>
            <p className="seo-main-subtitle">Interprétation détaillée des analyses ARS et conclusion de nos spécialistes en santé environnementale.</p>
          </div>
          <div className="seo-card expert-analysis-card">
            <div className="expert-synthesis-body">
              <p>
                <span dangerouslySetInnerHTML={{ __html: syntheseTexte.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
              </p>
              <p>
                <strong>Verdict de l'expert :</strong> en {currentYear}, l'analyse de l'eau potable à <strong>{cityName}</strong> {(() => {
                  const cityScore = crystal?.final ?? 0;
                  const deptScore = deptAvg?.score || 7.4;
                  const regionScore = regionalInfo?.score || 7.4;
                  const deptLabel = deptAvg?.name ? `la ${deptAvg.name}` : `le département ${dpt}`;
                  const regionName = regionalInfo?.name || "la région";
                  const h = hashCity(cityName, dpt);

                  if (cityScore >= deptScore && cityScore >= regionScore) {
                    const best = [
                      `affiche un bilan remarquable. Avec un Indice de Pureté de ${cityScore}/10, la commune se positionne au-dessus des moyennes de ${deptLabel} (${deptScore}/10) et de ${regionName} (${regionScore}/10). Cette performance témoigne d'une gestion rigoureuse et place le réseau local parmi les plus sûrs de la zone.`,
                      `est une excellente élève. Son score de ${cityScore}/10 dépasse à la fois ${deptLabel} (${deptScore}/10) et ${regionName} (${regionScore}/10). Un résultat qui reflète un investissement sérieux dans la qualité de l'eau.`,
                      `confirme son excellence. Avec ${cityScore}/10, la commune fait mieux que ${deptLabel} (${deptScore}/10) et que la moyenne régionale (${regionScore}/10). Les habitants peuvent être fiers de leur eau.`,
                      `se distingue nettement. Le score de ${cityScore}/10 surpasse les références départementales (${deptScore}/10) et régionales (${regionScore}/10). Une eau parmi les plus fiables du secteur.`,
                      `brille par ses résultats. Avec ${cityScore}/10, elle dépasse ${deptLabel} (${deptScore}/10) et se hisse au-dessus de ${regionName} (${regionScore}/10). Une performance solide et durable.`,
                    ];
                    return best[h % best.length];
                  } else if (cityScore >= deptScore) {
                    const good = [
                      `se situe dans une dynamique positive. Son score de ${cityScore}/10 surclasse la moyenne de ${deptLabel} (${deptScore}/10) et s'aligne sur les performances de ${regionName} (${regionScore}/10). Le réseau garantit une sécurité sanitaire solide.`,
                      `fait mieux que son département. Avec ${cityScore}/10, elle dépasse ${deptLabel} (${deptScore}/10) et se rapproche de la moyenne de ${regionName} (${regionScore}/10). Une tendance encourageante.`,
                      `affiche des résultats encourageants. Le score de ${cityScore}/10 est supérieur à ${deptLabel} (${deptScore}/10), même s'il reste en deçà de ${regionName} (${regionScore}/10). La direction est bonne.`,
                      `montre une progression notable face à ${deptLabel} (${deptScore}/10) avec un score de ${cityScore}/10. La commune s'aligne progressivement sur les standards régionaux (${regionScore}/10).`,
                      `témoigne d'une amélioration continue. Avec ${cityScore}/10, la commune devance ${deptLabel} (${deptScore}/10) et converge vers le niveau de ${regionName} (${regionScore}/10).`,
                    ];
                    return good[h % good.length];
                  } else {
                    const attention = [
                      `présente des indicateurs à surveiller. Avec un score de ${cityScore}/10, la qualité de l'eau est en retrait par rapport à ${deptLabel} (${deptScore}/10) et à ${regionName} (${regionScore}/10). Ce décalage mérite une attention particulière sur les paramètres techniques locaux.`,
                      `nécessite une vigilance accrue. Le score de ${cityScore}/10 est inférieur à ${deptLabel} (${deptScore}/10) et à ${regionName} (${regionScore}/10). Des améliorations sont nécessaires pour rejoindre les standards du territoire.`,
                      `accuse un retard par rapport à son territoire. Avec ${cityScore}/10, la commune est en dessous de ${deptLabel} (${deptScore}/10) et de ${regionName} (${regionScore}/10). Un plan d'action serait bénéfique.`,
                      `doit poursuivre ses efforts. Le score de ${cityScore}/10 reste inférieur aux références de ${deptLabel} (${deptScore}/10) et de ${regionName} (${regionScore}/10). La situation n'est pas critique mais mérite un suivi.`,
                      `a une marge de progression. Avec ${cityScore}/10, la qualité de l'eau est moins bonne qu'à l'échelle de ${deptLabel} (${deptScore}/10) et de ${regionName} (${regionScore}/10). Une surveillance renforcée est conseillée.`,
                    ];
                    return attention[h % attention.length];
                  }
                })()}
              </p>
            </div>
            <div className={`city-baby-banner ${babyCta.tone}`}>
              <div className="city-baby-banner-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
              </div>
              <div className="city-baby-banner-body">
                <h3>{babyCta.title} à {cityName}</h3>
                <p>{babyCta.text}</p>
                <Link href="/eau-bebe" className="seo-card-link">Guide eau du robinet pour bébé : nitrates, PFAS et biberons</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Focus & Santé</h2>
            <p className="seo-main-subtitle">Conseils personnalisés pour optimiser l'usage de votre eau au quotidien.</p>
          </div>
          <div className="seo-grid">
            <div className="seo-card"><h3>{focusContent.calcaire.titre}</h3><p>{focusContent.calcaire.texte}</p><Link href="/definitions#calcaire" className="seo-card-link">Qu'est-ce que le calcaire ?</Link></div>
            <div className="seo-card"><h3>{focusContent.chlore.titre}</h3><p>{focusContent.chlore.texte}</p><Link href="/definitions#chlore" className="seo-card-link">Qu'est-ce que le chlore libre ?</Link></div>
            <div className="seo-card"><h3>{focusContent.sante.titre}</h3><p>{focusContent.sante.texte}</p><Link href="/pfas-eau-potable" className="seo-card-link">Tout savoir sur les PFAS</Link></div>
          </div>
        </div>
      </section>

      {/* SECTION PRIX DE L'EAU (BLANC) */}
      {prix && (prix.aep || prix.ac) && (
        <section className="home-content-section white">
          <div className="seo-container">
            <div className="seo-section-header">
              <h2 className="seo-main-title">Quel est le prix de l'eau à {cityName} ?</h2>
              <p className="seo-main-subtitle">Détail des tarifs officiels (TTC) pour la part Eau Potable et la part Assainissement.</p>
            </div>

            <div className="price-grid-premium">
              <div className="price-card-item">
                <div className="price-card-header">
                  <div className="price-card-icon blue" dangerouslySetInnerHTML={{ __html: PARAM_ICONS.chlorine }} />
                  <span className="price-card-label">Eau Potable</span>
                </div>
                <div className="price-card-value">
                  {prix.aep ? `${prix.aep.toFixed(2).replace('.', ',')} €` : '--'}
                  <span className="price-unit">/ m³ TTC</span>
                </div>
                <p className="price-card-desc">Production, pompage et distribution jusqu'à votre robinet.</p>
              </div>

              <div className="price-card-item">
                <div className="price-card-header">
                  <div className="price-card-icon purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="price-card-label">Assainissement</span>
                </div>
                <div className="price-card-value">
                  {prix.ac ? `${prix.ac.toFixed(2).replace('.', ',')} €` : '--'}
                  <span className="price-unit">/ m³ TTC</span>
                </div>
                <p className="price-card-desc">Collecte et traitement des eaux usées en station d'épuration.</p>
              </div>

              <div className="price-card-item highlight">
                <div className="price-card-header">
                  <div className="price-card-icon white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="price-card-label">Total Facturé</span>
                </div>
                <div className="price-card-value">
                  {prix.total ? `${prix.total.toFixed(2).replace('.', ',')} €` : '--'}
                  <span className="price-unit">/ m³ moyen</span>
                </div>
                <p className="price-card-desc">Coût global au mètre cube basé sur une consommation de 120 m³.</p>
              </div>
            </div>

            <div className="price-footer-notice">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Source : Observatoire National SISPEA ({currentYear}). Les tarifs incluent les taxes et redevances.</span>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6 : FAQ (GRIS) */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Foire Aux Questions</h2>
            <p className="seo-main-subtitle">Réponses aux interrogations les plus fréquentes des habitants de {cityName}.</p>
          </div>
          <div className="seo-faq-accordion">
            {faqItems.map((item, i) => (
              <details key={i} className="seo-faq-item">
                <summary className="seo-faq-question"><h3>{item.q}</h3><span className="faq-icon"></span></summary>
                <div className="seo-faq-answer">{item.aHtml ? <p dangerouslySetInnerHTML={{ __html: item.aHtml }} /> : <p>{item.a}</p>}</div>
              </details>
            ))}
          </div>
          <div className="faq-more-cta">
            <Link href="/definitions" className="faq-more-btn">📖 Comprendre tous les paramètres (PFAS, nitrates, calcaire…)</Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 : TRANSPARENCE & MÉTHODOLOGIE (BLANC) */}
      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Transparence & Méthodologie</h2>
            <p className="seo-main-subtitle">
              Les analyses de l'eau à <strong>{cityName}</strong> sont extraites en temps réel des bases de données <strong>SISE-Eaux</strong> du Ministère de la Santé (données Hub'Eau).
            </p>
          </div>

          <div className="trust-card-premium">
            <div className="trust-card-content">
              <div className="trust-card-main">
                <div className="trust-card-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z" fill="var(--primary-solid)"/>
                    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Observatoire Citoyen & Indépendant</span>
                </div>
                <p>
                  Le <strong>Crystal Score™</strong> (0-10) est notre indice de pureté, calculé à partir des données officielles <strong>ARS</strong> de la base SISE-Eaux. La méthode complète, les sources et la pondération des paramètres (PFAS, nitrates, pesticides) sont détaillées sur la page dédiée.
                </p>
              </div>
              <div className="trust-card-actions">
                <div className="trust-card-info-group">
                  <div className="trust-card-info">
                    <span className="info-label">Référentiel</span>
                    <span className="info-value">Données ARS {currentYear}</span>
                  </div>
                  <div className="trust-card-info">
                    <span className="info-label">Algorithme</span>
                    <span className="info-value">Crystal™ v2.4</span>
                  </div>
                </div>
                <a href="/methodologie" className="trust-card-btn">Détail de la Méthodologie</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 : VOISINES (GRIS) */}
      <section className="home-content-section gray">
        <div className="seo-container">
          <NearbyCities cities={neighborCities} dpt={dpt} isMetropolis={data.isMetropolis} />
        </div>
      </section>

      <style jsx>{`
        .table-header-link {
          color: inherit;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 4px;
          transition: color 0.2s ease;
        }
        .table-header-link:hover {
          color: #3b82f6;
          text-decoration-style: solid;
        }

        .trust-external-links {
          margin-top: 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .price-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-top: 40px;
        }

        .price-card-item {
          background: #ffffff;
          border-radius: 24px;
          padding: 30px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
        }

        .price-card-item:hover {
          transform: translateY(-5px);
          border-color: #3b82f6;
        }

        .price-card-item.highlight {
          background: #0046CC;
          color: white;
          border: none;
        }

        .price-card-item.highlight .price-card-label,
        .price-card-item.highlight .price-card-value,
        .price-card-item.highlight .price-unit,
        .price-card-item.highlight .price-card-desc {
          color: white !important;
        }

        .price-card-item.highlight .price-card-icon {
          color: white !important;
        }

        .price-card-item.highlight .price-card-desc {
          opacity: 0.9;
        }

        .price-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .price-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .price-card-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .price-card-icon.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .price-card-icon.white { background: rgba(255, 255, 255, 0.2); color: white; }

        .price-card-label {
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .price-card-value {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 10px;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .price-unit {
          font-size: 1rem;
          font-weight: 500;
          opacity: 0.7;
        }

        .price-card-desc {
          font-size: 0.9rem;
          line-height: 1.5;
          opacity: 0.8;
        }

        .price-footer-notice {
          margin-top: 30px;
          padding: 15px 20px;
          background: #fefce8;
          border-radius: 12px;
          border: 1px solid #fef08a;
          color: #854d0e;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .trust-external-links a {
          position: relative;
          z-index: 10;
          cursor: pointer;
          pointer-events: auto !important;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0046CC;
          text-decoration: none;
          background: rgba(0, 70, 204, 0.05);
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(0, 70, 204, 0.1);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .trust-external-links a:hover {
          background: #0046CC;
          color: white !important;
          transform: translateY(-1px);
        }

        .trust-external-links .sep {
          color: #CBD5E1;
          font-size: 0.8rem;
          display: none; /* Cache le point car on utilise des badges */
        }

        @media (max-width: 640px) {
          .trust-external-links {
            gap: 10px;
          }
          .trust-external-links a {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
