import { NextResponse } from 'next/server';

/**
 * Middleware pour forcer l'utilisation du domaine canonique protégé par Cloudflare.
 * Cela empêche les bots de contourner la sécurité en utilisant l'adresse technique Vercel.
 */
export function middleware(request) {
  const host = request.headers.get('host');
  const { pathname, search } = request.nextUrl;

  // On n'applique la redirection qu'en production et si l'hôte n'est pas le bon
  // On ignore localhost pour le développement
  if (
    process.env.NODE_ENV === 'production' &&
    host && 
    host !== 'www.eaupotable.net' &&
    !host.includes('localhost')
  ) {
    return NextResponse.redirect(
      `https://www.eaupotable.net${pathname}${search}`,
      301
    );
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
