import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Rate limiter global (mémoire edge) pour protéger les pages dynamiques.
// Limite : 20 requêtes / minute / IP sur /ville/ et /departement/.
// Le middleware tourne sur l'edge runtime Next.js, donc très rapide et sans cold start.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();

function isDynamicPage(pathname) {
  return (
    pathname.startsWith('/ville/') ||
    pathname.startsWith('/departement/')
  );
}

function checkRateLimit(request) {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };

  const pathname = request.nextUrl.pathname;
  if (!isDynamicPage(pathname)) return { allowed: true };

  // Exemption des crawlers légitimes pour ne pas brider l'indexation.
  // Inclut l'UA de l'outil "Inspection d'URL" de Google (google-inspectiontool)
  // pour éviter de faux 429 lors de vérifications dans Search Console.
  const ua = request.headers.get('user-agent')?.toLowerCase() || '';
  const isSearchEngine =
    ua.includes('googlebot') ||
    ua.includes('google-inspectiontool') ||
    ua.includes('googleother') ||
    ua.includes('adsbot-google') ||
    ua.includes('bingbot') ||
    ua.includes('slurp') ||
    ua.includes('duckduckbot') ||
    ua.includes('baiduspider') ||
    ua.includes('yandexbot') ||
    ua.includes('applebot') ||
    ua.includes('seznam') ||
    ua.includes('sogou') ||
    ua.includes('naver') ||
    ua.includes('petalbot') ||
    ua.includes('ahrefs') ||
    ua.includes('semrush') ||
    ua.includes('mj12') ||
    ua.includes('dotbot');
  if (isSearchEngine) return { allowed: true };

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 20;   // 20 requêtes max par fenêtre (suffisant pour un humain, dissuasif pour un scraper)

  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > windowMs) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  record.count += 1;

  // Nettoyage mémoire périodique toutes les 5000 entrées
  if (rateLimitMap.size > 5000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.windowStart > windowMs) rateLimitMap.delete(key);
    }
  }

  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    reset: record.windowStart + windowMs,
  };
}

/**
 * Middleware pour :
 *  1. Redirections SEO
 *  2. Protection Cloudflare (domaine canonique + cf-ray)
 *  3. Rate limiting des pages dynamiques (/ville/, /departement/)
 *  4. Protection des routes API (cf-ray obligatoire)
 */
export function middleware(request) {
  const host = request.headers.get('host');
  const cfRay = request.headers.get('cf-ray');
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();

  // -----------------------------------------------------------------------
  // 1. REDIRECTIONS SEO
  // -----------------------------------------------------------------------
  const redirects = {
    '/rgpd': '/mentions-legales',
    '/ville/waldighoffen': '/ville/waldighofen',
    '/ville/les-goulles': '/ville/goulles',
  };
  const target = redirects[pathname];
  if (target) {
    url.pathname = target;
    return NextResponse.redirect(url, 301);
  }

  if (pathname === '/departement' || pathname === '/departement/') {
    url.pathname = '/villes';
    return NextResponse.redirect(url, 301);
  }

  // -----------------------------------------------------------------------
  // 2. RATE LIMITING des pages dynamiques (edge)
  // -----------------------------------------------------------------------
  const { allowed, remaining, reset } = checkRateLimit(request);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests. Veuillez ralentir votre navigation.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // -----------------------------------------------------------------------
  // 3. PROTECTION PRODUCTION (domaine canonique + blocage IP direct)
  // -----------------------------------------------------------------------
  if (
    process.env.NODE_ENV === 'production' &&
    host &&
    !host.includes('localhost')
  ) {
    // --- 3a. Redirection vers le domaine canonique ---
    if (host !== 'www.eaupotable.net') {
      return NextResponse.redirect(
        `https://www.eaupotable.net${pathname}${search}`,
        301,
      );
    }

    // --- 3b. Vérification Cloudflare (cf-ray obligatoire) ---
    if (!cfRay) {
      return new NextResponse(
        'Access Denied: Direct IP access is prohibited.',
        { status: 403 },
      );
    }
  }

  // On ajoute l'en-tête de rate limiting restant si applicable
  const response = NextResponse.next();
  if (isDynamicPage(pathname) && remaining !== undefined) {
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
  }
  return response;
}

// Appliqué à toutes les routes sauf les fichiers statiques Next.js
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
