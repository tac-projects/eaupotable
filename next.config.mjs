/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    nextScriptWorkers: true
  },
  async headers() {
    return [
      // -------------------------------------------------------------------
      // Headers de sécurité HTTP globaux
      // -------------------------------------------------------------------
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=self',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self' https://hubeau.eaufrance.fr https://formspree.io https://www.google-analytics.com https://region1.google-analytics.com",
              "frame-src 'self' https://challenges.cloudflare.com",
            ].join('; '),
          },
        ],
      },
      // -------------------------------------------------------------------
      // Évite que Google gaspille du crawl budget sur les assets statiques Next.js
      // (ceci est un complément au robots.txt Disallow, qui ne suffit pas à stopper le crawl)
      // -------------------------------------------------------------------
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        // Supprime le parametre ?dpl= (injecte par Cloudflare) pour eviter
        // la multiplication d'URLs dans Google Search Console
        source: '/:path((?!_next/static).*)',
        has: [{ type: 'query', key: 'dpl' }],
        permanent: false,
        destination: '/:path',
      },
    ];
  },
};

export default nextConfig;
