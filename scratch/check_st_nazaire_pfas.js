async function check() {
    const url = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Saint-Nazaire&code_departement=44&size=1000";
    const res = await fetch(url);
    const data = await res.json();
    const params = new Set();
    data.data.forEach(r => {
        if (r.libelle_parametre.toLowerCase().includes('perfluoro') || r.libelle_parametre.toLowerCase().includes('pfas')) {
            params.add(`${r.code_parametre}: ${r.libelle_parametre}`);
        }
    });
    console.log("=== PFAS PARAMS FOUND ===");
    console.log(Array.from(params));
}
check();
