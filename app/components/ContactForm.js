'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    
    setStatus('SENDING');
    
    try {
      const response = await fetch('https://formspree.io/f/xeepwdvg', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setStatus('SUCCESS');
        form.reset();
      } else {
        setStatus('ERROR');
      }
    } catch (error) {
      console.error("Form error:", error);
      setStatus('ERROR');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="form-success-message">
        <div className="success-icon">✅</div>
        <h3>Message envoyé !</h3>
        <p>Merci de nous avoir contactés. Notre équipe vous répondra sous 24 à 48 heures.</p>
        <button onClick={() => setStatus('')} className="reset-btn">Envoyer un autre message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="full-name">Votre Nom</label>
        <input type="text" id="full-name" name="name" placeholder="Prénom Nom" required />
      </div>
      <div className="form-group">
        <label htmlFor="email-address">Email de réponse</label>
        <input type="email" id="email-address" name="email" placeholder="votre@email.com" required />
      </div>
      <div className="form-group">
        <label htmlFor="form-subject">Objet</label>
        <input type="text" id="form-subject" name="subject" placeholder="Qualité de l'eau à..." required />
      </div>
      <div className="form-group">
        <label htmlFor="form-message">Message</label>
        <textarea id="form-message" name="message" rows="5" placeholder="Décrivez votre demande..." required></textarea>
      </div>
      <button type="submit" className="submit-btn" disabled={status === 'SENDING'}>
        <span>{status === 'SENDING' ? 'Envoi en cours...' : 'Envoyer le message'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
      {status === 'ERROR' && <div className="form-error">Oups ! Une erreur est survenue lors de l'envoi.</div>}
    </form>
  );
}
