import { NextResponse } from 'next/server';

/**
 * Middleware pour forcer l'utilisation du domaine canonique protégé par Cloudflare.
 * Cela empêche les bots de contourner la sécurité en utilisant l'adresse technique Vercel ou l'IP directe.
 */
export function middleware(request) {
  const host = request.headers.get('host');
  const cfRay = request.headers.get('cf-ray');
  const { pathname, search } = request.nextUrl;

  // On n'applique la redirection et le blocage qu'en production
  if (
    process.env.NODE_ENV === 'production' &&
    host && 
    !host.includes('localhost')
  ) {
    // 1. Redirection vers le domaine canonique (si on arrive via l'adresse Vercel)
    if (host !== 'www.eaupotable.net') {
      return NextResponse.redirect(
        `https://www.eaupotable.net${pathname}${search}`,
        301
      );
    }

    // 2. Blocage des accès directs par IP (sans passer par Cloudflare)
    // Cloudflare ajoute toujours l'en-tête 'cf-ray'. S'il est absent, c'est un accès direct.
    if (!cfRay) {
      return new NextResponse(
        'Access Denied: Direct IP access is prohibited.',
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

// On applique le middleware à toutes les pages sauf les fichiers statiques et l'API
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
