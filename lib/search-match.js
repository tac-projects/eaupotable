/**
 * Recherche de commune par nom — tolérante aux fautes de frappe.
 *
 * CommonJS volontaire (même convention que `lib/crystal-engine.js`) : le
 * runtime Next l'importe par défaut, et `tests/search-match.test.mjs` le
 * `require`/importe tel quel. Aucun import applicatif, aucune donnée.
 *
 * Le mode « code postal » reste géré à part dans `app/api/search/route.js`.
 */

// Normalise une saisie en clé de recherche : minuscules, sans accents, tout
// séparateur (espace, apostrophe, point, virgule, souligné) → tiret.
// Corrige un défaut réel : « Pacy.sur.armancon » ne matchait pas la commune
// « pacy-sur-armancon » car le point n'était pas converti.
function normalizeQuery(input) {
  return String(input == null ? '' : input)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s'’.,_\u2019/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Mots parasites fréquents en fin de saisie (« lyon à », « verdun n »), et
// suffixes numériques d'arrondissement/code (« paris 17 »). On ne retire que
// la fin : un « sur »/« de » internes fait partie du nom réel (Pacy-sur-Armançon).
const WEAK_TAIL = new Set([
  'a', 'au', 'aux', 'de', 'du', 'des', 'le', 'la', 'les', 'l',
  'en', 'et', 'sur', 'sous', 'n', 's', 'd',
]);

function trimWeakTail(slug) {
  const parts = slug.split('-');
  let end = parts.length;
  while (end > 1) {
    const t = parts[end - 1];
    if (WEAK_TAIL.has(t) || /^\d{1,3}$/.test(t)) end--;
    else break;
  }
  return parts.slice(0, end).join('-');
}

function scoreKey(query, key) {
  if (key === query) return 1;          // exact
  if (key.startsWith(query)) return 2;   // commence par
  if (key.includes(query)) return 3;     // contient
  return 0;
}

// Correspondances exactes/préfixe/contenu — comportement historique conservé.
function basicMatches(query, keys, limit) {
  const out = [];
  for (const key of keys) {
    const score = scoreKey(query, key);
    if (score) out.push({ key, score });
  }
  out.sort((a, b) =>
    a.score - b.score ||
    a.key.length - b.key.length ||
    a.key.localeCompare(b.key));
  return out.slice(0, limit);
}

// Distance d'édition minimale entre `a` et un PRÉFIXE de `b` : combien
// d'éditions pour transformer `a` en le début de `b`. Gère les suffixes de
// commune (« sathonnay » → « sathonay-camp ») et les mots en trop
// (« lyon à » → « lyon »). Renvoie Infinity au-delà de `maxDist`.
function prefixDistance(a, b, maxDist) {
  const n = a.length;
  // Au-delà de n + maxDist, aucun préfixe plus long ne peut améliorer le score.
  const m = Math.min(b.length, n + maxDist + 2);
  let prev = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    const cur = new Array(m + 1);
    cur[0] = i;
    let rowMin = Infinity;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      let d = prev[j - 1] + cost;
      const del = prev[j] + 1;
      const ins = cur[j - 1] + 1;
      if (del < d) d = del;
      if (ins < d) d = ins;
      cur[j] = d;
      if (d < rowMin) rowMin = d;
    }
    if (rowMin > maxDist) return Infinity; // élagage : déjà trop loin
    prev = cur;
  }

  let best = Infinity;
  for (let j = 0; j <= m; j++) if (prev[j] < best) best = prev[j];
  return best;
}

// Repli flou, utilisé seulement si la recherche exacte ne donne rien. Seuil à
// 1 édition : corrige une faute de frappe isolée (« izedte » → izeste) sans
// inventer de correspondance pour du bruit (« trifouill » → aucun, reste
// journalisé comme vrai manque). Filtre sur la 1re lettre : perf + précision.
function fuzzyMatches(query, keys, limit) {
  const n = query.length;
  if (n < 4) return [];
  const maxDist = 1;
  const first = query[0];
  const out = [];
  for (const key of keys) {
    if (key.length < n - maxDist) continue;
    if (key[0] !== first) continue;
    const d = prefixDistance(query, key, maxDist);
    if (d <= maxDist) out.push({ key, dist: d });
  }
  out.sort((a, b) =>
    a.dist - b.dist ||
    a.key.length - b.key.length ||
    a.key.localeCompare(b.key));
  return out.slice(0, limit);
}

// Point d'entrée : renvoie [{ key, score }] triés. Exact/préfixe/contenu
// d'abord ; repli flou uniquement si rien ne correspond.
function matchByName(rawQuery, keys, limit = 10) {
  const query = trimWeakTail(normalizeQuery(rawQuery));
  if (!query) return [];
  const basic = basicMatches(query, keys, limit);
  if (basic.length > 0) return basic;
  return fuzzyMatches(query, keys, limit).map(({ key, dist }) => ({ key, score: 4 + dist }));
}

module.exports = { normalizeQuery, matchByName };
