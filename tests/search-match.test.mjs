import { test } from 'node:test';
import assert from 'node:assert/strict';
import searchMatch from '../lib/search-match.js';

// Jeu de clés synthétique : on teste la logique, pas la volumétrie du
// city-index réel (≈ 35 000 clés).
const KEYS = [
  'lyon',
  'lyons-la-foret',
  'paris',
  'sathonay-camp',
  'sathonay-village',
  'juan-les-pins',
  'l-isle-adam',
  'pacy-sur-armancon',
  'izeste',
  'aubord',
  'verdun',
  'verdun-sur-le-doubs',
];

const keysOf = (q) => searchMatch.matchByName(q, KEYS, 10).map(m => m.key);

test('normalizeQuery : accents, points, espaces et apostrophes → tirets', () => {
  assert.equal(searchMatch.normalizeQuery('  Pacy.sur.Armançon '), 'pacy-sur-armancon');
  assert.equal(searchMatch.normalizeQuery("L'Isle-Adam"), 'l-isle-adam');
  assert.equal(searchMatch.normalizeQuery('Lyon   à'), 'lyon-a');
});

test('correspondance exacte prioritaire', () => {
  const m = searchMatch.matchByName('Lyon', KEYS, 10);
  assert.equal(m[0].key, 'lyon');
  assert.equal(m[0].score, 1);
});

test('préfixe avant contenu', () => {
  assert.ok(keysOf('sathon').slice(0, 2).every(k => k.startsWith('sathon')));
});

test('le point est un séparateur (bug historique Pacy.sur.armancon)', () => {
  assert.equal(keysOf('Pacy.sur.armancon')[0], 'pacy-sur-armancon');
});

test('faute + suffixe de commune : sathonnay → sathonay-*', () => {
  assert.ok(keysOf('sathonnay').includes('sathonay-camp'));
  assert.ok(keysOf('sathonnay').includes('sathonay-village'));
});

test('une édition : izedte → izeste', () => {
  assert.ok(keysOf('izedte').includes('izeste'));
});

test('mot en trop : « lyon à » → lyon', () => {
  assert.equal(keysOf('lyon à')[0], 'lyon');
});

test('suffixe numérique d’arrondissement : « paris 17 » → paris', () => {
  assert.equal(keysOf('paris 17')[0], 'paris');
});

test('initiale parasite : « verdun n » → verdun', () => {
  assert.equal(keysOf('verdun n')[0], 'verdun');
});

test('apostrophe omise : lisle adam → l-isle-adam', () => {
  assert.ok(keysOf('lisle adam').includes('l-isle-adam'));
});

test('« juans les pins » → juan-les-pins', () => {
  assert.ok(keysOf('juans les pins').includes('juan-les-pins'));
});

test('pas de faux positif hors du corpus', () => {
  assert.equal(keysOf('new york').length, 0);
});

test('le bruit ne fabrique pas de correspondance (métrique préservée)', () => {
  assert.equal(keysOf('trifouill').length, 0);
});
