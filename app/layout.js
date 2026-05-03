import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/seo.css';
import { Inter, Manrope, Grand_Hotel } from 'next/font/google';
import Script from 'next/script';
import Footer from './components/Footer';

const inter = Inter({ subsets: ["latin"], weight: ["400", "700", "800"], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "700", "800"], variable: '--font-manrope', display: 'swap' });
const grandHotel = Grand_Hotel({ subsets: ["latin"], weight: ["400"], variable: '--font-grand-hotel', display: 'swap' });


export const metadata = {
  metadataBase: new URL('https://www.eaupotable.net'),
  title: `EauPotable.net | Qualité & Pureté de l'eau du robinet (${new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date()).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date()).slice(1)} ${new Date().getFullYear()})`,
  description: `💧 Analysez la qualité réelle et la pureté de votre eau potable en ${new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date()).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date()).slice(1)} ${new Date().getFullYear()}. ✅ Verdict ARS immédiat sur les pesticides, calcaire et PFAS dans 35 000 communes.`,
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
    <html lang="fr" className={`${inter.variable} ${manrope.variable} ${grandHotel.variable} full-height-body`}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://hubeau.eaufrance.fr" />
      </head>
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
        <Script id="register-sw" strategy="lazyOnload">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                // On retarde l'enregistrement du SW pour ne pas bloquer le thread principal
                setTimeout(() => {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    // Registration successful
                  }, function(err) {
                    // Registration failed
                  });
                }, 4000);
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
