'use client';

import { useState, Fragment, useMemo } from 'react';
import Link from 'next/link';
import {
  getParameterStatus,
  PARAM_ICONS,
  RANGES,
  CENTERED_PARAMS,
  getMarkerPosition
} from '@/lib/water-utils';
import { ANALYSIS_CARDS, PARAMS } from '@/lib/params-registry';

const ANALYSIS_SCORED_COUNT = PARAMS.filter((p) => p.cardOrder && p.scored).length;

const DEFINITION_ANCHORS = {
  microbiology: 'microbiologie',
  nitrates: 'nitrates',
  pesticides: 'pesticides',
  pfas: 'pfas',
  chlorine: 'chlore',
  hardness: 'calcaire',
  ph: 'ph',
  turb: 'turbidite',
  cond: 'conductivite',
};

export default function CityAnalysisSection({ stats, isConform, meta }) {
  const paramsList = useMemo(() => ANALYSIS_CARDS
    .map((card) => ({
      name: card.name,
      key: card.key,
      data: card.dataKey === 'microbiology'
        ? (stats.microbiology || { val: "--", unit: "", date: new Date(meta.date_prelevement).toLocaleDateString('fr-FR') })
        : stats[card.dataKey]
    }))
    .filter(p => p.data && p.data.val !== undefined), [stats, meta.date_prelevement]);

  return (
    <Fragment>
      <div className="seo-section-header">
        <h2 className="seo-main-title">Analyses Techniques</h2>
        <p className="seo-main-subtitle">Résultats détaillés des derniers prélèvements sanitaires officiels : {ANALYSIS_CARDS.length} paramètres analysés, dont {ANALYSIS_SCORED_COUNT} entrent dans le score Crystal.</p>
      </div>
      <div className="analysis-grid-container">
        <div className="analysis-grid">
          {paramsList.map((p) => (
            <AnalysisCard key={p.key} parameter={p} />
          ))}
        </div>
        
        <div className="analysis-conformity-card">
           <div className={`conformity-badge ${isConform ? 'legal-ok' : 'legal-ko'}`}>
              <span className="icon">{isConform ? '✅' : '⚠️'}</span>
              <span>Conformité Sanitaire : <strong>{isConform ? 'CONFORME' : 'NON CONFORME'}</strong></span>
           </div>
           
           {!isConform && (
            <div className="ars-conclusion-minimal">
              <p>
                <strong>Verdict officiel :</strong>{' '}
                {meta.conclusionNonConforme
                  ? `${meta.conclusionNonConforme}${meta.dateNonConforme ? ` (prélèvement du ${meta.dateNonConforme})` : ''}`
                  : 'au moins un paramètre dépasse sa limite de qualité (voir le détail des cartes ci-dessus).'}
              </p>
              <p className="ars-educational-tip">Une eau peut rester propre à la consommation malgré un dépassement de limite de qualité : suivez les consignes de l&rsquo;ARS.</p>
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
  
  const status = useMemo(() => getParameterStatus(key, data?.val), [key, data?.val]);
  const range = RANGES[key];
  const isCentered = CENTERED_PARAMS.includes(key);
  const pos = useMemo(() => getMarkerPosition(key, data?.val, range, status), [key, data?.val, range, status]);

  const isAbsence = useMemo(() => key === 'microbiology' && (data?.val?.includes('<') || data?.val?.toLowerCase().includes('absence')), [key, data?.val]);

  return (
    <div className={`analysis-card ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="analysis-card-top">
        <div className="analysis-card-left">
          <div className="analysis-card-icon" dangerouslySetInnerHTML={{ __html: PARAM_ICONS[key] }} />
          <div className="analysis-card-main-info">
            <h3 className="analysis-card-name">
              <Link
                href={`/definitions#${DEFINITION_ANCHORS[key] || key}`}
                className="analysis-card-name-link"
                onClick={(e) => e.stopPropagation()}
                title={`Définition : ${name}`}
              >
                {name}
              </Link>
            </h3>
            <div className="analysis-card-subtitle">{status.subtitle}</div>
          </div>
        </div>
        
        <div className="analysis-card-right">
          <div className="analysis-card-result">
            <span className="val">{isAbsence ? 'Absence' : (data?.val || '--')}</span>
            {!isAbsence && data?.unit && <span className="unit"> {data.unit}</span>}
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
