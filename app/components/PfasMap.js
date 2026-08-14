import fs from 'fs';
import path from 'path';

let pathsCache = null;

function getDeptPaths() {
  if (pathsCache) return pathsCache;
  const filePath = path.join(process.cwd(), 'public', 'data', 'france-dept-paths.json');
  try {
    pathsCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    pathsCache = { _viewBox: '0 0 1000 1000' };
  }
  return pathsCache;
}

function palette(alerts) {
  if (alerts >= 20) return 'pfas-map-over';
  if (alerts >= 5) return 'pfas-map-high';
  if (alerts >= 1) return 'pfas-map-low';
  return 'pfas-map-zero';
}

export default function PfasMap({ departments }) {
  const { _viewBox, ...paths } = getDeptPaths();
  const byCode = {};
  for (const d of departments) byCode[d.code] = d;

  return (
    <div className="pfas-map-block">
      <svg
        className="pfas-map-svg"
        viewBox={_viewBox || '0 0 1000 1000'}
        role="img"
        aria-label="Carte de France des communes en alerte PFAS par département"
      >
        {Object.entries(paths).map(([code, d]) => {
          const dept = byCode[code];
          const alerts = dept ? dept.alerts : 0;
          const label = dept
            ? `${dept.name} (${code}) : ${dept.alerts} commune${dept.alerts > 1 ? 's' : ''} en alerte PFAS`
            : `Département ${code}`;
          return (
            <a key={code} href={`/departement/${code}`} aria-label={label} className="pfas-map-link">
              <path className={`pfas-map-path ${palette(alerts)}`} d={d}>
                <title>{label}</title>
              </path>
            </a>
          );
        })}
      </svg>

      <ul className="pfas-map-legend" aria-label="Légende de la carte">
        <li>
          <span className="pfas-map-swatch pfas-map-zero"></span>
          Aucune commune en alerte
        </li>
        <li>
          <span className="pfas-map-swatch pfas-map-low"></span>
          1 à 4 communes en alerte
        </li>
        <li>
          <span className="pfas-map-swatch pfas-map-high"></span>
          5 à 19 communes en alerte
        </li>
        <li>
          <span className="pfas-map-swatch pfas-map-over"></span>
          20 communes ou plus
        </li>
      </ul>

      <p className="pfas-map-note">
        Alerte : concentration PFAS supérieure à 0,05 µg/L au dernier prélèvement ARS.
        Carte de la France métropolitaine — les départements d&rsquo;outre-mer disposent
        de leur propre fiche départementale.
      </p>
    </div>
  );
}
