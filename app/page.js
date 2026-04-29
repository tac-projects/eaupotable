import WaterApp from './components/WaterApp';
import Navbar from './components/Navbar';

export const metadata = {
  title: "Qualité de l'eau du robinet & PFAS : Analyse par Ville | EauPotable.net",
  description: "📊 Suivez la qualité de l'eau potable en France en temps réel. Données officielles 2026 connectées aux flux ARS : PFAS, pesticides et calcaire dans votre commune.",
  alternates: {
    canonical: "https://www.eaupotable.net",
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <WaterApp />
    </>
  );
}
