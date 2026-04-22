async function check() {
    const url = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_departement=44&code_parametre=8215&size=10";
    const res = await fetch(url);
    const data = await res.json();
    console.log("Found 8215 in 44: " + data.count);
    if (data.data && data.data.length > 0) {
        console.log("Example city: " + data.data[0].nom_commune);
    }
}
check();
