import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/seo.css';
import Script from 'next/script';
import Footer from './components/Footer';

export const metadata = {
  metadataBase: new URL('https://www.eaupotable.net'),
  title: 'EauPotable.net | Qualité & Pureté de l\'eau du robinet (2026)',
  description: 'Analysez la qualité réelle et la pureté de votre eau potable en 2026. Verdict ARS immédiat sur les pesticides, calcaire et PFAS dans plus de 35 000 communes.',
  manifest: '/manifest.json',
  themeColor: '#0066FF',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
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
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="full-height-body">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Grand+Hotel&display=swap" rel="stylesheet" />
      </head>
      <body className="full-height-body">
        {children}
        <Footer />
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-L7BMHXS6DJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
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
