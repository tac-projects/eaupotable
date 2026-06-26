import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let searchIndexCache = null;

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
    if (!searchIndexCache) {
      const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
      searchIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    const cityIndex = searchIndexCache;

    const query = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const matches = Object.keys(cityIndex)
      .filter(key => key.includes(query) && isNaN(key))
      .map(key => {
        let score = 3; // Par défaut : contient
        if (key === query) score = 1; // Correspondance exacte
        else if (key.startsWith(query)) score = 2; // Commence par

        return { key, score, length: key.length };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.length !== b.length) return a.length - b.length;
        return a.key.localeCompare(b.key);
      })
      .slice(0, 10)
      .map(match => ({
        text: match.key
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        slug: match.key,
        dpt: cityIndex[match.key],
      }));

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
