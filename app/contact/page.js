import Navbar from '../components/Navbar';
import ContactForm from '../components/ContactForm';

export const metadata = {
  title: 'Contactez-nous | EauPotable.net',
  description: 'Une question sur la qualité de votre eau ou un partenariat ? Contactez l\'équipe d\'EauPotable.net.',
  robots: 'noindex, nofollow',
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="content-wrapper">
        <div className="page-header">
          <h1>Contactez-nous</h1>
          <p className="text-subtle">Une question sur la qualité de votre eau ou un partenariat ? Notre équipe vous répond dans les plus brefs délais.</p>
        </div>

        <div className="contact-grid centered">
          <div className="glass-card form-card">
            <ContactForm />
          </div>
        </div>
      </main>
    </>
  );
}
