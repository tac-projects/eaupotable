'use client';
import { Fragment } from 'react';
import { getParameterStatus } from '@/lib/water-utils';
import { SEO_DOSSIERS } from '@/lib/params-registry';

export default function SeoDataTable({ cityName, stats, nomReseau, isConform }) {
  const dossiers = SEO_DOSSIERS;

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
