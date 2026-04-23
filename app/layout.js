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
      <head>
      </head>
      <body className="full-height-body">
        {children}
        <Footer />
        <Script id="google-analytics-deferred" strategy="afterInteractive">
          {`
            window.addEventListener('load', function() {
              const deferGTM = () => {
                const script = document.createElement('script');
                script.src = "https://www.googletagmanager.com/gtag/js?id=G-L7BMHXS6DJ";
                script.async = true;
                document.head.appendChild(script);

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-L7BMHXS6DJ');
              };

              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => setTimeout(deferGTM, 1500));
              } else {
                setTimeout(deferGTM, 3000);
              }
            });
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
