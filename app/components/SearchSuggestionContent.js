'use client';

// Rendu partagé d'une suggestion de recherche, utilisé par les barres de
// recherche (navbar, mobile, home, page bébé). Gère les trois formes de
// résultat renvoyées par /api/search :
//   - kind: 'city'  -> commune (nom du département entre parenthèses)
//   - kind: 'dept'  -> repli « voir le département »
//   - kind: 'none'  -> message (non cliquable)
// `contextClassName` porte le style du texte secondaire propre à chaque barre.
export default function SearchSuggestionContent({ item, contextClassName }) {
  if (item.kind === 'dept' || item.kind === 'none') {
    return <span className="suggestion-fallback">{item.text}</span>;
  }

  return (
    <>
      <strong>{item.text}</strong>{' '}
      <span className={contextClassName}>({item.deptName || item.dpt})</span>
    </>
  );
}
