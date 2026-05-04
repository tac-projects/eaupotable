import WaterApp from './components/WaterApp';
import Navbar from './components/Navbar';

export const metadata = {
  title: "Eau potable en France : Qualité, PFAS & Prix | EauPotable.net",
  description: "Votre eau du robinet est-elle saine ? 💧 Découvrez la qualité de l'eau, le calcaire et les PFAS pour 35 000 communes. Bilan santé complet et prix de l'eau.",
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
