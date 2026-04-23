import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const indexPath = path.join(process.cwd(), 'public', 'city-index.json');
    const cityIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    const query = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // On filtre les clés qui commencent par la requête ou contiennent la requête
    // On limite à 10 résultats pour la performance
    const matches = Object.keys(cityIndex)
      .filter(key => key.includes(query) && isNaN(key)) // On ignore les codes INSEE numériques pour la recherche texte
      .slice(0, 10)
      .map(key => ({
        text: key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        slug: key,
        dpt: cityIndex[key]
      }));

    return NextResponse.json(matches);
  } catch (e) {
    return NextResponse.json([]);
  }
}
