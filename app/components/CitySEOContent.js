'use client';

import { useMemo, Fragment } from 'react';
import { parseValue, getParameterStatus } from '@/lib/water-utils';
import dynamic from 'next/dynamic';
const CityAnalysisSection = dynamic(() => import('./CityAnalysisSection'), { ssr: true });
const BenchmarkAudit = dynamic(() => import('./BenchmarkAudit'), { ssr: true });
const SeoDataTable = dynamic(() => import('./SeoDataTable'), { ssr: true });
const NearbyCities = dynamic(() => import('./NearbyCities'), { ssr: true });

export default function CitySEOContent({ cityName, data }) {
  if (!data || data.error || !data.meta) return null;

  const { crystal, stats, isConform, meta } = data;
  const deptAvg = data.initialDeptAvg;
  const neighborCities = data.initialNeighborCities || [];
  const regionalInfo = data.regionalInfo || {};
  const dpt = meta.code_departement || "";

  const currentYear = new Date().getFullYear();

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
    const getVal = (stat) => {
      if (!stat || !stat.val) return null;
      const n = parseValue(stat.val);
      return isNaN(n) ? null : n;
    };

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

  // 3. Synthèse de l'Expert (Spinning)
  const syntheseTexte = useMemo(() => {
    const spinSentence = (variants, seed) => {
      const idx = (cityName.length + seed + (dpt ? parseInt(dpt) : 0)) % variants.length;
      return variants[idx].replace(/\{cityName\}/g, cityName).replace(/\{nomReseau\}/g, nomReseau).replace(/\{currentYear\}/g, currentYear);
    };

    let text = spinSentence([
      `La **qualité de l'eau à {cityName}** est jugée **${isConform ? 'conforme' : 'non conforme'}** en {currentYear} selon les relevés de l'ARS. `,
      `D'après les dernières données de l'ARS en {currentYear}, l'eau à **{cityName}** présente un bilan **${isConform ? 'favorable' : 'insatisfaisant'}** au niveau de sa conformité sanitaire. `,
      `Le verdict officiel de l'ARS pour {currentYear} à **{cityName}** confirme une eau **${isConform ? 'conforme' : 'non conforme'}** aux exigences de potabilité actuelles. `
    ], 1);

    text += spinSentence([
      `La distribution, gérée par **{nomReseau}**, fait l'objet d'un suivi rigoureux pour garantir la sécurité sanitaire des habitants. `,
      `Le réseau local, opéré par **{nomReseau}**, est régulièrement analysé par les autorités pour s'assurer du respect des seuils réglementaires. `,
      `Sous la supervision technique de **{nomReseau}**, les infrastructures locales acheminent l'eau potable vers les foyers de la commune. `
    ], 2);
    
    if (isConform) {
      text += spinSentence([
        `Concrètement, vous pouvez **boire l'eau du robinet à {cityName}** sans crainte, celle-ci respectant les normes de sécurité en vigueur. `,
        `Les résultats indiquent que la consommation d'eau du robinet à **{cityName}** ne présente aucun risque sanitaire identifié par les autorités. `
      ], 3);
    } else {
      text += `La vigilance est de mise : les relevés officiels indiquent des dépassements sur certains paramètres microbiologiques ou physico-chimiques. `;
    }

    const durete = parseValue(stats.hardness?.val);
    if (durete > 25) text += `Le verdict met en évidence une **eau calcaire** (${metrics.dureteVal}), ce qui peut impacter votre confort cutané et la longévité de vos appareils. `;
    else if (durete > 0 && durete < 10) text += `À l'inverse, l'eau est ici très douce, ce qui préserve les canalisations mais demande une attention sur la corrosion. `;

    const nitrates = parseValue(stats.nitrates?.val);
    if (nitrates > 20) text += `On note une présence de **nitrates** (${metrics.nitratesVal}), un taux qui reste sous la limite mais mérite l'attention pour les nourrissons. `;

    if (deptAvg?.conformRate) text += ` Globalement, le département ${dpt} affiche un taux de conformité de ${deptAvg.conformRate}%, une dynamique dans laquelle **${cityName}** s'inscrit pleinement.`;

    const pfas = parseValue(stats.pfas?.val);
    if (pfas !== null && !isNaN(pfas)) text += ` Enfin, concernant les **PFAS (polluants éternels)**, les analyses de 2026 à ${cityName} ${pfas > 0.1 ? "révèlent une présence à surveiller" : "ne détectent aucune anomalie majeure"}, le taux restant sous le seuil de 0.1 µg/L.`;

    return text.replace(/\{cityName\}/g, cityName).replace(/\{nomReseau\}/g, nomReseau);
  }, [cityName, nomReseau, isConform, stats, metrics, deptAvg, dpt, currentYear]);

  // 4. Focus & Santé
  const focusContent = useMemo(() => {
    const durete = parseValue(stats.hardness?.val);
    const chlore = parseValue(stats.chlorine?.val);
    const nitrates = parseValue(stats.nitrates?.val);
    const pfas = parseValue(stats.pfas?.val);

    return {
      calcaire: {
        titre: durete > 25 ? `🧼 Alerte Calcaire à ${cityName}` : `✨ Douceur de l'eau à ${cityName}`,
        texte: durete > 25 
          ? `L'eau de ${cityName} affiche une dureté importante (${metrics.dureteVal}). Sans adoucisseur, le tartre s'accumulera rapidement dans votre chauffe-eau et vos équipements.` 
          : `L'équilibre minéral de ${cityName} est parfait (${metrics.dureteVal}). Votre eau est naturellement douce, préservant ainsi vos équipements et votre peau au quotidien.`
      },
      chlore: {
        titre: chlore > 0.1 ? "🧪 Atténuer le goût de chlore" : "💧 Une eau au goût neutre",
        texte: chlore > 0.1 
          ? `Avec un taux de ${metrics.chloreVal}, un léger goût de Javel peut être présent. Laissez reposer l'eau 15 minutes en carafe avant dégustation pour évaporer le chlore.`
          : `Grâce à un réseau parfaitement optimisé, le taux de chlore à ${cityName} est extrêmement faible, garantissant une eau sans aucune odeur désagréable.`
      },
      sante: {
        titre: (!isConform || pfas > 0.1 || nitrates > 20) ? "🛡️ Vigilance & Santé" : "🥗 Pureté & Vitalité",
        texte: (!isConform)
          ? `La qualité de l'eau à ${cityName} présente des non-conformités techniques ou sanitaires relevées par l'ARS (${metrics.pfasVal} PFAS, ${metrics.nitratesVal} Nitrates). Une vigilance particulière est recommandée, notamment pour les personnes sensibles.`
          : (pfas > 0.1 || nitrates > 20)
          ? `Bien que conforme globalement, la présence de traces (${metrics.pfasVal} de PFAS ou ${metrics.nitratesVal} de nitrates) nécessite une attention particulière pour les personnes fragiles et les nourrissons.`
          : `Les indicateurs de santé (Nitrates : ${metrics.nitratesVal}, PFAS : ${metrics.pfasVal}) sont excellents. L'eau de ${cityName} est parfaitement adaptée à une consommation quotidienne.`
      }
    };
  }, [cityName, isConform, stats, metrics]);

  const faqItems = useMemo(() => {
    const durete = parseValue(stats.hardness?.val);
    return [
      { 
        q: `L'eau du robinet à ${cityName} est-elle de bonne qualité en ${currentYear} ?`, 
        a: isConform 
          ? `Oui, avec un score Crystal de ${crystal.final}/10, l'eau de ${cityName} est jugée de bonne qualité et respecte les normes sanitaires de l'ARS.`
          : `La vigilance est de mise : le score de ${crystal.final}/10 reflète des dépassements sur certains critères de qualité. L'eau est officiellement classée comme non conforme par l'ARS.`
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
        a: `La surveillance des PFAS devient systématique en 2026. À ${cityName}, les derniers relevés indiquent des taux ${parseValue(stats.pesticides?.val) > 0.1 ? 'à surveiller' : 'conformes aux futures normes européennes (0.1 µg/L)'}.`
      },
      {
        q: `Dois-je utiliser une carafe filtrante ou un adoucisseur à ${cityName} ?`,
        a: `${durete > 25 ? "L'eau étant calcaire (" + metrics.dureteVal + "), un adoucisseur protégera vos installations." : "L'eau est naturellement douce, un adoucisseur est inutile."} Pour le goût, une carafe filtrante peut aider si vous êtes sensible au chlore.`
      }
    ];
  }, [cityName, isConform, crystal, stats, metrics, currentYear]);

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
            <p className="seo-main-subtitle">Comparez les performances de <strong>{cityName}</strong> avec le département <strong>{deptAvg?.name || `Département ${dpt}`} ({dpt})</strong> et la région <strong>{regionalInfo?.name || 'la région'}</strong>.</p>
          </div>

          <div className="summary-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Indicateur</th>
                    <th className="col-highlight">À {cityName}</th>
                    {neighborCities.length > 0 && <th>{deptAvg?.name || `Département ${dpt}`}</th>}
                    <th className="col-region-desktop">{regionalInfo?.name || 'Région'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows = [
                      { label: "Conformité", city: isConform ? "100%" : "Alerte", dept: metrics.dept.conform, region: metrics.region.conform, higherIsBetter: true },
                      { label: "Microbiologie", city: metrics.microVal, dept: metrics.dept.micro, region: metrics.region.micro },
                      { label: "PFAS (Polluants)", city: metrics.pfasVal, dept: metrics.dept.pfas, region: metrics.region.pfas },
                      { label: "Pesticides", city: metrics.pestVal, dept: metrics.dept.pest, region: metrics.region.pest },
                      { label: "Chlore libre", city: metrics.chloreVal, dept: metrics.dept.chlorine, region: metrics.region.chlorine },
                      { label: "Nitrates", city: metrics.nitratesVal, dept: metrics.dept.nitrates, region: metrics.region.nitrates },
                      { label: "Calcaire", city: metrics.dureteVal, dept: metrics.dept.hardness, region: metrics.region.hardness },
                      { label: "Acidité (pH)", city: metrics.phVal, dept: metrics.dept.ph, region: metrics.region.ph, centered: 7.5 },
                      { label: "Turbidité", city: metrics.turbVal, dept: metrics.dept.turbidity, region: metrics.region.turbidity },
                      { label: "Conductivité", city: metrics.condVal, dept: metrics.dept.conductivity, region: metrics.region.conductivity }
                    ];

                    const getWinner = (row) => {
                      const v1 = parseValue(row.city);
                      const v2 = parseValue(row.dept);
                      const v3 = parseValue(row.region);
                      const vals = [v1, v2, v3].filter(v => !isNaN(v));
                      if (vals.length === 0) return null;

                      if (row.higherIsBetter) {
                        const max = Math.max(...vals);
                        if (v1 === max) return 'city';
                        if (v2 === max) return 'dept';
                        return 'region';
                      }
                      if (row.centered) {
                        const d1 = Math.abs((v1 || 7.5) - 7.5);
                        const d2 = Math.abs((v2 || 7.5) - 7.5);
                        const d3 = Math.abs((v3 || 7.5) - 7.5);
                        const diffs = [d1, d2, d3].filter((_, i) => !isNaN([v1, v2, v3][i]));
                        const minD = Math.min(...diffs);
                        if (d1 === minD) return 'city';
                        if (d2 === minD) return 'dept';
                        return 'region';
                      }
                      const min = Math.min(...vals);
                      if (v1 === min) return 'city';
                      if (v2 === min) return 'dept';
                      return 'region';
                    };

                    return rows.map((row, i) => {
                      const winner = getWinner(row);
                      return (
                        <tr key={i}>
                          <td><strong>{row.label}</strong></td>
                          <td className={`col-highlight ${winner === 'city' ? 'winner-highlight' : ''}`}>{row.city}</td>
                          {neighborCities.length > 0 && <td className={winner === 'dept' ? 'winner-highlight' : ''}>{row.dept}</td>}
                          <td className={`col-region-desktop ${winner === 'region' ? 'winner-highlight' : ''}`}>{row.region}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
          </div>

          <div className="seo-comparison-verdict" style={{ marginTop: '30px', textAlign: 'left', lineHeight: '1.6', fontSize: '1.05rem', color: '#444' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e3a8a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Verdict Expert
            </h3>
            <p>
              En {currentYear}, l'analyse de l'eau potable à <strong>{cityName}</strong> {(() => {
                const cityScore = crystal.final;
                const deptScore = deptAvg?.score || 7.4;
                const regionScore = regionalInfo?.score || 7.4;
                const deptLabel = deptAvg?.name ? `la ${deptAvg.name}` : `le département ${dpt}`;
                const regionName = regionalInfo?.name || "la région";

                if (cityScore >= deptScore && cityScore >= regionScore) {
                  return `affiche un bilan remarquable. Avec un Indice de Pureté de ${cityScore}/10, la commune se positionne non seulement au-dessus de la moyenne de ${deptLabel} (${deptScore}/10), mais confirme également son excellence à l'échelle de la région ${regionName} (${regionScore}/10). Cette performance, supérieure aux standards régionaux, témoigne d'une gestion rigoureuse des polluants et place le réseau local parmi les plus sûrs de la zone.`;
                } else if (cityScore >= deptScore) {
                  return `se situe dans une dynamique positive. Son score de ${cityScore}/10 surclasse la moyenne de ${deptLabel} (${deptScore}/10) et s'aligne globalement sur les performances de la région ${regionName} (${regionScore}/10). Le réseau de distribution garantit une sécurité sanitaire solide, conforme aux exigences de santé publique actuelles.`;
                } else {
                  return `présente des indicateurs à surveiller. Avec un score de ${cityScore}/10, la qualité de l'eau est légèrement en retrait par rapport aux moyennes constatées en ${deptLabel} (${deptScore}/10) et dans la région ${regionName} (${regionScore}/10). Ce décalage s'explique souvent par des caractéristiques géologiques locales ou des traces de paramètres techniques spécifiques à ce réseau.`;
                }
              })()}
            </p>
          </div>
        </div>
      </section>

      <section className="home-content-section gray">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Benchmark Départemental</h2>
            <p className="seo-main-subtitle">Comparez le Crystal Score de <strong>{cityName}</strong> avec les {neighborCities.length} principales agglomérations du département {dpt}.</p>
          </div>
          <BenchmarkAudit 
            cityName={cityName} 
            neighborCities={neighborCities} 
            dpt={dpt} 
            initialAnalyzedCities={neighborCities} 
            initialPhase="done" 
          />
        </div>
      </section>

      <section className="home-content-section white">
        <div className="seo-container">
          <div className="seo-section-header">
            <h2 className="seo-main-title">Focus & Santé</h2>
            <p className="seo-main-subtitle">Conseils personnalisés pour optimisons l'usage de votre eau au quotidien.</p>
          </div>
          <div className="seo-grid">
            <div className="seo-card"><h3>{focusContent.calcaire.titre}</h3><p>{focusContent.calcaire.texte}</p></div>
            <div className="seo-card"><h3>{focusContent.chlore.titre}</h3><p>{focusContent.chlore.texte}</p></div>
            <div className="seo-card"><h3>{focusContent.sante.titre}</h3><p>{focusContent.sante.texte}</p></div>
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
