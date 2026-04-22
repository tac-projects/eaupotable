async function check() {
    const url = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Saint-Nazaire&code_departement=44&libelle_parametre=PFAS&size=20";
    const res = await fetch(url);
    const data = await res.json();
    data.data.forEach(r => {
        console.log(`Date: ${r.date_prelevement} | Code: ${r.code_parametre} | Label: ${r.libelle_parametre} | Val: ${r.resultat_numerique}`);
    });
}
check();
