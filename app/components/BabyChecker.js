'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

const VIGILANCE_NIT = 15;
const LIMIT_NIT = 50;
const LIMIT_PFAS = 0.1;

function toNum(val) {
  if (val === undefined || val === null || val === '--') return NaN;
  const clean = String(val).replace(/[^0-9,.]/g, '').replace(',', '.').trim();
  if (!clean) return NaN;
  const n = parseFloat(clean);
  return isNaN(n) ? NaN : n;
}

function computeOutcome(data) {
  const nit = data.stats?.nitrates ? toNum(data.stats.nitrates.val) : NaN;
  const pfas = data.stats?.pfas ? toNum(data.stats.pfas.val) : NaN;
  const micro = data.stats?.microbiology?.val || null;

  if (data.isConform === false) {
    return { level: 'critical', reason: 'conforme_false' };
  }
  if (!isNaN(nit) && nit >= LIMIT_NIT) {
    return { level: 'critical', reason: 'nitrates_over' };
  }
  if (!isNaN(pfas) && pfas > LIMIT_PFAS) {
    return { level: 'critical', reason: 'pfas_over' };
  }
  if (!isNaN(nit) && nit >= VIGILANCE_NIT) {
    return { level: 'warning', reason: 'nitrates_mid' };
  }
  const hasData = !isNaN(nit) || !isNaN(pfas) || micro;
  if (!hasData) {
    return { level: 'unknown', reason: 'no_data' };
  }
  return { level: 'ok', reason: 'ok' };
}

const OUTCOME_TEXT = {
  ok: {
    label: 'Adaptée aux biberons',
    cls: 'status-excellent'
  },
  warning: {
    label: 'Vigilance recommandée',
    cls: 'status-warning'
  },
  critical: {
    label: 'Non recommandée pour bébé',
    cls: 'status-critical'
  },
  unknown: {
    label: 'Données insuffisantes',
    cls: 'status-unknown'
  }
};

export default function BabyChecker() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          if ((!data || data.length === 0) && query.trim().length >= 3) {
            track('search_no_result', { q: query.trim() });
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([]);
      }
    }, 300);
    return () => {
      clearTimeout(handler);
      abortRef.current = null;
    };
  }, [query]);

  const handleSelect = async (feature) => {
    setQuery('');
    setSuggestions([]);
    setIsFocused(false);
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/bebe-check?slug=${encodeURIComponent(feature.slug)}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Commune introuvable.' : 'Erreur serveur.');
      }
      const data = await res.json();
      setResult(data);
      const outcome = computeOutcome(data);
      track('bebe_check', { ville: data.cityName, outcome: outcome.level });
    } catch (err) {
      setError(err.message || 'Impossible de vérifier cette commune. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetChecker = () => {
    setResult(null);
    setError(null);
    setQuery('');
  };

  return (
    <div className="bebe-checker">
      <div className="bebe-checker-search">
        <svg className="bebe-checker-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          className="bebe-checker-input"
          placeholder="Saisissez votre commune (ex. Lyon, Strasbourg…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          aria-label="Rechercher une commune"
        />
        {isFocused && suggestions.length > 0 && (
          <ul className="bebe-checker-suggestions">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                >
                  <span className="bebe-checker-suggestion-name">{s.text}</span>
                  <span className="bebe-checker-suggestion-dept">({s.dpt})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isLoading && (
        <div className="bebe-checker-loading">
          <span className="bebe-checker-spinner" aria-hidden="true"></span>
          Analyse des derniers prélèvements ARS…
        </div>
      )}

      {error && (
        <div className="bebe-checker-error">
          <p>{error}</p>
          <button type="button" onClick={resetChecker}>Réessayer</button>
        </div>
      )}

      {result && !isLoading && <ResultPanel result={result} onReset={resetChecker} />}
    </div>
  );
}

function ResultPanel({ result, onReset }) {
  const outcome = computeOutcome(result);
  const meta = OUTCOME_TEXT[outcome.level];
  const nit = result.stats?.nitrates;
  const pfas = result.stats?.pfas;
  const micro = result.stats?.microbiology;
  const score = typeof result.crystal?.final === 'number' ? result.crystal.final.toFixed(1) : '--';
  const label = result.crystal?.label || '';
  const deptLabel = result.dept?.name ? `${result.dept.name} (${result.dept.code})` : '';

  let text;
  if (outcome.level === 'ok') {
    text = (
      <>
        L&rsquo;eau de <strong>{result.cityName}</strong> est adaptée à la préparation des biberons&nbsp;: conforme aux
        contrôles ARS{nit ? <> et faible en nitrates ({nit.val} mg/L)</> : null}. Laissez couler l&rsquo;eau
        <strong> froide</strong> quelques secondes avant de remplir le biberon, et utilisez-la immédiatement.
      </>
    );
  } else if (outcome.level === 'warning') {
    text = (
      <>
        L&rsquo;eau de <strong>{result.cityName}</strong> est conforme pour les adultes, mais ses nitrates
        ({nit.val} mg/L) appellent à la prudence pour un nourrisson de moins de 6 mois&nbsp;: pour les biberons,
        préférez temporairement une eau en bouteille étiquetée «&nbsp;convient à la préparation des aliments des
        nourrissons&nbsp;», ou demandez conseil à votre médecin ou à la PMI.
      </>
    );
  } else if (outcome.level === 'critical') {
    text = (
      <>
        Ne pas utiliser l&rsquo;eau de <strong>{result.cityName}</strong> pour la préparation des biberons
        {outcome.reason === 'nitrates_over' && <> (nitrates à {nit.val} mg/L, au-dessus de la limite de 50 mg/L)</>}
        {outcome.reason === 'pfas_over' && <> (PFAS au-dessus de la limite de qualité)</>}
        {outcome.reason === 'conforme_false' && <> (eau déclarée non conforme par l&rsquo;ARS)</>}. Suivez les consignes
        de l&rsquo;ARS et utilisez une eau en bouteille adaptée en attendant.
      </>
    );
  } else {
    text = (
      <>
        Les derniers prélèvements de <strong>{result.cityName}</strong> ne permettent pas de conclure sur tous les
        critères bébé. Consultez la fiche complète de la commune pour le détail des analyses.
      </>
    );
  }

  const rows = [
    { k: 'Nitrates', v: nit ? `${nit.val} mg/L` : null, d: nit?.date || null },
    { k: 'PFAS', v: pfas ? `${pfas.val} µg/L` : null, d: pfas?.date || null },
    { k: 'Microbiologie', v: micro ? micro.val : null, d: micro?.date || null }
  ].filter((r) => r.v !== null);

  return (
    <div className={`bebe-result ${outcome.level === 'ok' ? 'is-ok' : outcome.level === 'warning' ? 'is-warning' : outcome.level === 'critical' ? 'is-critical' : 'is-unknown'}`}>
      <div className="bebe-result-head">
        <div>
          <p className="bebe-result-city">{result.cityName}{deptLabel ? <span className="bebe-result-dept"> — {deptLabel}</span> : null}</p>
          {result.meta?.date_prelevement ? (
            <p className="bebe-result-date">Dernier prélèvement ARS : {result.meta.date_prelevement.split('-').reverse().join('/')}</p>
          ) : null}
        </div>
        <span className={`bebe-outcome-badge ${meta.cls}`}>{meta.label}</span>
      </div>

      <div className="bebe-result-body">
        <div className="bebe-result-score">
          <span className="bebe-result-score-val">{score}<small>/10</small></span>
          <span className="bebe-result-score-label">{label}</span>
        </div>
        <div className="bebe-result-infos">
          <p className="bebe-result-conform">
            {result.isConform ? 'Eau conforme aux contrôles sanitaires' : 'Eau déclarée non conforme par l\u2019ARS'}
          </p>
          <ul className="bebe-result-measures">
            {rows.map((r) => (
              <li key={r.k}>
                <span>{r.k}</span>
                <strong>{r.v}</strong>
                {r.d ? <em>mesuré le {r.d}</em> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="bebe-result-text">{text}</p>

      <div className="bebe-result-actions">
        <Link href={`/ville/${result.slug}`} className="cta-btn-premium">
          Voir la fiche complète de {result.cityName}
        </Link>
        <button type="button" className="bebe-result-again" onClick={onReset}>Vérifier une autre commune</button>
      </div>
    </div>
  );
}
