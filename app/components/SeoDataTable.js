'use client';
import { Fragment } from 'react';
import { getParameterStatus } from '@/lib/water-utils';

export default function SeoDataTable({ cityName, stats, nomReseau, isConform }) {
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
                        <div className={`seo-status-pill ${status.class}`} style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px' }}>
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
