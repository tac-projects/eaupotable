import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Mentions Légales | EauPotable.net',
  description: 'Informations légales concernant l\'éditeur et l\'hébergeur du site EauPotable.net.',
  robots: 'noindex, nofollow',
};

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="content-wrapper">
        <div className="page-header">
          <h1>Mentions Légales</h1>
          <p className="text-subtle">Dernière mise à jour : 16 Avril 2026</p>
        </div>

        <div className="glass-card legal-content-card">
          <div className="legal-section">
            <h2>1. Édition du site</h2>
            <p>
              Le site internet <strong>EauPotable.net</strong> est une plateforme indépendante de visualisation de données de santé publique, éditée à titre non professionnel par un particulier.
            </p>
            <p>
              Conformément à l'article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004 (LCEN), l'éditeur a choisi de rester anonyme. 
              Ses coordonnées complètes ont été transmises à l'hébergeur désigné ci-après.
            </p>
          </div>

          <div className="legal-section">
            <h2>2. Hébergement</h2>
            <p>
              Le site est hébergé sur un serveur dédié en France (OVH/Contabo). L'infrastructure est gérée directement par l'éditeur du site.
            </p>
          </div>

          <div className="legal-section">
            <h2>3. Gestion des données personnelles (RGPD)</h2>
            <p>
              EauPotable.net accorde une importance capitale à la protection de votre vie privée. 
              Les seules données personnelles collectées sont :
            </p>
            <ul style={{marginLeft: '20px', marginBottom: '1rem', color: 'var(--text-muted)'}}>
              <li>Votre adresse email via le formulaire de contact ou d'inscription aux alertes.</li>
              <li>Vos données de navigation anonymisées via Google Analytics.</li>
            </ul>
            <p>
              Ces données ne sont jamais revendues à des tiers et sont uniquement utilisées pour vous répondre ou vous envoyer les alertes de qualité de l'eau demandées. 
              Conformément à la loi "Informatique et Libertés", vous pouvez exercer votre droit d'accès, de rectification et de suppression de vos données en nous contactant à hello@eaupotable.net.
            </p>
          </div>

          <div className="legal-section">
            <h2>4. Cookies</h2>
            <p>
              Le site <strong>EauPotable.net</strong> utilise des cookies pour analyser son audience via Google Analytics. 
              Cela nous permet d'améliorer l'expérience utilisateur et de comprendre quelles villes sont les plus recherchées. 
              Vous pouvez configurer votre navigateur pour refuser ces cookies lors de votre première visite.
            </p>
          </div>

          <div className="legal-section">
            <h2>5. Origine des données</h2>
            <p>
              Les données de qualité de l'eau diffusées sur ce site proviennent exclusivement de l'API <strong>Hub'Eau</strong> (Gouvernement Français), 
              alimentée par les résultats des prélèvements de l'Agence Régionale de Santé (ARS).
            </p>
            <p>
              Bien que nous fassions tout notre possible pour assurer la fraîcheur des données via nos algorithmes de "repêchage", 
              EauPotable.net ne saurait être tenu responsable des délais de mise à jour ou des erreurs présentes dans les bases de données officielles.
            </p>
          </div>

          <div className="legal-section">
            <h2>6. Propriété intellectuelle</h2>
            <p>
              La structure générale du site, ainsi que les textes, graphismes et l'algorithme "Crystal Score" sont la propriété exclusive d'EauPotable.net. 
              Toute reproduction totale ou partielle de ce site par quelque procédé que ce soit, sans l'autorisation expresse de l'exploitant, est prohibée.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
