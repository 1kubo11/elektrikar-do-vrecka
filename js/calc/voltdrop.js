/**
 * Úbytok napätia.
 *
 * 1f: ΔU = 2 · L · I · (R′·cos φ + X′·sin φ)
 * 3f: ΔU = √3 · L · I · (R′·cos φ + X′·sin φ)
 *
 * R′ = 1 / (κ · S)   [Ω/m]
 */

import { SQRT3, num, cosPhi as vCosPhi, newResult, step, useRef, addDefault, note, check, round, fmt, resistancePerM } from './core.js';

/** Násobok podľa počtu fáz. */
export function phaseFactor(phases) {
  return phases === 3 ? SQRT3 : 2;
}

/**
 * Čistá matematika — používajú testy.
 * @returns {{deltaU:number, percent:number, rPerM:number, xPerM:number, m:number}}
 */
export function dropVolts({ phases, U, I, L, S, kappa, cos = 1, xPerM = 0 }) {
  const m = phaseFactor(phases);
  const rPerM = resistancePerM(kappa, S);
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const deltaU = m * L * I * (rPerM * cos + xPerM * sin);
  return { deltaU, percent: (deltaU / U) * 100, rPerM, xPerM, m, sin };
}

/**
 * Úbytok napätia ako Result s rozpisom.
 * @param {object} i vstupy
 * @param {ReturnType<import('../data/norms.js').createLookup>} lookup
 */
export function voltageDrop(i, lookup, r = newResult('Úbytok napätia')) {
  const phases = i.phases === 3 ? 3 : 1;
  const U = num(i.U, 'napätie', { min: 1, max: 100000 });
  const I = num(i.I, 'prúd', { min: 0.01, max: 10000 });
  const L = num(i.L, 'dĺžka', { min: 0.1, max: 100000 });
  const S = num(i.S, 'prierez', { min: 0.1, max: 1000 });
  const cos = i.cos === undefined || i.cos === '' ? 1 : vCosPhi(i.cos);

  const kap = lookup.get('conductivity', [i.material || 'Cu']);
  if (kap.missing) {
    r.status = 'fail';
    note(r, `Neznámy materiál vodiča: ${i.material}`);
    return r;
  }
  useRef(r, kap.ref);
  note(r, 'κ je hodnota pri ~20 °C. Pri prevádzkovej teplote vodiča je reálny úbytok o 15–20 % väčší.');

  let xPerM;
  if (i.xPerM === undefined || i.xPerM === '' || i.xPerM === null) {
    const x = lookup.get('reactance', ['default']);
    xPerM = x.value;
    useRef(r, x.ref);
    addDefault(r, 'reaktancia X′', `${xPerM} Ω/m`, 'nezadaná — zanedbaná podľa predvoleného nastavenia');
    if (S >= 50) note(r, `Pri prierezoch od 50 mm² sa reaktancia nezanedbáva. Zadaj X′ (typicky 0,08 mΩ/m), inak je úbytok podhodnotený.`);
  } else {
    xPerM = num(i.xPerM, 'X′', { min: 0, max: 1, allowZero: true });
  }

  if (cos === 1 && (i.cos === undefined || i.cos === '')) {
    addDefault(r, 'cos φ', '1,00', 'nezadaný — počítam s čisto odporovou záťažou');
  }

  const d = dropVolts({ phases, U, I, L, S, kappa: kap.value, cos, xPerM });

  step(r, 'Odpor vodiča na metr',
    "R′ = 1 / (κ · S)",
    `1 / (${kap.value} · ${S})`,
    `${d.rPerM.toExponential(4)} Ω/m`,
    `${kap.ref.standard} — ${kap.ref.table}`);

  step(r, 'Úbytok napätia',
    phases === 3
      ? 'ΔU = √3 · L · I · (R′·cos φ + X′·sin φ)'
      : 'ΔU = 2 · L · I · (R′·cos φ + X′·sin φ)',
    `${phases === 3 ? '√3' : '2'} · ${fmt(L, 2)} · ${fmt(I, 2)} · (${d.rPerM.toExponential(4)}·${fmt(cos, 3)} + ${xPerM}·${fmt(d.sin, 3)})`,
    `${fmt(d.deltaU, 2)} V`);

  step(r, 'Percentuálne',
    'ΔU% = ΔU / U · 100',
    `${fmt(d.deltaU, 2)} / ${fmt(U, 0)} · 100`,
    `${fmt(d.percent, 2)} %`);

  r.value = round(d.deltaU, 2);
  r.unit = 'V';
  r.headline = `ΔU = ${fmt(d.deltaU, 2)} V (${fmt(d.percent, 2)} %)`;
  r.percent = d.percent;
  r.rPerM = d.rPerM;
  r.xPerM = xPerM;

  if (i.limitPercent !== undefined && i.limitPercent !== '' && i.limitPercent !== null) {
    const lim = num(i.limitPercent, 'povolený úbytok', { min: 0.1, max: 50 });
    const ok = d.percent <= lim + 1e-9;
    check(r, `Úbytok ≤ ${fmt(lim, 1)} %`, ok,
      `${fmt(d.percent, 2)} % ${ok ? '≤' : '>'} ${fmt(lim, 1)} %`,
      ok ? `Úbytok napätia ${fmt(d.percent, 1)} % — povolené ${fmt(lim, 1)} %`
        : `Úbytok napätia ${fmt(d.percent, 1)} % je nad povolené ${fmt(lim, 1)} %`);
    r.limitPercent = lim;
  }

  return r;
}

/**
 * Maximálna dĺžka podľa úbytku napätia.
 * L = ΔU_dovolený / (m · I · (R′·cos φ + X′·sin φ))
 */
export function maxLengthByDrop({ phases, U, I, S, kappa, cos = 1, xPerM = 0, limitPercent }) {
  const m = phaseFactor(phases);
  const rPerM = resistancePerM(kappa, S);
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const dU = (limitPercent / 100) * U;
  const perM = m * I * (rPerM * cos + xPerM * sin);
  if (perM <= 0) return Infinity;
  return dU / perM;
}
