import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let searchIndexCache = null;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    if (!searchIndexCache) {
      const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
      searchIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    const cityIndex = searchIndexCache;
    
    const query = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // On filtre et on score les résultats pour la pertinence
    const matches = Object.keys(cityIndex)
      .filter(key => key.includes(query) && isNaN(key))
      .map(key => {
        let score = 3; // Par défaut : contient
        if (key === query) score = 1; // Correspondance exacte
        else if (key.startsWith(query)) score = 2; // Commence par
        
        return {
          key,
          score,
          length: key.length
        };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score; // D'abord le meilleur score
        if (a.length !== b.length) return a.length - b.length; // Puis le nom le plus court
        return a.key.localeCompare(b.key); // Enfin alphabétique
      })
      .slice(0, 10)
      .map(match => ({
        text: match.key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        slug: match.key,
        dpt: cityIndex[match.key]
      }));

    return NextResponse.json(matches);
  } catch (e) {
    return NextResponse.json([]);
  }
}
