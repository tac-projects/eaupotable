'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FAQClient({ faqData }) {
  const [search, setSearch] = useState('');

  const filteredFaq = faqData.map(group => ({
    ...group,
    questions: group.questions.filter(item => 
      item.q.toLowerCase().includes(search.toLowerCase()) || 
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.questions.length > 0);

  return (
    <main className="faq-page-wrapper">
      {/* 1. HERO SECTION FAQ */}
      <section className="faq-hero">
        <div className="seo-container">
          <h1 className="faq-main-title">Questions Fréquentes</h1>
          <p className="faq-main-subtitle">
            Retrouvez toutes les réponses à vos interrogations sur la qualité, la pureté et les contrôles de l'eau de votre robinet en France.
          </p>
          
          <div className="faq-search-wrapper">
            <div className="faq-search-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Chercher une réponse (ex: PFAS, biberon, chlore...)" 
                className="faq-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. FAQ CONTENT */}
      <section className="faq-content-section">
        <div className="seo-container narrow">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((group, idx) => (
              <div key={idx} className="faq-category-block">
                <h2 className="faq-category-title">{group.category}</h2>
                <div className="seo-faq-accordion">
                  {group.questions.map((item, i) => (
                    <details key={i} className="seo-faq-item">
                      <summary className="seo-faq-question">
                        <h3>{item.q}</h3>
                        <span className="faq-icon"></span>
                      </summary>
                      <div 
                        className="seo-faq-answer"
                        dangerouslySetInnerHTML={{ __html: item.a }}
                      />
                    </details>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="faq-no-results">
              <p>Aucune réponse trouvée pour "<strong>{search}</strong>".</p>
              <button onClick={() => setSearch('')} className="back-btn">Réinitialiser la recherche</button>
            </div>
          )}
        </div>
      </section>

      {/* 3. CTA FINAL */}
      <section className="faq-footer-cta">
        <div className="seo-container">
          <div className="faq-cta-card">
            <h3>Besoin d'une analyse personnalisée ?</h3>
            <p>Vérifiez gratuitement la composition précise de l'eau de votre commune aujourd'hui.</p>
            <Link href="/" className="cta-btn-premium">Lancer la recherche</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
