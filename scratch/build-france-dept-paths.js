const fs = require('fs');
const path = require('path');

const GEOJSON_PATH = process.argv[2] || '/tmp/fr-depts.geojson';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'france-dept-paths.json');

const MIN_LON = -5.3;
const MAX_LON = 9.75;
const MIN_LAT = 41.15;
const MAX_LAT = 51.2;
const W = 1000;
const H = 1000;
const TOL = 2.5;

function round1(v) {
  return Math.round(v);
}

function project(lon, lat) {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * W;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * H;
  return [round1(x), round1(y)];
}

function radialSimplify(pts, tol) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = out[out.length - 1];
    const [x, y] = pts[i];
    if ((x - x0) ** 2 + (y - y0) ** 2 >= tol * tol) out.push(pts[i]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function ringToPath(ring) {
  const pts = radialSimplify(ring.map(([lon, lat]) => project(lon, lat)), TOL);
  if (pts.length < 3) return '';
  return 'M' + pts.map((p) => p[0] + ' ' + p[1]).join('L') + 'Z';
}

function geomToPath(geom) {
  if (geom.type === 'Polygon') return geom.coordinates.map(ringToPath).filter(Boolean).join(' ');
  if (geom.type === 'MultiPolygon') return geom.coordinates.map((poly) => poly.map(ringToPath).filter(Boolean).join(' ')).filter(Boolean).join(' ');
  return '';
}

const geo = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
const out = { _viewBox: `0 0 ${W} ${H}` };

for (const f of geo.features) {
  const code = f.properties.code;
  const d = geomToPath(f.geometry);
  if (code && d) out[code] = d;
}

const codes = Object.keys(out).filter((k) => k !== '_viewBox');
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out));
console.log(`${codes.length} départements convertis -> ${OUTPUT_PATH}`);
console.log(`Taille : ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} Ko`);
