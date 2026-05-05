const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ARCHIVE_DIR = 'c:/Users/thoma/Documents/APP/eaupotable-net/source-data/archives';
const YEARS = ["2026", "2025", "2024", "2023", "2022"];
const RESEAU = "001001072"; // Giron
const PARAM_CODES = {
    pesticides: ["1107", "1667", "7150"],
    pfas: ["7149", "8847"],
    manganese: ["1394"],
    copper: ["1392"]
};

async function deepAuditGiron() {
    const refs = new Set();
    
    // 1. Find all PLV (Prelevements) for this network
    for (const year of YEARS) {
        const plvFile = path.join(ARCHIVE_DIR, year, `DIS_PLV_${year}_001.txt`);
        if (fs.existsSync(plvFile)) {
            const content = fs.readFileSync(plvFile, 'utf8');
            const lines = content.split('\n');
            lines.forEach(line => {
                const p = line.split(',');
                if (p[1] === RESEAU) {
                    refs.add(p[7]); // referenceprel
                }
            });
        }
    }

    console.log(`Found ${refs.size} references for Giron.`);

    // 2. Search results for these references
    const foundParams = {};
    for (const year of YEARS) {
        const resFile = path.join(ARCHIVE_DIR, year, `DIS_RESULT_${year}_001.txt`);
        if (fs.existsSync(resFile)) {
            const content = fs.readFileSync(resFile, 'utf8');
            const lines = content.split('\n');
            lines.forEach(line => {
                const p = line.split(',');
                const ref = p[1];
                if (refs.has(ref)) {
                    const paramId = p[3];
                    for (const [key, codes] of Object.entries(PARAM_CODES)) {
                        if (codes.includes(paramId)) {
                            if (!foundParams[key]) foundParams[key] = [];
                            foundParams[key].push({ year, val: p[14], unit: p[10], date: ref });
                        }
                    }
                }
            });
        }
    }

    console.log(JSON.stringify(foundParams, null, 2));
}

deepAuditGiron();
