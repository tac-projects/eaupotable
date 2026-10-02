import fs from 'fs';
import path from 'path';

// Journal des recherches sans résultat (best-effort, jamais bloquant).
// Rotation simple à 5 Mo pour borner le disque. Données : {ts, q, source}.
// ⚠️ RGPD : une requête tapée peut contenir une donnée personnelle → conservation
// bornée (rotation) ; ne pas augmenter la rétention sans décision explicite.

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'search-misses.jsonl');
const MAX_BYTES = 5 * 1024 * 1024;
// On attend une pause de frappe avant d'écrire : sinon chaque préfixe tapé
// (« 952 », « 9520 ») serait journalisé comme un manque distinct.
const SETTLE_MS = 2000;
const pending = new Map();

function writeMiss(q, source) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    try {
      if (fs.statSync(LOG_FILE).size > MAX_BYTES) fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    } catch {
      // fichier absent : rien à faire
    }
    fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), q: String(q).slice(0, 100), source }) + '\n');
  } catch {
    // logging best-effort : on n'échoue jamais la requête pour ça
  }
}

export function logSearchMiss(q, source = 'api', ip = 'anon') {
  const previous = pending.get(ip);
  if (previous) clearTimeout(previous.timer);
  const entry = { q: String(q), source };
  const timer = setTimeout(() => {
    pending.delete(ip);
    writeMiss(entry.q, entry.source);
  }, SETTLE_MS);
  if (timer.unref) timer.unref();
  pending.set(ip, { timer });
}
