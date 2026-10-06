import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { reportSearchNoResult, cancelSearchNoResult } from '../lib/search-no-result.js';

// Stub minimal de `window` : lib/analytics.js n'émet que si window existe, et
// appelle window.track(...) — on capture les émissions ici.
const emissions = [];
globalThis.window = {
  dataLayer: [],
  track: (name, payload) => emissions.push({ name, payload }),
};

function reset() {
  cancelSearchNoResult();
  emissions.length = 0;
}

function withTimers(fn) {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    reset();
    fn();
  } finally {
    mock.timers.reset();
  }
}

test('saisie prolongée : un seul événement, pour le terme final', () => {
  withTimers(() => {
    reportSearchNoResult('trif');
    reportSearchNoResult('trifouill');
    mock.timers.tick(2500);
    assert.deepEqual(emissions, [{ name: 'search_no_result', payload: { q: 'trifouill' } }]);
  });
});

test('préfixe plus court qu’un terme en attente : ignoré', () => {
  withTimers(() => {
    reportSearchNoResult('trifouill');
    reportSearchNoResult('trif');
    mock.timers.tick(2500);
    assert.deepEqual(emissions, [{ name: 'search_no_result', payload: { q: 'trifouill' } }]);
  });
});

test('recherche totalement différente : remplace la précédente', () => {
  withTimers(() => {
    reportSearchNoResult('lyon');
    reportSearchNoResult('paris');
    mock.timers.tick(2500);
    assert.deepEqual(emissions, [{ name: 'search_no_result', payload: { q: 'paris' } }]);
  });
});

test('rien n’est émis avant la stabilisation', () => {
  withTimers(() => {
    reportSearchNoResult('lyon');
    mock.timers.tick(1000);
    assert.equal(emissions.length, 0);
    mock.timers.tick(1500);
    assert.equal(emissions.length, 1);
  });
});

test('cancel annule le terme en attente', () => {
  withTimers(() => {
    reportSearchNoResult('lyon');
    cancelSearchNoResult();
    mock.timers.tick(2500);
    assert.equal(emissions.length, 0);
  });
});

test('moins de 3 caractères : jamais journalisé', () => {
  withTimers(() => {
    reportSearchNoResult('ab');
    reportSearchNoResult('  ');
    mock.timers.tick(2500);
    assert.equal(emissions.length, 0);
  });
});
