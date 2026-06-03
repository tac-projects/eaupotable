import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let searchIndexCache = null;

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
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
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
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  } catch (e) {
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }
}
