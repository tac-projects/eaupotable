const fs = require('fs');
const path = require('path');

async function debugIndex() {
    const dir = path.join(process.cwd(), 'public', 'data', 'departments');
    if (!fs.existsSync(dir)) {
        console.error("Dir not found:", dir);
        return;
    }
    const index = {};
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    console.log("Files found:", files.length);

    for (const f of files) {
        const dept = f.replace('.json', '');
        try {
            const content = fs.readFileSync(path.join(dir, f), 'utf8');
            const data = JSON.parse(content);
            if (data.cities) {
                const count = Object.keys(data.cities).length;
                if (dept === "75") {
                    console.log("Processing 75.json, cities count:", count);
                    console.log("Cities keys:", Object.keys(data.cities));
                }
                Object.keys(data.cities).forEach(slug => {
                    index[slug] = dept;
                });
            }
        } catch (e) {
            console.error("Error processing", f, e);
        }
    }
    console.log("Final index size:", Object.keys(index).length);
    console.log("Is paris in index?", !!index["paris"]);
}

debugIndex();
