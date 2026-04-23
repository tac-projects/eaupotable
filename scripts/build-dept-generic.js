const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * SISE-EAUX UNIVERSAL ARCHIVIST
 * Generates departmental JSON data from national CSV archives.
 */

// 1. DEPARTMENT REFERENCE DATA
const DEPT_REF = {
    "01": { name: "Ain", topCities: ["Bourg-en-Bresse", "Oyonnax", "Ambérieu-en-Bugey", "Valserhône", "Gex"] },
    "02": { name: "Aisne", topCities: ["Saint-Quentin", "Soissons", "Laon", "Château-Thierry", "Tergnier"] },
    "03": { name: "Allier", topCities: ["Montluçon", "Vichy", "Moulins", "Cusset", "Yzeure"] },
    "04": { name: "Alpes-de-Haute-Provence", topCities: ["Manosque", "Digne-les-Bains", "Sisteron", "Oraison", "Forcalquier"] },
    "05": { name: "Hautes-Alpes", topCities: ["Gap", "Briançon", "Embrun", "Laragne-Montéglin", "Veynes"] },
    "06": { name: "Alpes-Maritimes", topCities: ["Nice", "Antibes", "Cannes", "Cagnes-sur-Mer", "Grasse"] },
    "07": { name: "Ardèche", topCities: ["Annonay", "Aubenas", "Guilherand-Granges", "Tournon-sur-Rhône", "Privas"] },
    "08": { name: "Ardennes", topCities: ["Charleville-Mézières", "Sedan", "Rethel", "Givet", "Revin"] },
    "09": { name: "Ariège", topCities: ["Pamiers", "Foix", "Lavelanet", "Saint-Girons", "Saverdun"] },
    "10": { name: "Aube", topCities: ["Troyes", "Romilly-sur-Seine", "La Chapelle-Saint-Luc", "Saint-André-les-Vergers", "Sainte-Savine"] },
    "11": { name: "Aude", topCities: ["Narbonne", "Carcassonne", "Castelnaudary", "Lézignan-Corbières", "Limoux"] },
    "12": { name: "Aveyron", topCities: ["Rodez", "Millau", "Villefranche-de-Rouergue", "Onet-le-Château", "Saint-Affrique"] },
    "13": { name: "Bouches-du-Rhône", topCities: ["Marseille", "Aix-en-Provence", "Arles", "Martigues", "Aubagne", "Salon-de-Provence", "Istres", "La Ciotat", "Vitrolles", "Marignane"] },
    "14": { name: "Calvados", topCities: ["Caen", "Hérouville-Saint-Clair", "Lisieux", "Vire Normandie", "Bayeux"] },
    "15": { name: "Cantal", topCities: ["Aurillac", "Saint-Flour", "Arpajon-sur-Cère", "Mauriac", "Maurs"] },
    "16": { name: "Charente", topCities: ["Angoulême", "Cognac", "Soyaux", "La Couronne", "Ruelle-sur-Touvre"] },
    "17": { name: "Charente-Maritime", topCities: ["La Rochelle", "Saintes", "Rochefort", "Royan", "Aytré"] },
    "18": { name: "Cher", topCities: ["Bourges", "Vierzon", "Saint-Doulchard", "Saint-Amand-Montrond", "Mehuna-sur-Yèvre"] },
    "19": { name: "Corrèze", topCities: ["Brive-la-Gaillarde", "Tulle", "Ussel", "Malemort", "Saint-Pantaléon-de-Larche"] },
    "2A": { name: "Corse-du-Sud", topCities: ["Ajaccio", "Porto-Vecchio", "Propriano", "Bastelicaccia", "Sartène"] },
    "2B": { name: "Haute-Corse", topCities: ["Bastia", "Borgo", "Biguglia", "Corte", "Furiani"] },
    "21": { name: "Côte-d'Or", topCities: ["Dijon", "Beaune", "Chenôve", "Talant", "Chevigny-Saint-Sauveur"] },
    "22": { name: "Côtes-d'Armor", topCities: ["Saint-Brieuc", "Lannion", "Lamballe-Armor", "Plérin", "Ploufragan"] },
    "23": { name: "Creuse", topCities: ["Guéret", "La Souterraine", "Aubusson", "Bourganeuf", "Sainte-Feyre"] },
    "24": { name: "Dordogne", topCities: ["Périgueux", "Bergerac", "Boulazac Isle Manoire", "Sarlat-la-Canéda", "Trélissac"] },
    "25": { name: "Doubs", topCities: ["Besançon", "Montbéliard", "Pontarlier", "Audincourt", "Valentigney"] },
    "26": { name: "Drôme", topCities: ["Valence", "Montélimar", "Romans-sur-Isère", "Bourg-lès-Valence", "Pierrelatte"] },
    "27": { name: "Eure", topCities: ["Évreux", "Vernon", "Louviers", "Val-de-Reuil", "Gisors"] },
    "28": { name: "Eure-et-Loir", topCities: ["Chartres", "Dreux", "Lucé", "Châteaudun", "Vernouillet"] },
    "29": { name: "Finistère", topCities: ["Brest", "Quimper", "Concarneau", "Morlaix", "Landerneau"] },
    "30": { name: "Gard", topCities: ["Nîmes", "Alès", "Bagnols-sur-Cèze", "Beaucaire", "Saint-Gilles"] },
    "31": { name: "Haute-Garonne", topCities: ["Toulouse", "Colomiers", "Tournefeuille", "Blagnac", "Muret", "Plaisance-du-Touch", "Cugnaux", "Balma", "Castanet-Tolosan", "L'Union"] },
    "32": { name: "Gers", topCities: ["Auch", "L'Isle-Jourdain", "Condom", "Fleurance", "Lectoure"] },
    "33": { name: "Gironde", topCities: ["Bordeaux", "Mérignac", "Pessac", "Talence", "Villenave-d'Ornon", "Saint-Médard-en-Jalles", "Bègles", "La Teste-de-Buch", "Gradignan", "Libourne"] },
    "34": { name: "Hérault", topCities: ["Montpellier", "Béziers", "Sète", "Agde", "Lunel"] },
    "35": { name: "Ille-et-Vilaine", topCities: ["Rennes", "Saint-Malo", "Fougères", "Vitré", "Bruz"] },
    "36": { name: "Indre", topCities: ["Châteauroux", "Issoudun", "Déols", "Le Blanc", "Le Poinçonnet"] },
    "37": { name: "Indre-et-Loire", topCities: ["Tours", "Joué-lès-Tours", "Saint-Cyr-sur-Loire", "Saint-Pierre-des-Corps", "Saint-Avertin"] },
    "38": { name: "Isère", topCities: ["Grenoble", "Saint-Martin-d'Hères", "Échirolles", "Vienne", "Bourgoin-Jallieu"] },
    "39": { name: "Jura", topCities: ["Dole", "Lons-le-Saunier", "Saint-Claude", "Champagnole", "Hauts de Bienne"] },
    "40": { name: "Landes", topCities: ["Mont-de-Marsan", "Dax", "Biscarrosse", "Saint-Paul-lès-Dax", "Tarnos"] },
    "41": { name: "Loir-et-Cher", topCities: ["Blois", "Romorantin-Lanthenay", "Vendôme", "Vineuil", "Mer"] },
    "42": { name: "Loire", topCities: ["Saint-Étienne", "Roanne", "Saint-Chamond", "Firminy", "Montbrison"] },
    "43": { name: "Haute-Loire", topCities: ["Le Puy-en-Velay", "Monistrol-sur-Loire", "Yssingeaux", "Brioude", "Sainte-Sigolène"] },
    "44": { name: "Loire-Atlantique", topCities: ["Nantes", "Saint-Nazaire", "Saint-Herblain", "Rezé", "Saint-Sébastien-sur-Loire", "Orvault", "Vertou", "Couëron", "Carquefou", "Bouguenais"] },
    "45": { name: "Loiret", topCities: ["Orléans", "Fleury-les-Aubrais", "Olivet", "Saint-Jean-de-Braye", "Saint-Jean-de-la-Ruelle"] },
    "46": { name: "Lot", topCities: ["Cahors", "Figeac", "Gourdon", "Souillac", "Gramat"] },
    "47": { name: "Lot-et-Garonne", topCities: ["Agen", "Villeneuve-sur-Lot", "Marmande", "Le Passage", "Tonneins"] },
    "48": { name: "Lozère", topCities: ["Mende", "Marvejols", "Saint-Chély-d'Apcher", "Langogne", "Florac Trois Rivières"] },
    "49": { name: "Maine-et-Loire", topCities: ["Angers", "Cholet", "Saumur", "Sèvremoine", "Beaupréau-en-Mauges", "Chemillé-en-Anjou", "Mauges-sur-Loire", "Segré-en-Anjou Bleu"] },
    "50": { name: "Manche", topCities: ["Cherbourg-en-Cotentin", "Saint-Lô", "Granville", "La Hague", "Avranches"] },
    "51": { name: "Marne", topCities: ["Reims", "Châlons-en-Champagne", "Épernay", "Vitry-le-François", "Tinqueux"] },
    "52": { name: "Haute-Marne", topCities: ["Saint-Dizier", "Chaumont", "Langres", "Nogent", "Joinville"] },
    "53": { name: "Mayenne", topCities: ["Laval", "Mayenne", "Château-Gontier-sur-Mayenne", "Évron", "Saint-Berthevin"] },
    "54": { name: "Meurthe-et-Moselle", topCities: ["Nancy", "Vandœuvre-lès-Nancy", "Lunéville", "Toul", "Longwy"] },
    "55": { name: "Meuse", topCities: ["Verdun", "Bar-le-Duc", "Commercy", "Saint-Mihiel", "Ligny-en-Barrois"] },
    "56": { name: "Morbihan", topCities: ["Vannes", "Lorient", "Lanester", "Ploemeur", "Hennebont"] },
    "57": { name: "Moselle", topCities: ["Metz", "Thionville", "Montigny-lès-Metz", "Forbach", "Sarreguemines"] },
    "58": { name: "Nièvre", topCities: ["Nevers", "Cosne-Cours-sur-Loire", "Varennes-Vauzelles", "Decize", "La Charité-sur-Loire"] },
    "59": { name: "Nord", topCities: ["Lille", "Roubaix", "Tourcoing", "Dunkerque", "Villeneuve-d'Ascq", "Valenciennes", "Wattrelos", "Douai", "Marcq-en-Barœul", "Cambrai"] },
    "60": { name: "Oise", topCities: ["Beauvais", "Compiègne", "Creil", "Nogent-sur-Oise", "Senlis"] },
    "61": { name: "Orne", topCities: ["Alençon", "Flers", "Argentan", "L'Aigle", "La Ferté Macé"] },
    "62": { name: "Pas-de-Calais", topCities: ["Calais", "Arras", "Boulogne-sur-Mer", "Lens", "Liévin"] },
    "63": { name: "Puy-de-Dôme", topCities: ["Clermont-Ferrand", "Cournon-d'Auvergne", "Riom", "Chamalières", "Issoire"] },
    "64": { name: "Pyrénées-Atlantiques", topCities: ["Pau", "Bayonne", "Anglet", "Biarritz", "Hendaye"] },
    "65": { name: "Hautes-Pyrénées", topCities: ["Tarbes", "Lourdes", "Aureilhan", "Bagnères-de-Bigorre", "Vic-en-Bigorre"] },
    "66": { name: "Pyrénées-Orientales", topCities: ["Perpignan", "Canet-en-Roussillon", "Saint-Estève", "Saint-Cyprien", "Argelès-sur-Mer"] },
    "67": { name: "Bas-Rhin", topCities: ["Strasbourg", "Haguenau", "Schiltigheim", "Illkirch-Graffenstaden", "Sélestat"] },
    "68": { name: "Haut-Rhin", topCities: ["Mulhouse", "Colmar", "Saint-Louis", "Illzach", "Wittenheim"] },
    "69": { name: "Rhône", topCities: ["Lyon", "Villeurbanne", "Vénissieux", "Vaulx-en-Velin", "Saint-Priest", "Caluire-et-Cuire", "Bron", "Meyzieu", "Rillieux-la-Pape", "Décines-Charpieu"] },
    "70": { name: "Haute-Saône", topCities: ["Vesoul", "Héricourt", "Lure", "Luxeuil-les-Bains", "Gray"] },
    "71": { name: "Saône-et-Loire", topCities: ["Chalon-sur-Saône", "Mâcon", "Le Creusot", "Montceau-les-Mines", "Autun"] },
    "72": { name: "Sarthe", topCities: ["Le Mans", "La Flèche", "Sablé-sur-Sarthe", "Allonnes", "Coulaines"] },
    "73": { name: "Savoie", topCities: ["Chambéry", "Aix-les-Bains", "Albertville", "La Motte-Servolex", "La Ravoire"] },
    "74": { name: "Haute-Savoie", topCities: ["Annecy", "Annemasse", "Thonon-les-Bains", "Cluses", "Sallanches"] },
    "75": { name: "Paris", topCities: ["Paris"] },
    "76": { name: "Seine-Maritime", topCities: ["Rouen", "Le Havre", "Dieppe", "Sotteville-lès-Rouen", "Saint-Étienne-du-Rouvray"] },
    "77": { name: "Seine-et-Marne", topCities: ["Meaux", "Chelles", "Melun", "Pontault-Combault", "Savigny-le-Temple"] },
    "78": { name: "Yvelines", topCities: ["Versailles", "Sartrouville", "Saint-Germain-en-Laye", "Mantes-la-Jolie", "Poissy"] },
    "79": { name: "Deux-Sèvres", topCities: ["Niort", "Bressuire", "Thouars", "Mauléon", "Parthenay"] },
    "80": { name: "Somme", topCities: ["Amiens", "Abbeville", "Albert", "Péronne", "Corbie"] },
    "81": { name: "Tarn", topCities: ["Albi", "Castres", "Gaillac", "Graulhet", "Lavaur"] },
    "82": { name: "Tarn-et-Garonne", topCities: ["Montauban", "Castelsarrasin", "Moissac", "Caussade", "Montech"] },
    "83": { name: "Var", topCities: ["Toulon", "La Seyne-sur-Mer", "Hyères", "Fréjus", "Draguignan"] },
    "84": { name: "Vaucluse", topCities: ["Avignon", "Orange", "Carpentras", "Cavaillon", "Pertuis"] },
    "85": { name: "Vendée", topCities: ["La Roche-sur-Yon", "Les Sables-d'Olonne", "Challans", "Montaigu-Vendée", "Les Herbiers"] },
    "86": { name: "Vienne", topCities: ["Poitiers", "Châtellerault", "Buxerolles", "Jaunay-Marigny", "Chauvigny"] },
    "87": { name: "Haute-Vienne", topCities: ["Limoges", "Saint-Junien", "Panazol", "Couzeix", "Isle"] },
    "88": { name: "Vosges", topCities: ["Épinal", "Saint-Dié-des-Vosges", "Gérardmer", "Golbey", "Thaon-les-Vosges"] },
    "89": { name: "Yonne", topCities: ["Auxerre", "Sens", "Joigny", "Migennes", "Avallon"] },
    "90": { name: "Territoire de Belfort", topCities: ["Belfort", "Delle", "Valdoie", "Beaucourt", "Bavilliers"] },
    "91": { name: "Essonne", topCities: ["Évry-Courcouronnes", "Corbeil-Essonnes", "Massy", "Savigny-sur-Orge", "Sainte-Geneviève-des-Bois"] },
    "92": { name: "Hauts-de-Seine", topCities: ["Boulogne-Billancourt", "Nanterre", "Asnières-sur-Seine", "Colombes", "Courbevoie"] },
    "93": { name: "Seine-Saint-Denis", topCities: ["Saint-Denis", "Montreuil", "Aubervilliers", "Aulnay-sous-Bois", "Drancy"] },
    "94": { name: "Val-de-Marne", topCities: ["Vitry-sur-Seine", "Créteil", "Champigny-sur-Marne", "Saint-Maur-des-Fossés", "Ivry-sur-Seine"] },
    "95": { name: "Val-d'Oise", topCities: ["Argenteuil", "Cergy", "Sarcelles", "Garges-lès-Gonesse", "Franconville"] },
    "971": { name: "Guadeloupe", topCities: ["Les Abymes", "Baie-Mahault", "Le Gosier", "Sainte-Anne", "Petit-Bourg"] },
    "972": { name: "Martinique", topCities: ["Fort-de-France", "Le Lamentin", "Le Robert", "Schœlcher", "Ducos"] },
    "973": { name: "Guyane", topCities: ["Cayenne", "Saint-Laurent-du-Maroni", "Matoury", "Kourou", "Remire-Montjoly"] },
    "974": { name: "La Réunion", topCities: ["Saint-Denis", "Saint-Paul", "Saint-Pierre", "Le Tampon", "Saint-André"] },
    "976": { name: "Mayotte", topCities: ["Mamoudzou", "Koungou", "Dzaoudzi", "Dembeni", "Tsingoni"] }
};

// 1bis. REGIONAL MAPPING
const REGION_MAP = {
    "Auvergne-Rhône-Alpes": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
    "Bourgogne-Franche-Comté": ["21", "25", "39", "58", "70", "71", "89", "90"],
    "Bretagne": ["22", "29", "35", "56"],
    "Centre-Val de Loire": ["18", "28", "36", "37", "41", "45"],
    "Corse": ["2A", "2B"],
    "Grand Est": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
    "Hauts-de-France": ["02", "59", "60", "62", "80"],
    "Île-de-France": ["75", "77", "78", "91", "92", "93", "94", "95"],
    "Normandie": ["14", "27", "50", "61", "76"],
    "Nouvelle-Aquitaine": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
    "Occitanie": ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
    "Pays de la Loire": ["44", "49", "53", "72", "85"],
    "Provence-Alpes-Côte d'Azur": ["04", "05", "06", "13", "83", "84"],
    "Guadeloupe": ["971"], "Martinique": ["972"], "Guyane": ["973"], "La Réunion": ["974"], "Mayotte": ["976"]
};

// Helper to find region from dept code
const getRegionForDept = (code) => Object.keys(REGION_MAP).find(r => REGION_MAP[r].includes(code)) || "France";


// 2. CONFIGURATION & SANITARY PARAMETERS (National Codes)
const config = {
    nitrates: { codes: ["1340", "1342"] },
    ph: { codes: ["1302"] },
    temperature: { codes: ["1301"] },
    hardness: { codes: ["1345"] },
    chlorine: { codes: ["1398", "1399"] },
    pesticides: { codes: ["1107", "1667", "7150"] },
    pfas: { codes: ["7149", "8847"] },
    microbiology: { codes: ["1321", "1322", "1449", "1447", "1042"] },
    conductivity: { codes: ["1303"] },
    turbidity: { codes: ["1305", "1706"] },
    iron: { codes: ["1393", "1391"] },
    manganese: { codes: ["1394"] },
    ammonium: { codes: ["1331", "1335"] },
    copper: { codes: ["1392"] },
    organic_carbon: { codes: ["1841"] }
};

const YEARS = ["2026", "2025", "2024", "2023", "2022"];
const ARCHIVE_DIR = path.join(__dirname, '..', 'data', 'archives');

// 3. UTILITIES
const makeSlug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '');

function splitCsv(line) {
    const result = [];
    let current = ''; let inQuotes = false;
    for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += char;
    }
    result.push(current.trim());
    return result;
}

function parseValue(val) {
    if (!val) return NaN;
    const s = val.toString().toLowerCase();
    if (s.includes('<') || s.includes('absence')) return 0;
    const clean = s.replace(/[^0-9,.]/g, '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? NaN : parsed;
}

function calculateCrystalScore(s, isConform, cityName) {
    let score = 10.0;
    if (!isConform) return { final: 3.5, label: "NON CONFORME", statusClass: "status-critical", explanation: "L'eau ne respecte pas les limites de qualité ARS." };
    
    const nv = (k) => s[k] ? parseValue(s[k].val) : NaN;
    
    const microRaw = s.microbiology ? s.microbiology.val.toLowerCase() : "";
    const isMicroAbsence = microRaw.includes("absence") || microRaw.includes("<") || microRaw === "0" || microRaw === "--";
    if (microRaw && !isMicroAbsence) {
        score -= 5.0;
    }

    // 2. Polluants (PFAS / Pesticides)
    const pfas = nv('pfas');
    if (!isNaN(pfas) && pfas > 0) score -= (pfas > 0.1 ? 4 : 1.5);
    
    const pest = nv('pesticides');
    if (!isNaN(pest) && pest > 0) score -= (pest > 0.1 ? 4 : 1.5);

    // 3. Nitrates (Pureté)
    const nit = nv('nitrates');
    if (!isNaN(nit)) {
        if (nit > 15) score -= 1.0;
        if (nit > 25) score -= 1.0;
        if (nit > 40) score -= 2.0;
    }

    // 4. Chlore (Additifs chimiques)
    const chlo = nv('chlorine');
    if (!isNaN(chlo)) {
        if (chlo > 0.1) score -= 0.5;
        if (chlo > 0.4) score -= 0.5;
    }

    // 5. Calcaire
    const dur = nv('hardness');
    if (!isNaN(dur) && dur > 25) score -= 0.5;

    score = Math.max(1, Math.min(10, score));
    score = Math.round(score * 10) / 10;
    
    return { 
        final: score, 
        label: score >= 9.0 ? "EXCELLENTE" : (score >= 7.5 ? "SATISFAISANTE" : "MÉDIOCRE"), 
        explanation: "Indice de Pureté EauPotable.net basé sur 12 paramètres sanitaires.", 
        statusClass: score >= 9.0 ? "status-excellent" : (score >= 7.5 ? "status-good" : "status-warning") 
    };
}

// 4. MAIN PROCESSOR
async function buildDepartment(deptCode) {
    const deptInfo = DEPT_REF[deptCode];
    if (!deptInfo) {
        console.error(`❌ Département inconnu : ${deptCode}`);
        return;
    }

    const fileDept = deptCode.padStart(3, '0'); // 44 -> 044, 2A -> 02A, 971 -> 971
    console.log(`🏺 Génération des données pour : ${deptInfo.name} (${deptCode}) [Fichier prefix: ${fileDept}]`);

    const udiMap = {}; const udiHistory = {}; const resultsByRef = {}; 
    const parentTree = {};

    // 1. UDI_COM : Mapping INSEE -> Réseaux
    for (const year of YEARS) {
        const udiFile = path.join(ARCHIVE_DIR, year, `DIS_COM_UDI_${year}.txt`);
        if (fs.existsSync(udiFile)) {
            const rlUdi = readline.createInterface({ input: fs.createReadStream(udiFile) });
            for await (const line of rlUdi) {
                const p = splitCsv(line);
                if (!p[0] || p[0] === 'inseecommune') continue;
                // Filtre par code département
                if (!p[0].startsWith(deptCode)) continue;
                
                const key = p[1].toUpperCase().trim(), cd = p[3];
                if (!udiMap[key]) udiMap[key] = [];
                if (!udiMap[key].includes(cd)) udiMap[key].push(cd);
            }
        }
    }

    if (Object.keys(udiMap).length === 0) {
        console.warn(`⚠️ Aucune correspondance ville/réseau trouvée pour le département ${deptCode}.`);
    }

    // 2. PLV : Historique et hiérarchie
    for (const year of YEARS) {
        const f = path.join(ARCHIVE_DIR, year, `DIS_PLV_${year}_${fileDept}.txt`);
        if (!fs.existsSync(f)) continue;
        const rl = readline.createInterface({ input: fs.createReadStream(f) });
        for await (const line of rl) {
            const p = splitCsv(line); if (p[1] === 'cdreseau' || !p[1]) continue;
            const cd = p[1], amont = p[4], ref = p[7], date = p[8], conclusion = p[10], distri = p[12];
            
            if (amont && amont.trim() && amont !== cd) {
                parentTree[cd] = amont.trim();
            }

            if (!udiHistory[cd]) udiHistory[cd] = [];
            udiHistory[cd].push({ ref, date, conclusion, distributeur: distri });
        }
    }
    Object.keys(udiHistory).forEach(cd => udiHistory[cd].sort((a,b) => new Date(b.date) - new Date(a.date)));

    // 3. RESULT : Données brutes
    // 3. RESULT : Données brutes
    for (const year of YEARS) {
        const f = path.join(ARCHIVE_DIR, year, `DIS_RESULT_${year}_${fileDept}.txt`);
        if (!fs.existsSync(f)) continue;
        const rl = readline.createInterface({ input: fs.createReadStream(f) });
        for await (const line of rl) {
            const p = splitCsv(line);
            if (p[0] === 'cddept') continue;
            // referenceprel(1), cdparam(3), valtraduite(14), unit(10)
            const ref = p[1], paramId = p[3], valRaw = p[14], unit = p[10];
            if (!resultsByRef[ref]) resultsByRef[ref] = {};
            
            // Formatage de la valeur pour éviter les 0.000000
            let val = valRaw;
            const num = parseFloat(valRaw.replace(',', '.'));
            if (!isNaN(num)) {
                if (num === 0) val = "0";
                else val = num.toString().replace('.', ',');
            }
            resultsByRef[ref][paramId] = { val, unit };
        }
    }

    // 4. ASSEMBLAGE
    const output = {
        deptInfo: { code: deptCode, name: deptInfo.name, avgScore: 0, conformRate: 0, averages: {}, topCities: [] },
        cities: {}
    };

    for (const cityName of Object.keys(udiMap)) {
        const udis = udiMap[cityName];
        const stats = {}; Object.keys(config).forEach(k => stats[k] = { val: '--', unit: '', date: 'N/A' });
        let isConform = true, lastDate = "N/A", arsConclusion = "", nomDistributeur = "le gestionnaire local";

        const findParamInHierarchy = (udisList) => {
            let visited = new Set();
            let queue = [...udisList];
            
            while (queue.length > 0) {
                const currentUdi = queue.shift();
                if (visited.has(currentUdi)) continue;
                visited.add(currentUdi);

                const history = udiHistory[currentUdi] || [];
                for (const entry of history.slice(0, 1000)) {
                    const refRes = resultsByRef[entry.ref] || {};
                    for (const [key, pConf] of Object.entries(config)) {
                        if (stats[key].val !== '--') continue;
                        for (const code of pConf.codes) {
                            if (refRes[code]) {
                                let v = refRes[code].val;
                                if (key === 'microbiology' && (v === '0' || v.toLowerCase().includes('absence'))) v = "Absence";
                                let unit = (refRes[code].unit || "").replace('mg(Cl2)/L', 'mg/L').replace('unité pH', 'pH');
                                stats[key] = { val: v, unit: " " + unit, date: new Date(entry.date).toLocaleDateString('fr-FR') };
                                if (lastDate === "N/A") { 
                                    lastDate = entry.date; 
                                    arsConclusion = entry.conclusion;
                                    nomDistributeur = entry.distributeur || "le gestionnaire local";
                                    isConform = entry.conclusion.toLowerCase().includes("conforme") && !entry.conclusion.toLowerCase().includes("non conforme"); 
                                }
                                break;
                            }
                        }
                    }
                }
                if (parentTree[currentUdi]) queue.push(parentTree[currentUdi]);
                if (Object.values(stats).every(s => s.val !== '--')) break;
            }
        };

        findParamInHierarchy(udis);
        const crystal = calculateCrystalScore(stats, isConform, cityName);
        const slug = makeSlug(cityName);
        output.cities[slug] = {
            cityName: cityName.split('-').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join('-'),
            reseau: udis[0], isConform, crystal, stats,
            meta: { nom_distributeur: nomDistributeur, code_departement: deptCode, date_prelevement: lastDate, conclusion: arsConclusion }
        };
    }

    const all = Object.values(output.cities);
    if (all.length === 0) {
        console.warn(`⚠️ Aucune donnée trouvée pour le département ${deptCode}.`);
        return;
    }

    // CALCUL DES MOYENNES
    const avgData = {};
    Object.keys(config).forEach(indicator => {
        const values = all.map(c => parseValue(c.stats[indicator].val)).filter(v => !isNaN(v));
        if (values.length > 0) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            if (indicator === 'microbiology') avgData[indicator] = { val: "Absence", unit: "" };
            else {
                let formatted = mean.toFixed(2).replace('.', ',');
                if (mean > 10) formatted = Math.round(mean).toString();
                else if (mean < 0.1) formatted = mean <= 0.01 ? "< 0,01" : mean.toFixed(3).replace('.', ',');
                
                let unit = all.find(c => c.stats[indicator].unit)?.stats[indicator].unit || "";
                unit = unit.replace('mg(Cl2)/L', 'mg/L').replace('unité pH', 'pH');
                avgData[indicator] = { val: formatted, unit: " " + unit };
            }
        } else avgData[indicator] = { val: "--", unit: "" };
    });

    output.deptInfo.avgScore = Math.round((all.reduce((a,b) => a + b.crystal.final, 0) / all.length) * 10) / 10;
    output.deptInfo.conformRate = Math.round((all.filter(c => c.isConform).length / all.length) * 100);
    output.deptInfo.averages = avgData;
    output.deptInfo.regionName = getRegionForDept(deptCode);
    
    // Placeholder for regional data
    output.regionalInfo = {
        name: output.deptInfo.regionName,
        averages: {}
    };

    // Top Cities from reference
    output.deptInfo.topCities = deptInfo.topCities.map(name => {
        const slug = makeSlug(name);
        const city = output.cities[slug];
        return {
            name: city ? city.cityName : name,
            score: city ? city.crystal.final : 7.0,
            slug: slug
        };
    });

    return output;
}

// Function to write the file (moved out of buildDepartment)
function saveDepartmentFile(deptCode, data) {
    const outputPath = path.join(__dirname, '..', 'data', 'departments', `${deptCode}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Fichier généré : ${outputPath} (${Object.keys(data.cities).length} communes)`);
}


// 5. CLI HANDLER
const args = process.argv.slice(2);
const deptArg = args.find(a => a.startsWith('--dept='));
const allArg = args.includes('--all');

async function updateIndex() {
    const dir = path.join(__dirname, '..', 'data', 'departments');
    if (!fs.existsSync(dir)) return;
    const index = {};
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const f of files) {
        const dept = f.replace('.json', '');
        try {
            const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
            if (data.cities) {
                Object.keys(data.cities).forEach(slug => {
                    index[slug] = dept;
                });
            }
        } catch (e) {
            console.error(`❌ Erreur lecture index pour ${f}:`, e);
        }
    }
    const indexPath = path.join(__dirname, '..', 'public', 'city-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`🗺️  Index mis à jour : ${Object.keys(index).length} villes référencées.`);
}

function calculateRegionalAverages(allDeptData) {
    const regions = {};
    Object.values(allDeptData).forEach(dept => {
        const rName = dept.deptInfo.regionName;
        if (!regions[rName]) regions[rName] = { scores: [], conformities: [], params: {} };
        
        regions[rName].scores.push(dept.deptInfo.avgScore);
        regions[rName].conformities.push(dept.deptInfo.conformRate);
        
        Object.keys(dept.deptInfo.averages).forEach(pId => {
            if (!regions[rName].params[pId]) regions[rName].params[pId] = [];
            const val = parseValue(dept.deptInfo.averages[pId].val);
            if (!isNaN(val)) {
                regions[rName].params[pId].push({ val, unit: dept.deptInfo.averages[pId].unit });
            }
        });
    });

    const finalRegions = {};
    Object.keys(regions).forEach(rName => {
        const r = regions[rName];
        finalRegions[rName] = {
            score: Math.round((r.scores.reduce((a,b) => a+b, 0) / r.scores.length) * 10) / 10,
            conformity: Math.round(r.conformities.reduce((a,b) => a+b, 0) / r.conformities.length),
            averages: {}
        };
        
        Object.keys(r.params).forEach(pId => {
            const vals = r.params[pId].map(v => v.val);
            if (vals.length > 0) {
                const mean = vals.reduce((a,b) => a+b, 0) / vals.length;
                let formatted = mean.toFixed(2).replace('.', ',');
                if (mean > 10) formatted = Math.round(mean).toString();
                else if (mean < 0.1) formatted = mean <= 0.01 ? "< 0,01" : mean.toFixed(3).replace('.', ',');
                
                finalRegions[rName].averages[pId] = { 
                    val: formatted, 
                    unit: r.params[pId][0].unit 
                };
            }
        });
    });
    return finalRegions;
}

(async () => {
    const allResults = {};
    
    if (allArg) {
        // Passe 1 : Tout générer
        for (const code of Object.keys(DEPT_REF)) {
            allResults[code] = await buildDepartment(code);
        }
        
        // Passe 2 : Calculer les régions
        const regionalAverages = calculateRegionalAverages(allResults);
        
        // Passe 3 : Injecter et sauvegarder
        for (const code of Object.keys(allResults)) {
            const res = allResults[code];
            const rName = res.deptInfo.regionName;
            if (regionalAverages[rName]) {
                res.regionalInfo.averages = regionalAverages[rName].averages;
                res.regionalInfo.score = regionalAverages[rName].score;
                res.regionalInfo.conformity = regionalAverages[rName].conformity;
            }
            saveDepartmentFile(code, res);
        }
        await updateIndex();
        
        // --- SYNCHRO ACCUEIL (Optionnel & Sécurisé) ---
        try {
            console.log("\n🔄 Mise à jour automatique des scores de l'accueil...");
            const { execSync } = require('child_process');
            execSync('node scripts/sync-home-scores.js', { stdio: 'inherit' });
        } catch (e) {
            console.warn("⚠️ Note: La synchro des scores de l'accueil a échoué, mais vos données sont sauvegardées.");
        }

    } else if (deptArg) {
        const codes = deptArg.split('=')[1].split(',');
        for (const code of codes) {
            const res = await buildDepartment(code);
            saveDepartmentFile(code, res);
        }
        await updateIndex();

        // --- SYNCHRO ACCUEIL (Optionnel & Sécurisé) ---
        try {
            console.log("\n🔄 Mise à jour automatique des scores de l'accueil...");
            const { execSync } = require('child_process');
            execSync('node scripts/sync-home-scores.js', { stdio: 'inherit' });
        } catch (e) {
            console.warn("⚠️ Note: La synchro des scores de l'accueil a échoué, mais vos données sont sauvegardées.");
        }

    } else {
        console.log(`
🚀 SISE-EAUX ARCHIVISTE GÉNÉRIQUE
Utilisation :
  node scripts/build-dept-generic.js --dept=44          (Un seul département)
  node scripts/build-dept-generic.js --dept=44,49,35    (Liste de départements)
  node scripts/build-dept-generic.js --all              (TOUS les départements)
        `);
    }
})();

