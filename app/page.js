import WaterApp from './components/WaterApp';
import Navbar from './components/Navbar';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: "Eau potable en France : Qualité, PFAS & Prix | EauPotable.net",
  description: "Votre eau du robinet est-elle saine ? 💧 Découvrez la qualité de l'eau, le calcaire et les PFAS pour 35 000 communes. Bilan santé complet et prix de l'eau.",
  alternates: {
    canonical: "https://www.eaupotable.net",
  },
};

async function loadMetropolisData() {
  try {
    const metroPath = path.join(process.cwd(), 'public', 'data', 'metropolis.json');
    if (!fs.existsSync(metroPath)) return null;
    return JSON.parse(fs.readFileSync(metroPath, 'utf8'));
  } catch (e) {
    console.error('Error loading metropolis data:', e);
    return null;
  }
}

async function loadBebeNationData() {
  try {
    const bebePath = path.join(process.cwd(), 'public', 'data', 'bebe-nation.json');
    if (!fs.existsSync(bebePath)) return null;
    return JSON.parse(fs.readFileSync(bebePath, 'utf8'));
  } catch (e) {
    console.error('Error loading bebe-nation data:', e);
    return null;
  }
}

export default async function Home() {
  const metropolisData = await loadMetropolisData();
  const bebeNation = await loadBebeNationData();
  return (
    <>
      <Navbar />
      <WaterApp metropolisData={metropolisData} bebeNation={bebeNation} />
    </>
  );
}
