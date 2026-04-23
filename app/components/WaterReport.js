'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  getParameterStatus,
  PARAM_ICONS,
  RANGES,
  CENTERED_PARAMS,
  parseValue
} from '@/lib/water-utils';

export default function WaterReport({ data, onShare }) {
  const { cityName, crystal, stats, isConform, meta } = data;
  const nomReseau = meta.nom_distributeur || meta.nom_reseau || "Réseau Municipal";
  let scoreClass = (crystal.final < 5) ? "status-critical" : (crystal.final < 8) ? "status-warning" : (crystal.final < 8.5) ? "status-good" : "status-excellent";

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
  ];

  return (
    <>
      <div className="vignette-hero">
        <div className="hero-overlay"></div>
        <button className="hero-share-btn" onClick={onShare} aria-label="Partager l'analyse de cette ville">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
        </button>
        <div className="hero-content">
          <div className="hero-score-card">
            <div className="hero-score-val">{crystal.final}/10</div>
            <div className={`hero-status-badge ${scoreClass}`}>{crystal.label}</div>
          </div>
          <div className="hero-footer"><h2 className="hero-city">{cityName}</h2><div className="hero-network">{nomReseau}</div></div>
        </div>
      </div>
      <div className="report-content">
        <div className="report-section">
          <div className="section-header"><span>Analyse détaillée</span></div>
          {paramsList.map((p, i) => (<ParameterRow key={i} parameter={p} />))}
        </div>
        <div className="report-footer">
          <div className={`legal-badge ${isConform ? 'legal-ok' : 'legal-ko'}`}>
            <span>Conformité : <strong>{isConform ? 'CONFORME' : 'NON CONFORME'}</strong></span>
          </div>
          {meta.conclusion && !isConform && (
            <div className="ars-conclusion-minimal">
              <p><strong>Verdict officiel :</strong> {meta.conclusion}</p>
              <p className="ars-educational-tip">Un dépassement sur un paramètre technique (calcaire, fer, goût) peut entraîner ce statut même si les polluants majeurs sont absents.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ParameterRow({ parameter }) {
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
    <div className="yuka-row-wrapper">
      <div className="yuka-row" onClick={() => setIsOpen(!isOpen)}>
        <div className="yuka-icon" dangerouslySetInnerHTML={{ __html: PARAM_ICONS[key] }} />
        <span className="yuka-name">{name}</span>
        <div className="yuka-val">
          {(() => {
            const isAbsence = key === 'microbiology' && (data?.val?.includes('<') || data?.val?.toLowerCase().includes('absence'));
            return (
              <>
                {isAbsence ? 'Absence' : (data?.val || '--')}
                {!isAbsence && data?.unit && <small> {data.unit}</small>}
              </>
            );
          })()}
        </div>
        <div className={`yuka-dot-small ${status.class}`}></div>
        <svg className={`yuka-toggle-arrow ${isOpen ? 'active' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <span className="yuka-subtitle">{status.subtitle}</span>
      </div>
      {isOpen && (
        <div className="yuka-details active">
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
            <div className="yuka-date-info vignette-date">Analyse du {data?.date || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
