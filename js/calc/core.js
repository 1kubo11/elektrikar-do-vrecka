/**
 * Jadro výpočtov — jednotky, typ Result, pravidlo farby.
 * Žiadny DOM, žiadne normové hodnoty zadrôtované v kóde.
 */

import { CROSS_SECTIONS } from '../data/norms.js';

export const SQRT3 = Math.sqrt(3);
export { CROSS_SECTIONS };

/* ───────────────────────── Result ───────────────────────── */

export function newResult(title = '') {
  return {
    title,
    status: 'ok', // ok | warn | fail
    value: undefined,
    unit: '',
    headline: '',
    steps: [],
    refs: [],
    notes: [],
    defaults: [],
    checks: [],
    fixes: [],
    missing: [],
  };
}

/** Pridá krok výpočtu (vzorec + dosadené hodnoty + výsledok). */
export function step(r, label, formula, substituted, result, source = '') {
  r.steps.push({ label, formula, substituted, result, source });
  return r;
}

/** Zaregistruje použitú tabuľkovú referenciu (bez duplikátov). */
export function useRef(r, ref) {
  if (!ref) return r;
  const key = `${ref.datasetId}|${ref.path}`;
  if (!r.refs.some((x) => `${x.datasetId}|${x.path}` === key)) r.refs.push(ref);
  return r;
}

/** Zaznamená predvolený (nezadaný) údaj — aplikácia nikdy nedosadí ticho. */
export function addDefault(r, what, value, why) {
  r.defaults.push({ what, value, why });
  return r;
}

export function note(r, text) {
  if (text && !r.notes.includes(text)) r.notes.push(text);
  return r;
}

/**
 * Kontrola s vlastným stavom. ok=true/false, alebo null = nedá sa overiť.
 * plain = veta bežnou rečou pre jednoduchý režim; false = v jednoduchom režime skryť.
 */
export function check(r, label, ok, detail = '', plain) {
  r.checks.push({ label, ok, detail, plain });
  if (ok === false) r.status = 'fail';
  else if (ok === null && r.status === 'ok') r.status = 'warn';
  return r;
}

export function fail(r, text) {
  r.status = 'fail';
  note(r, text);
  return r;
}

export function missing(r, what) {
  if (!r.missing.includes(what)) r.missing.push(what);
  if (r.status === 'ok') r.status = 'warn';
  return r;
}

/**
 * TVRDÉ PRAVIDLO FARBY.
 * Zelená je možná len vtedy, keď prešli všetky kontroly A všetky použité
 * tabuľkové hodnoty sú označené ako overené A nechýba žiadny vstup.
 */
export function grade(r) {
  if (r.status === 'fail') return { kind: 'fail', color: 'red', label: 'Nevyhovuje', reason: reasonFail(r) };

  const unverified = r.refs.filter((x) => !x.verified);
  if (r.missing.length) {
    return { kind: 'missing', color: 'orange', label: 'Chýba údaj', reason: `Chýba: ${r.missing.join(', ')}` };
  }
  if (unverified.length) {
    return {
      kind: 'unverified',
      color: 'orange',
      label: 'Vyhovuje — ale na neoverených dátach',
      reason:
        `Výpočet použil hodnoty, ktoré sa nepodarilo porovnať so zdrojom: ` +
        `${[...new Set(unverified.map((u) => u.title || u.datasetId))].join('; ')}. ` +
        `Skontroluj ich podľa normy.`,
    };
  }
  if (r.status === 'warn') return { kind: 'warn', color: 'orange', label: 'Na hrane', reason: reasonWarn(r) };
  return { kind: 'ok', color: 'green', label: 'Vyhovuje', reason: 'Všetky kontroly prešli na overených dátach.' };
}

function reasonFail(r) {
  const bad = r.checks.filter((c) => c.ok === false).map((c) => c.label);
  return bad.length ? `Nevyhovelo: ${bad.join('; ')}` : r.notes[0] || 'Nevyhovuje.';
}
function reasonWarn(r) {
  const u = r.checks.filter((c) => c.ok === null).map((c) => c.label);
  return u.length ? `Nedá sa overiť: ${u.join('; ')}` : 'Niektoré údaje sú predvolené.';
}

/* ───────────────────────── validácia vstupov ───────────────────────── */

export class InputError extends Error {}

/** Kladné číslo. */
export function num(value, name, { min = 0, max = Infinity, allowZero = false } = {}) {
  if (value === '' || value === null || value === undefined) {
    throw new InputError(`Chýba údaj: ${name}`);
  }
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) throw new InputError(`${name}: zadaj číslo (dostal som "${value}")`);
  if (!allowZero && n === 0) throw new InputError(`${name} nemôže byť nula`);
  if (n < min) throw new InputError(`${name} nemôže byť menšie ako ${min} (zadal si ${n})`);
  if (n > max) throw new InputError(`${name} je nezmyselne veľké (max ${max}, zadal si ${n})`);
  return n;
}

export function cosPhi(value, name = 'cos φ') {
  const n = num(value, name, { min: 0.01, max: 1 });
  return n;
}

/** Zabalí výpočet tak, aby chyba vstupu skončila ako červený výsledok, nie výnimka. */
export function safely(title, fn) {
  const r = newResult(title);
  try {
    const out = fn(r);
    return out || r;
  } catch (e) {
    if (e instanceof InputError) {
      r.status = 'fail';
      r.headline = e.message;
      note(r, e.message);
      return r;
    }
    throw e;
  }
}

/* ───────────────────────── pomocné ───────────────────────── */

export function round(x, d = 2) {
  if (!Number.isFinite(x)) return x;
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

export function fmt(x, d = 2) {
  if (!Number.isFinite(x)) return '—';
  return round(x, d).toLocaleString('sk-SK', { maximumFractionDigits: d });
}

/** Najbližšia tabuľková hodnota zhora (teplota, počet obvodov...). */
export function stepUpKey(table, value) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  for (const k of keys) if (value <= k) return k;
  return keys[keys.length - 1];
}

/** Najbližšia tabuľková hodnota zdola. */
export function stepDownKey(table, value) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) if (k <= value) best = k;
  return best;
}

/** Prierezy dostupné v tabuľke, vzostupne. */
export function availableSections(table) {
  if (!table) return [];
  return Object.keys(table).map(Number).sort((a, b) => a - b);
}

/** Odpor vodiča na metr [Ω/m] z vodivosti κ [m/(Ω·mm²)]. */
export function resistancePerM(kappa, S) {
  return 1 / (kappa * S);
}

/** Najväčšie menovité istenie z radu, ktoré je ≤ limit. */
export function largestRatingUpTo(ratings, limit) {
  let best = null;
  for (const r of ratings) if (r <= limit + 1e-9) best = r;
  return best;
}

/** Najmenšie menovité istenie z radu, ktoré je ≥ potreba. */
export function smallestRatingAtLeast(ratings, need) {
  for (const r of ratings) if (r >= need - 1e-9) return r;
  return null;
}
