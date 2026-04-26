import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Ma Ville';
    const score = searchParams.get('score') || '9.2';
    const label = searchParams.get('label') || 'EXCELLENTE';
    const status = searchParams.get('status') || 'status-excellent';

    // Correspondance des couleurs status -> hex
    const colors = {
      'status-excellent': '#10b981',
      'status-good': '#059669',
      'status-warning': '#f59e0b',
      'status-critical': '#ef4444'
    };
    const circleColor = colors[status] || '#3b82f6';

    // 1. Protection Radicale du CPU : Détection des User-Agents
    const ua = request.headers.get('user-agent')?.toLowerCase() || '';
    
    // Whitelist des agents qui ont réellement besoin de l'image dynamique (Réseaux Sociaux)
    const isSocialShare = 
      ua.includes('facebookexternalhit') || 
      ua.includes('twitterbot') || 
      ua.includes('linkedinbot') || 
      ua.includes('whatsapp') || 
      ua.includes('slackbot') || 
      ua.includes('discordbot') ||
      ua.includes('telegrambot');

    // Si c'est un bot d'indexation ou un crawler (pas un partage social), on redirige vers le statique
    // Cela économise 100% du CPU de génération pour 99% des requêtes de bots.
    if (!isSocialShare && (ua.includes('bot') || ua.includes('crawl') || ua.includes('spider'))) {
      return Response.redirect(new URL('/images/og-default.png', request.url), 302);
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(to bottom right, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '40px',
            fontFamily: 'system-ui',
          }}
        >
          {/* Logo / Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
             <div style={{ display: 'flex', fontSize: '24px', fontWeight: 'bold', color: '#1e40af', letterSpacing: '-0.02em' }}>EauPotable.net</div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: '40px',
              padding: '60px 80px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 900,
                color: '#111827',
                margin: '0 0 10px 0',
                textAlign: 'center',
              }}
            >
              {city}
            </h1>
            <p style={{ fontSize: '24px', color: '#6b7280', margin: '0 0 40px 0', fontWeight: 600 }}>QUALITÉ DE L'EAU</p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                backgroundColor: circleColor,
                boxShadow: `0 10px 30px ${circleColor}33`,
              }}
            >
              <div style={{ display: 'flex', fontSize: '72px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{score}</div>
              <div style={{ display: 'flex', fontSize: '18px', fontWeight: 800, color: 'white', marginTop: '5px', opacity: 0.9 }}>/ 10</div>
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: '30px',
                padding: '8px 24px',
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              EAU {label}
            </div>

          </div>

          <p style={{ marginTop: '40px', fontSize: '20px', color: '#6b7280', textAlign: 'center' }}>
            Données officielles ARS analysées en temps réel.
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=600',
        },
      }
    );
  } catch (e) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
