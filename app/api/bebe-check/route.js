import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let searchIndexCache = null;
let deptDataCache = new Map();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://www.eaupotable.net',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const rateLimitMap = new Map();

function getRateLimitInfo(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 20;
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > windowMs) {
    const newRecord = { count: 1, windowStart: now };
    rateLimitMap.set(ip, newRecord);
    return { remaining: maxRequests - 1, reset: now + windowMs };
  }
  record.count += 1;
  if (rateLimitMap.size > 10_000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.windowStart > windowMs) rateLimitMap.delete(key);
    }
  }
  return { remaining: Math.max(0, maxRequests - record.count), reset: record.windowStart + windowMs };
}

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  const { remaining, reset } = getRateLimitInfo(ip);
  if (remaining <= 0) {
    return NextResponse.json(
      { error: 'Too Many Requests. Veuillez réessayer dans une minute.' },
      {
        status: 429,
        headers: { ...CORS_HEADERS, 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(), 'X-RateLimit-Remaining': '0' },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get('slug') || '').toLowerCase().trim();

  if (!slug || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length > 80) {
    return NextResponse.json(
      { error: 'Slug invalide.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const headers = { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400', 'X-RateLimit-Remaining': remaining.toString() };

  try {
    if (!searchIndexCache) {
      const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
      if (!fs.existsSync(indexPath)) throw new Error('city-index introuvable');
      searchIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    const deptCode = searchIndexCache[slug];
    if (!deptCode) {
      return NextResponse.json({ error: 'Commune introuvable.' }, { status: 404, headers: CORS_HEADERS });
    }

    let deptData = null;
    if (deptDataCache.has(deptCode)) {
      deptData = deptDataCache.get(deptCode);
    } else {
      const filePath = path.join(process.cwd(), 'public', 'data', 'departments', `${deptCode}.json`);
      if (!fs.existsSync(filePath)) throw new Error('Fichier département introuvable');
      deptData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      deptDataCache.set(deptCode, deptData);
    }

    const city = deptData.cities && deptData.cities[slug];
    if (!city) {
      return NextResponse.json({ error: 'Commune introuvable.' }, { status: 404, headers: CORS_HEADERS });
    }

    const pickStat = (key) => {
      const s = city.stats && city.stats[key];
      if (!s || s.val === undefined || s.val === '--') return null;
      return { val: s.val, unit: (s.unit || '').trim(), date: s.date || null };
    };

    return NextResponse.json({
      cityName: city.cityName || slug,
      slug,
      dept: { code: deptCode, name: deptData.deptInfo?.name || '' },
      crystal: city.crystal || null,
      isConform: typeof city.isConform === 'boolean' ? city.isConform : null,
      stats: {
        nitrates: pickStat('nitrates'),
        pfas: pickStat('pfas'),
        microbiology: pickStat('microbiology')
      },
      meta: city.meta
        ? {
            conclusion: city.meta.conclusion || null,
            date_prelevement: city.meta.date_prelevement || null
          }
        : null
    }, { headers });
  } catch (e) {
    return NextResponse.json({ error: 'Service indisponible.' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
