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
      {
        // Évite que Google gaspille du crawl budget sur les assets statiques Next.js
        // (ceci est un complément au robots.txt Disallow, qui ne suffit pas à stopper le crawl)
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
