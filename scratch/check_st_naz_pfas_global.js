async function check() {
    const url = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Saint-Nazaire&code_departement=44&libelle_parametre=PFAS&size=1";
    const res = await fetch(url);
    const data = await res.json();
    console.log("Found PFAS keyword in St Nazaire (all time): " + data.count);
}
check();
