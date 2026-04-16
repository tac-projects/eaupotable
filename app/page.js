import WaterApp from './components/WaterApp';
import Navbar from './components/Navbar';

export const metadata = {
  title: "EauPotable.net | Qualité de l'eau potable en France (2026)",
  description: "Vérifiez la qualité de l'eau potable dans votre ville. Crystal Score de pureté, nitrates, calcaire et PFAS. Données officielles 2026.",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <WaterApp />
    </>
  );
}
