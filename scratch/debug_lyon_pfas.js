
async function debugLyonData() {
    const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?nom_commune=Lyon&size=5000`;
    const res = await fetch(url);
    const data = await res.json();
    
    console.log("Searching for keywords 'pfas', 'perfluo', 'perfluoro'...");
    const matches = data.data.filter(r => 
        r.libelle_parametre.toLowerCase().includes('pfas') || 
        r.libelle_parametre.toLowerCase().includes('perfluo') ||
        [7149, 7148, 8194].includes(parseInt(r.code_parametre))
    );
    
    if (matches.length === 0) {
        console.log("No specific PFAS strings found. Checking pesticides for PFAS-like names...");
        // Some PFAS are under long names
    } else {
        matches.forEach(r => {
            console.log(`Match: ${r.libelle_parametre} | Value: ${r.resultat_numerique || r.resultat_alphanumerique} | Code: ${r.code_parametre}`);
        });
    }
}
debugLyonData();
