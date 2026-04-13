import Navbar from '../../components/Navbar';
import WaterApp from '../../components/WaterApp';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  
  return {
    title: `Qualité de l'eau à ${cityName} | EauPotable.net`,
    description: `Découvrez si l'eau du robinet est potable à ${cityName}. Analyse complète : nitrates, calcaire, pesticides et pH. Données officielles ARS.`,
    openGraph: {
      title: `Qualité de l'eau à ${cityName}`,
      description: `L'eau de ${cityName} est-elle saine ? Consultez l'analyse en temps réel.`,
      images: ['/img/og-card.png'],
    },
  };
}

export default async function CityPage({ params }) {
  const { slug } = await params;
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  return (
    <>
      <Navbar />
      <WaterApp initialCity={cityName} />
    </>
  );
}

