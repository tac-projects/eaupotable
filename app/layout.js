import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/seo.css';
import { Inter, Manrope } from 'next/font/google';
import Script from 'next/script';
import Footer from './components/Footer';

const inter = Inter({ subsets: ["latin"], weight: ["400", "700", "800"], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "700", "800"], variable: '--font-manrope', display: 'swap' });


export const metadata = {
  metadataBase: new URL('https://www.eaupotable.net'),
  title: 'EauPotable.net | Qualité & Pureté de l\'eau du robinet (2026)',
  description: 'Analysez la qualité réelle et la pureté de votre eau potable en 2026. Verdict ARS immédiat sur les pesticides, calcaire et PFAS dans plus de 35 000 communes.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/img/favicon.svg', type: 'image/svg+xml' },
      { url: '/img/icons/google-search-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/img/icons/google-search-icon.png',
    shortcut: '/img/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EauPotable',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EauPotable.net',
    description: 'La vérité sur l\'eau de votre robinet.',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.eaupotable.net',
    siteName: 'EauPotable.net',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.eaupotable.net',
  },
};

export const viewport = {
  themeColor: '#0055FF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${manrope.variable} full-height-body`}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Chargement ultra-optimisé (Glyphs uniquement) pour l'identité visuelle sans impact LCP */}
        <link 
          rel="preload" 
          as="style"
          href="https://fonts.googleapis.com/css2?family=Grand+Hotel&text=EauPotable.net&display=swap" 
        />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Grand+Hotel&text=EauPotable.net&display=swap" 
        />
      <body className="full-height-body">
        {children}
        <Footer />
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-L7BMHXS6DJ"
          strategy="lazyOnload"
        />
        <Script id="google-analytics-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L7BMHXS6DJ');
          `}
        </Script>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
