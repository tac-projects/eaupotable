'use client';

import { useState, Fragment } from 'react';
import {
  getParameterStatus,
  PARAM_ICONS,
  RANGES,
  CENTERED_PARAMS,
  parseValue
} from '@/lib/water-utils';

export default function CityAnalysisSection({ stats, isConform, meta }) {
  const paramsList = [
    { name: "Microbiologie", key: "microbiology", data: stats.microbiology || { val: "--", unit: "", date: new Date(meta.date_prelevement).toLocaleDateString('fr-FR') } },
    { name: "Nitrates", key: "nitrates", data: stats.nitrates },
    { name: "Pesticides", key: "pesticides", data: stats.pesticides },
    { name: "PFAS (Polluants éternels)", key: "pfas", data: stats.pfas },
    { name: "Chlore Libre", key: "chlorine", data: stats.chlorine },
    { name: "Calcaire", key: "hardness", data: stats.hardness },
    { name: "Acidité (pH)", key: "ph", data: stats.ph },
    { name: "Turbidité", key: "turb", data: stats.turbidity },
    { name: "Conductivité", key: "cond", data: stats.conductivity },
  ].filter(p => p.data && p.data.val !== undefined);

  return (
    <Fragment>
      <div className="seo-section-header">
        <h2 className="seo-main-title">Analyses Techniques</h2>
        <p className="seo-main-subtitle">Résultats détaillés des derniers prélèvements sanitaires officiels selon 12 indicateurs clés.</p>
      </div>
      <div className="analysis-grid-container">
        <div className="analysis-grid">
          {paramsList.map((p, i) => (
            <AnalysisCard key={i} parameter={p} />
          ))}
        </div>
        
        <div className="analysis-conformity-card">
           <div className={`conformity-badge ${isConform ? 'legal-ok' : 'legal-ko'}`}>
              <span className="icon">{isConform ? '✅' : '⚠️'}</span>
              <span>Conformité Sanitaire : <strong>{isConform ? 'CONFORME' : 'NON CONFORME'}</strong></span>
           </div>
           
           {meta.conclusion && !isConform && (
            <div className="ars-conclusion-minimal">
              <p><strong>Verdict officiel :</strong> {meta.conclusion}</p>
              <p className="ars-educational-tip">Un dépassement sur un paramètre technique (calcaire, fer, goût) peut entraîner ce statut même si les polluants majeurs sont absents.</p>
            </div>
           )}
        </div>
      </div>
    </Fragment>
  );
}

function AnalysisCard({ parameter }) {
  const [isOpen, setIsOpen] = useState(false);
  const { name, key, data } = parameter;
  const status = getParameterStatus(key, data?.val);
  const range = RANGES[key];
  const val = parseValue(data?.val);
  const isCentered = CENTERED_PARAMS.includes(key);

  let pos = 50;
  if (key === "bacteria" || key === "microbiology") { pos = (status.status === "perfect") ? 10 : 90; }
  else if (range && val && !isNaN(val)) {
    if (isCentered) {
      const [c1, w1, g1, g2, w2, c2] = range;
      if (val <= g1) pos = 25; else if (val >= g2) pos = 75; else pos = 50;
    } else {
      const [b1, b2, b3] = range;
      if (val <= b1) pos = 15; else if (val <= b2) pos = 45; else if (val <= b3) pos = 75; else pos = 90;
    }
  }

  return (
    <div className={`analysis-card ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="analysis-card-top">
        <div className="analysis-card-left">
          <div className="analysis-card-icon" dangerouslySetInnerHTML={{ __html: PARAM_ICONS[key] }} />
          <div className="analysis-card-main-info">
            <h3 className="analysis-card-name">{name}</h3>
            <div className="analysis-card-subtitle">{status.subtitle}</div>
          </div>
        </div>
        
        <div className="analysis-card-right">
          <div className="analysis-card-result">
            {(() => {
              const isAbsence = key === 'microbiology' && (data?.val?.includes('<') || data?.val?.toLowerCase().includes('absence'));
              return (
                <>
                  <span className="val">{isAbsence ? 'Absence' : (data?.val || '--')}</span>
                  {!isAbsence && data?.unit && <span className="unit"> {data.unit}</span>}
                </>
              );
            })()}
          </div>
          <div className={`analysis-card-status-dot ${status.class}`}></div>
          <svg className={`analysis-card-chevron ${isOpen ? 'is-active' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="analysis-card-details">
          <div className="yuka-range-container">
            <div className={`yuka-range-bar ${isCentered ? 'centered' : 'linear'}`} style={{ '--marker-pos': `${pos}%`, '--marker-color': `var(--${status.class})` }}>
              <div className="yuka-marker"></div>
            </div>
            <div className="yuka-range-labels">
              {isCentered ? (
                <>
                  <span className="label-pos-11">{range[0]}</span>
                  <span className="label-pos-33">{range[2]}</span>
                  <span className="label-pos-67">{range[3]}</span>
                  <span className="label-pos-89">{range[5]}</span>
                </>
              ) : (
                range && (
                  <>
                    <span className="label-pos-0">0</span>
                    <span className="label-pos-25">{range[0]}</span>
                    <span className="label-pos-50">{range[1]}</span>
                    <span className="label-pos-75">{range[2]}</span>
                    <span className="label-pos-100">
                      {Math.round((range[2] + (range[2] - range[1])) * 100) / 100}
                    </span>
                  </>
                )
              )}
            </div>
          </div>
          <div className="analysis-card-date-wrapper">
            <div className="analysis-card-date">Analyse du {data?.date || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
