async function check() {
    const url = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Saint-Nazaire&code_departement=44&size=1";
    const res = await fetch(url);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
        console.log("Last conclusion: " + data.data[0].conclusion_conformite_prelevement);
        console.log("Network: " + data.data[0].nom_reseau);
    }
}
check();
