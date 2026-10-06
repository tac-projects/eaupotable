import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { logSearchMiss } from '../../../lib/search-miss-log';
import searchMatch from '../../../lib/search-match';

let searchIndexCache = null;
let cityKeysCache = null;
let postalIndexCache = null;
let cityInfoCache = null;
let inseeGeoCache = null;

// ---------------------------------------------------------------------------
// Résolution INSEE -> { nom, codesPostaux } pour afficher les codes postaux
// des résultats par nom (uniformité avec la recherche par code postal).
// L'index INSEE est construit une seule fois depuis les 101 fichiers
// départementaux (meta.insee -> slug), puis joint à communes-geo.json.
// ---------------------------------------------------------------------------
function getCitiesInfo() {
  if (cityInfoCache) return cityInfoCache;

  const deptDir = path.join(process.cwd(), 'public', 'data', 'departments');
  const geoPath = path.join(process.cwd(), 'public', 'data', 'communes-geo.json');
  const map = new Map();

  try {
    if (!inseeGeoCache) {
      inseeGeoCache = JSON.parse(fs.readFileSync(geoPath, 'utf8'));
    }
    const cityIndex = searchIndexCache;
    for (const file of fs.readdirSync(deptDir).filter(f => f.endsWith('.json'))) {
      const dept = file.replace('.json', '');
      let data;
      try {
        data = JSON.parse(fs.readFileSync(path.join(deptDir, file), 'utf8'));
      } catch { continue; }

      for (const [baseSlug, city] of Object.entries(data.cities || {})) {
        const insee = city.meta && city.meta.insee;
        if (!insee) continue;

        let slug = baseSlug;
        if (cityIndex) {
          const val = cityIndex[baseSlug];
          const d = typeof val === 'string' ? val : val && val.d;
          if (d !== dept && cityIndex[`${baseSlug}-${dept}`]) slug = `${baseSlug}-${dept}`;
        }

        const g = inseeGeoCache[insee];
        map.set(slug, {
          pc: (g && g.codesPostaux) || [],
          n: (g && g.nom) || city.cityName,
          r: (g && g.regionNom) || null,
        });
      }
    }
  } catch { /* index indisponible : on renvoie des champs vides */ }

  cityInfoCache = map;
  return map;
}

// ---------------------------------------------------------------------------
// Recherche par code postal
// Un code postal peut couvrir plusieurs communes (médiane 3, max 46) : on
// renvoie les communes référencées triées par population. Les saisies
// partielles (4 chiffres) et le zéro initial omis sont gérés par préfixe.
// ---------------------------------------------------------------------------
function getPostalIndex() {
  if (!postalIndexCache) {
    const p = path.join(process.cwd(), 'public', 'data', 'postal-index.json');
    postalIndexCache = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return postalIndexCache;
}

function searchPostal(digits, index) {
  // `digits` : 4 ou 5 chiffres. Pour 4 chiffres, on teste aussi la variante
  // zéro-paddée (ex. « 1330 » -> « 01330 »).
  const prefixes = digits.length === 4 ? [digits, `0${digits}`] : [digits];

  const seen = new Map();
  for (const cp of Object.keys(index.codes)) {
    if (!prefixes.some(p => cp === p || cp.startsWith(p))) continue;
    for (const e of index.codes[cp]) {
      if (!seen.has(e.s)) seen.set(e.s, e);
    }
  }

  const results = [...seen.values()]
    .sort((a, b) => b.p - a.p)
    .slice(0, 10)
    .map(e => {
      const dept = index.depts[e.d] || {};
      return {
        kind: 'city',
        text: e.n,
        slug: e.s,
        dpt: e.d,
        deptName: dept.n || null,
        region: dept.r || null,
        pc: e.c,
      };
    });

  if (results.length > 0) return results;

  // Repli : aucune commune référencée pour ce code -> proposer le département.
  for (const cp of Object.keys(index.codeDept)) {
    if (!prefixes.some(p => cp === p || cp.startsWith(p))) continue;
    const dept = index.codeDept[cp];
    const d = index.depts[dept] || {};
    const label = d.n ? `département ${dept} (${d.n})` : `département ${dept}`;
    return [{ kind: 'dept', text: `Aucune commune référencée — voir les villes du ${label}`, dept }];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Headers CORS (l'API est publique mais restreinte au domaine principal)
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.eaupotable.net',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ---------------------------------------------------------------------------
// Rate limiter côté serveur (mémoire) pour protéger l'API des abus.
// Limite : 20 requêtes par fenêtre de 60 secondes par IP.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();

function getRateLimitInfo(ip) {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 20;   // 20 requêtes max par fenêtre

  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > windowMs) {
    // Nouvelle fenêtre
    const newRecord = { count: 1, windowStart: now };
    rateLimitMap.set(ip, newRecord);
    return { remaining: maxRequests - 1, reset: now + windowMs };
  }

  record.count += 1;

  // Nettoyage mémoire périodique (tous les 100 enregistrements expirés)
  if (rateLimitMap.size > 10_000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.windowStart > windowMs) rateLimitMap.delete(key);
    }
  }

  return { remaining: Math.max(0, maxRequests - record.count), reset: record.windowStart + windowMs };
}

export async function GET(request) {
  // --- 1. Rate limiting ----------------------------------------------------
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  const { remaining, reset } = getRateLimitInfo(ip);

  if (remaining <= 0) {
    return NextResponse.json(
      { error: 'Too Many Requests. Veuillez réessayer dans une minute.' },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // --- 2. Paramètre de recherche -------------------------------------------
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([], {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  }

  // Validation de sécurité : limite de longueur + whitelist de caractères
  if (q.length > 100) {
    return NextResponse.json(
      { error: 'Requête trop longue (max 100 caractères).' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  // N'autorise que les caractères typiques des noms de villes françaises
  if (!/^[\w\s\-'’éèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ.,()]+$/u.test(q)) {
    return NextResponse.json(
      { error: 'Caractères non autorisés dans la recherche.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // --- 3. Recherche --------------------------------------------------------
  try {
    // --- Recherche par code postal (4-5 chiffres) ---------------------------
    const digits = q.replace(/\s/g, '');
    if (/^\d{4,5}$/.test(digits)) {
      const results = searchPostal(digits, getPostalIndex());
      if (results.length === 0) logSearchMiss(q, 'api', ip);
      return NextResponse.json(results, {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    }

    if (!searchIndexCache) {
      const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
      searchIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    const cityIndex = searchIndexCache;

    // Correspondances par nom (exact → préfixe → contenu → repli tolérant aux
    // fautes de frappe, cf. lib/search-match.js). Les clés numériques ne sont
    // pas des communes : exclues une seule fois, puis réutilisées.
    if (!cityKeysCache) cityKeysCache = Object.keys(cityIndex).filter(key => isNaN(key));
    const matches = searchMatch.matchByName(q, cityKeysCache, 10).map(match => {
      const val = cityIndex[match.key];
      const dpt = typeof val === 'string' ? val : val && val.d;
      const info = getCitiesInfo().get(match.key);
      return {
        kind: 'city',
        text: match.key
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        slug: match.key,
        dpt,
        deptName: (typeof val === 'object' && val && val.n) || (info && info.n) || null,
        region: (typeof val === 'object' && val && val.r) || (info && info.r) || null,
        pc: (info && info.pc) || [],
      };
    });

    if (matches.length === 0) logSearchMiss(q, 'api', ip);

    return NextResponse.json(matches, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  } catch (e) {
    return NextResponse.json([], {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }
}

// Gestionnaire OPTIONS pour les requêtes CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
