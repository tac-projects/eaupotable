import DepartementClient from './DepartementClient';

export async function generateMetadata({ params }) {
  const { code } = await params;
  let deptName = `Département ${code}`;
  
  try {
    const res = await fetch(`https://geo.api.gouv.fr/departements/${code}`);
    if (res.ok) {
      const data = await res.json();
      deptName = data.nom;
    }
  } catch (e) {}

  return {
    title: `Qualité de l'eau potable : ${deptName} (${code}) | Analyses & PFAS`,
    description: `🔎 État des lieux en temps réel de l'eau du robinet dans le département : ${deptName}. Accédez aux derniers rapports PFAS et scores de pureté pour toutes les communes du département (${code}).`,
    openGraph: {
      title: `Qualité de l'eau potable : ${deptName} (${code})`,
      description: `Découvrez la qualité de l'eau potable pour toutes les communes du département ${deptName}. Focus PFAS et analyses ARS 2026.`,
    }
  };
}

async function getCities(code) {
  try {
    const res = await fetch(`https://geo.api.gouv.fr/departements/${code}/communes`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sort((a, b) => (b.population || 0) - (a.population || 0));
  } catch (e) {
    return [];
  }
}

async function getDeptName(code) {
  try {
    const res = await fetch(`https://geo.api.gouv.fr/departements/${code}`);
    if (res.ok) {
      const data = await res.json();
      return data.nom;
    }
  } catch (e) {}
  return `Département ${code}`;
}

export default async function DepartementPage({ params }) {
  const { code } = await params;
  const cities = await getCities(code);
  const deptName = await getDeptName(code);

  return (
    <DepartementClient 
      code={code} 
      initialCities={cities} 
      initialDeptName={deptName} 
    />
  );
}
