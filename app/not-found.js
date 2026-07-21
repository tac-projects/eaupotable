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
          🏠 Accueil
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
          📍 Toutes les villes
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
          📖 Définitions
        </Link>
      </div>
    </div>
  );
}
