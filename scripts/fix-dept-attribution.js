/**
 * fix-dept-attribution.js — Correction de l'attribution départementale.
 *
 * Contexte (audit SEO 12/08/2026, point 5) :
 *   Le bug d'« aspiration PLV » de build-dept-generic.js a placé ~305 villes dans
 *   un fichier départemental qui ne correspond pas à leur INSEE (ex: saint-cloud
 *   dans 75.json alors que son INSEE 92064 → 92). 303 d'entre elles sont des
 *   doublons (l'entrée correcte existe dans le bon fichier) → suppression.
 *   2 sont à déplacer (loeuilley, attricourt → 70).
 *   4 cas limites (communes étrangères 99xxx / COM 977-978) sont conservés tels quels.
 *
 * Le script réplique EXACTEMENT les formules d'agrégation de build-dept-generic.js
 * (avgScore, conformRate, averages, topCities) puis régénère city-index.json.
 *
 * Usage :
 *   node scripts/fix-dept-attribution.js            → exécution réelle (écrit les fichiers)
 *   node scripts/fix-dept-attribution.js --dry-run  → affiche le plan sans écrire
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'data', 'departments');
const INDEX_PATH = path.join(__dirname, '..', 'public', 'city-index.json');
const DRY_RUN = process.argv.includes('--dry-run');

// --- Réplication de lib/water-utils.js:66 ---
function parseValue(val) {
  if (val === undefined || val === null) return NaN;
  if (typeof val === 'number') return val;
  const s = val.toString().toLowerCase();
  if (s.includes('<')) return 0;
  if (s.includes('absence') || s.includes('non détecté')) return 0;
  const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? NaN : parsed;
}

// --- Réplication de scripts/build-dept-generic.js:161 ---
const makeSlug = (s) => s.toLowerCase()
  .replace(/œ/g, 'oe')
  .replace(/æ/g, 'ae')
  .normalize('NFD')
  .replace(/[\\u0300-\\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/-$/, '');

// Département attendu d'après le code INSEE (référence officielle).
function expectedDept(insee) {
  if (/^2[AB]/.test(insee)) return insee.slice(0, 2); // Corse
  if (/^97\d/.test(insee)) return insee.slice(0, 3);  // DOM
  if (/^\d{5}$/.test(insee)) return insee.slice(0, 2); // Métropole
  return null;
}

// Recalcule avgScore / conformRate / averages (formules exactes du build, lignes 470-491).
function recomputeAggregates(dept, data) {
  const cities = Object.values(data.cities);
  if (!cities.length) return;

  data.deptInfo.avgScore = Math.round((cities.reduce((a, b) => a + b.crystal.final, 0) / cities.length) * 10) / 10;
  data.deptInfo.conformRate = Math.round((cities.filter(c => c.isConform).length / cities.length) * 100);

  // Ordre des indicateurs préservé (clés existantes d'abord, nouvelles ensuite) pour minimiser le diff.
  const keys = [...new Set([...Object.keys(data.deptInfo.averages || {}), ...cities.flatMap(c => Object.keys(c.stats))])];
  const avgData = {};
  for (const indicator of keys) {
    const values = cities.map(c => parseValue(c.stats[indicator]?.val)).filter(v => !isNaN(v));
    if (values.length > 0) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      if (indicator === 'microbiology') {
        avgData[indicator] = { val: 'Absence', unit: '' };
      } else {
        let formatted = mean.toFixed(2).replace('.', ',');
        if (mean > 10) formatted = Math.round(mean).toString();
        else if (mean < 0.1) formatted = mean <= 0.01 ? '< 0,01' : mean.toFixed(3).replace('.', ',');
        let unit = cities.find(c => c.stats[indicator]?.unit)?.stats[indicator]?.unit || '';
        unit = unit.replace('mg(Cl2)/L', 'mg/L').replace('unité pH', 'pH');
        avgData[indicator] = { val: formatted, unit: ' ' + unit };
      }
    } else {
      avgData[indicator] = { val: '--', unit: '' };
    }
  }
  data.deptInfo.averages = avgData;
}

// Recomplète topCities (formules du build, lignes 500-522) si une ville retirée y figurait
// ou si le département a reçu une ville en move.
function recomputeTopCities(dept, data, removedSlugs, gained) {
  const removedWasInTop = (data.deptInfo.topCities || []).some(t => removedSlugs.has(t.slug));
  if (!removedWasInTop && !gained) return false; // rien à faire

  let tc = (data.deptInfo.topCities || []).filter(t => !removedSlugs.has(t.slug));
  if (tc.length < 10) {
    const available = Object.keys(data.cities)
      .map(slug => data.cities[slug].cityName)
      .filter(name => !tc.some(t => t.slug === makeSlug(name)))
      .sort((a, b) => a.localeCompare(b, 'fr'));
    const needed = 10 - tc.length;
    tc = [...tc, ...available.slice(0, needed).map(name => {
      const slug = makeSlug(name);
      const city = data.cities[slug];
      return { name: city ? city.cityName : name, score: city ? city.crystal.final : 7.0, slug };
    })];
  }
  data.deptInfo.topCities = tc;
  return true;
}

// Réplication de updateIndex() (build-dept-generic.js:541-586).
function regenerateIndex(all) {
  const index = {};
  const collisions = [];
  const files = Object.keys(all).sort();
  for (const dept of files) {
    const data = all[dept];
    if (!data.cities) continue;
    for (const slug of Object.keys(data.cities)) {
      if (index[slug] && index[slug] !== dept) {
        const uniqueSlug = `${slug}-${dept}`;
        index[uniqueSlug] = dept;
        collisions.push({ original: slug, unique: uniqueSlug, depts: [index[slug], dept] });
      } else {
        index[slug] = dept;
      }
    }
  }
  return { index, collisions };
}

// ---------------------------------------------------------------- main
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json'));
const all = {};
for (const f of files) all[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

const toRemove = [];   // { dept, slug }
const toMove = [];     // { fromDept, slug } → vers expectedDept
const keptEdges = [];  // { dept, slug, insee }
const affected = new Set();
const scoreChanges = [];

// 1. Classification
for (const [dept, data] of Object.entries(all)) {
  if (!data.cities) continue;
  for (const [slug, c] of Object.entries(data.cities)) {
    const expected = expectedDept(c.meta?.insee || '');
    if (!expected || expected === dept) continue;
    const target = all[expected];
    if (target && target.cities && target.cities[slug]) {
      toRemove.push({ dept, slug });
      affected.add(dept);
      const s1 = c.crystal?.final, s2 = target.cities[slug].crystal?.final;
      if (s1 !== s2) scoreChanges.push({ name: c.cityName, wrong: s1, correct: s2, dept, expected });
    } else if (target) {
      toMove.push({ fromDept: dept, slug, toDept: expected });
      affected.add(dept); affected.add(expected);
    } else {
      keptEdges.push({ dept, slug, insee: c.meta?.insee });
    }
  }
}

// 2. Application (remove / move) — mémoire
const removeSet = new Set(toRemove.map(r => r.dept + '|' + r.slug));
const movedSlugsByTarget = {};
const removedSlugsByDept = {};
for (const r of toRemove) {
  delete all[r.dept].cities[r.slug];
  (removedSlugsByDept[r.dept] ||= new Set()).add(r.slug);
}
for (const m of toMove) {
  const city = all[m.fromDept].cities[m.slug];
  delete all[m.fromDept].cities[m.slug];
  city.meta.code_departement = m.toDept;
  all[m.toDept].cities[m.slug] = city;
  (removedSlugsByDept[m.fromDept] ||= new Set()).add(m.slug);
  (movedSlugsByTarget[m.toDept] ||= new Set()).add(m.slug);
}

// 3. Recalcul des agrégats des départements touchés
const recomputed = [];
for (const dept of affected) {
  const data = all[dept];
  if (!data.cities || !Object.keys(data.cities).length) continue;
  recomputeAggregates(dept, data);
  const removed = removedSlugsByDept[dept] || new Set();
  const gained = (movedSlugsByTarget[dept] || new Set()).size > 0;
  const dirtyTop = gained || [...removed].some(slug => (data.deptInfo.topCities || []).some(t => t.slug === slug));
  if (dirtyTop) recomputeTopCities(dept, data, removed, gained);
  recomputed.push(dept);
}

// 4. Rapport
console.log('━━━ Rapport de correction ━━━');
console.log(`Doublons supprimés        : ${toRemove.length}`);
console.log(`Villes déplacées          : ${toMove.length} (${toMove.map(m => m.slug + ' → ' + m.toDept).join(', ')})`);
console.log(`Cas limites conservés     : ${keptEdges.length} (${keptEdges.map(e => e.slug).join(', ')})`);
console.log(`Départements recalculés   : ${recomputed.length} (${recomputed.join(', ')})`);
console.log(`Scores affichés changés   : ${scoreChanges.length}`);
scoreChanges.sort((a, b) => Math.abs(b.correct - b.wrong) - Math.abs(a.correct - a.wrong));
scoreChanges.slice(0, 15).forEach(s => console.log(`  ${s.wrong} → ${s.correct}  ${s.name} [${s.dept}→${s.expected}]`));
if (scoreChanges.length > 15) console.log(`  … et ${scoreChanges.length - 15} autres (liste complète dans /tmp/fix-scores.txt)`);
fs.writeFileSync('/tmp/fix-scores.txt', scoreChanges.map(s => `${s.wrong} → ${s.correct}  ${s.name} [${s.dept}→${s.expected}]`).join('\n'));

// 5. Index régénéré
const { index, collisions } = regenerateIndex(all);
const currentIndex = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const disappeared = Object.keys(currentIndex).filter(k => !index[k]);
console.log(`Index : ${Object.keys(currentIndex).length} → ${Object.keys(index).length} clés`);
console.log(`URLs qui disparaissent (collisions) : ${disappeared.length}`);
fs.writeFileSync('/tmp/fix-disappeared-urls.txt', disappeared.join('\n'));

if (DRY_RUN) {
  console.log('\n[DRY RUN] Aucun fichier écrit.');
} else {
  // 6. Écriture
  for (const dept of Object.keys(all)) {
    fs.writeFileSync(path.join(DIR, dept + '.json'), JSON.stringify(all[dept], null, 2));
  }
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log('\n✓ Fichiers départementaux et city-index.json écrits.');
}
