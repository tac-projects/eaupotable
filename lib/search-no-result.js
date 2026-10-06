import { track } from './analytics.js';

// Journalise `search_no_result` en absorbant la saisie partielle.
//
// Motif réel observé (trop de bruit) : un utilisateur qui tape lentement
// produisait « trif », puis « trifouill » — deux « sans résultat » pour une
// seule recherche. Ici, un terme qui PROLONGE le précédent le remplace, et un
// terme plus court qu'un terme déjà en attente est ignoré. Un minuteur de
// stabilisation n'envoie que le terme final.
//
// Volontairement au niveau module : un seul état partagé par les zones de
// recherche d'une même page (navbar + accueil), ce qui évite les doublons.
const SETTLE_MS = 2500;

let pendingQ = null;
let timer = null;

function flush() {
  const q = pendingQ;
  pendingQ = null;
  timer = null;
  if (q) track('search_no_result', { q });
}

export function reportSearchNoResult(term) {
  const q = String(term == null ? '' : term).trim();
  if (q.length < 3) return;

  if (pendingQ && q.startsWith(pendingQ)) {
    pendingQ = q; // prolongement : on garde le terme le plus long
  } else if (pendingQ && pendingQ.startsWith(q)) {
    return; // régression vers un préfixe déjà couvert : on ignore
  } else {
    pendingQ = q; // nouvelle recherche
  }

  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, SETTLE_MS);
}

// À appeler quand la recherche aboutit (sélection d'un résultat) ou que le
// champ est vidé : annule le terme en attente pour ne pas fausser la mesure.
export function cancelSearchNoResult() {
  if (timer) clearTimeout(timer);
  timer = null;
  pendingQ = null;
}
