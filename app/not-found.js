import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '100px 20px',
      fontFamily: 'system-ui, sans-serif',
      background: '#F4F6F8',
      minHeight: '60vh',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#1a1a2e' }}>Page introuvable</h1>
      <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '32px' }}>
        Cette page n'existe pas ou a été déplacée.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{
          padding: '12px 24px',
          background: '#0055FF',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: '8px' }} aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>Accueil
        </Link>
        <Link href="/villes" style={{
          padding: '12px 24px',
          background: '#fff',
          color: '#0055FF',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          border: '2px solid #0055FF',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: '8px' }} aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>Toutes les villes
        </Link>
        <Link href="/definitions" style={{
          padding: '12px 24px',
          background: '#fff',
          color: '#0055FF',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          border: '2px solid #0055FF',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-3px', marginRight: '8px' }} aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Définitions
        </Link>
      </div>
    </div>
  );
}
