/**
 * Automatické testy výpočtov.  Spustenie:  node tests/run.mjs
 */

import { createLookup, DATASETS } from '../js/data/norms.js';
import { grade, newResult, InputError, round } from '../js/calc/core.js';
import { dropVolts, voltageDrop, maxLengthByDrop } from '../js/calc/voltdrop.js';
import { ampacity, ampacityAll } from '../js/calc/ampacity.js';
import {
  currentFromPower, zsMax, maxTimeForShortCircuit, minSectionForShortCircuit,
  coordination, peCrossSection, loopImpedancePerM, faultLoopCheck, selectivity,
} from '../js/calc/protection.js';
import { modeA, modeB, modeC, modeD, maxLengths } from '../js/calc/design.js';
import { motor, conversions } from '../js/calc/motor.js';
import { pvString, pvDcCable, pvAcCable, uocAtTemp } from '../js/calc/pv.js';
import { wallbox } from '../js/calc/wallbox.js';

const L = createLookup({});
/** lookup, v ktorom je všetko označené ako overené — na test pravidla farby */
const allVerified = createLookup(
  Object.fromEntries(Object.keys(DATASETS).map((k) => [`${k}.__verified`, true])),
);

let pass = 0, failn = 0;
const fails = [];

function t(name, fn) {
  try {
    fn();
    pass++;
    process.stdout.write('.');
  } catch (e) {
    failn++;
    fails.push({ name, msg: e.message, stack: e.stack });
    process.stdout.write('F');
  }
}

function eq(actual, expected, msg = '') {
  if (actual !== expected) throw new Error(`${msg} — čakal "${expected}", dostal "${actual}"`);
}
function near(actual, expected, tol, msg = '') {
  if (!Number.isFinite(actual)) throw new Error(`${msg} — výsledok nie je číslo: ${actual}`);
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${msg} — čakal ${expected} ±${tol}, dostal ${actual}`);
  }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'podmienka neplatí'); }
function throws(fn, msg) {
  try { fn(); } catch (e) { return e; }
  throw new Error(msg || 'čakal som chybu, ale neprišla');
}

/* ═══════════════ 1. KONTROLNÉ HODNOTY ZO ZADANIA ═══════════════ */
console.log('\n── Kontrolné hodnoty zo zadania (cos φ = 1, X′ = 0, κCu = 56, κAl = 35) ──');

t('1f 230 V, 16 A, 30 m, Cu 2,5 mm² → ΔU ≈ 6,86 V (2,98 %)', () => {
  const d = dropVolts({ phases: 1, U: 230, I: 16, L: 30, S: 2.5, kappa: 56, cos: 1, xPerM: 0 });
  near(d.deltaU, 6.857, 0.01, 'ΔU');
  near(d.percent, 2.98, 0.01, 'ΔU %');
});

t('3f 400 V, 32 A, 50 m, Cu 6 mm² → ΔU ≈ 8,25 V (2,06 %)', () => {
  const d = dropVolts({ phases: 3, U: 400, I: 32, L: 50, S: 6, kappa: 56, cos: 1, xPerM: 0 });
  near(d.deltaU, 8.25, 0.01, 'ΔU');
  near(d.percent, 2.06, 0.01, 'ΔU %');
});

t('3f 400 V, 63 A, 40 m, Al 16 mm² → ΔU ≈ 7,79 V (1,95 %)', () => {
  const d = dropVolts({ phases: 3, U: 400, I: 63, L: 40, S: 16, kappa: 35, cos: 1, xPerM: 0 });
  near(d.deltaU, 7.794, 0.01, 'ΔU');
  near(d.percent, 1.95, 0.01, 'ΔU %');
});

t('motor 7,5 kW, 400 V, cos φ 0,85, η 0,9 → I ≈ 14,15 A', () => {
  const I = currentFromPower({ powerW: 7500, phases: 3, U: 400, cos: 0.85, efficiency: 0.9 });
  near(I, 14.15, 0.01, 'In motora');
});

t('B16, Ia = 5 × In = 80 A, U0 = 230 V, c = 0,95 → Zs max ≈ 2,73 Ω', () => {
  const z = zsMax({ c: 0.95, U0: 230, Ia: 80 });
  near(z, 2.7312, 0.001, 'Zs max');
});

t('Cu 2,5 mm², PVC, k = 115, skrat 1000 A → t max ≈ 0,083 s', () => {
  const tm = maxTimeForShortCircuit({ k: 115, S: 2.5, Ik: 1000 });
  near(tm, 0.0827, 0.0005, 't max');
});

t('kontrolné hodnoty prejdú aj cez celý Result (voltageDrop)', () => {
  const r = voltageDrop({ phases: 1, U: 230, I: 16, L: 30, S: 2.5, material: 'Cu', cos: 1, xPerM: 0 }, L);
  near(r.value, 6.86, 0.01, 'ΔU z Result');
  near(r.percent, 2.98, 0.01, 'percent z Result');
  ok(r.steps.length >= 3, 'chýba rozpis krokov');
  ok(r.steps.every((s) => s.formula && s.substituted), 'krok bez vzorca alebo dosadenia');
});

/* ═══════════════ 2. PRAVIDLO FARBY: NEOVERENÉ ≠ ZELENÁ ═══════════════ */
console.log('\n── Pravidlo farby výsledku ──');

t('výsledok s neoverenou tabuľkou nikdy nie je zelený', () => {
  // XLPE nemá overený zdroj — výsledok sa oň opiera, preto nesmie byť zelený
  const r = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'XLPE', method: 'C', country: 'DE', Ze: 0.3 }, L);
  const g = grade(r);
  ok(g.color !== 'green', `dostal zelenú, hoci dáta sú neoverené (${g.label})`);
  ok(r.refs.some((x) => !x.verified), 'žiadna neoverená referencia nebola zaznamenaná');
});

t('po označení dát ako overené môže byť zelený', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.3 }, allVerified);
  const g = grade(r);
  eq(g.color, 'green', `po overení dát má byť zelená, je ${g.color} (${g.reason})`);
});

t('nevyhovujúci výsledok je červený aj pri overených dátach', () => {
  // 100 m na 1,5 mm² pri 16 A — úbytok aj odpojenie musia padnúť
  const r = modeC({ S: 1.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, L: 200, country: 'DE', Ze: 0.35 }, allVerified);
  const g = grade(r);
  eq(g.color, 'red', `čakal červenú, dostal ${g.color}`);
});

t('chýbajúca tabuľková hodnota → oranžová, nie zelená ani pád', () => {
  // XLPE v spôsobe A1 je v dátach vedome prázdne
  const r = ampacity({ S: 2.5, material: 'Cu', insulation: 'XLPE', method: 'A1', loadedCores: 2 }, allVerified);
  const g = grade(r);
  eq(g.color, 'orange', `čakal oranžovú, dostal ${g.color}`);
  ok(r.missing.length > 0, 'chýbajúca hodnota nebola zaznamenaná');
  ok(r.iz === undefined, 'Iz sa nemala vymyslieť');
});

/* ═══════════════ 2b. HODNOTY POROVNANÉ SO ZDROJMI (11/2026) ═══════════════ */
console.log('\n── Hodnoty porovnané s verejnými zdrojmi ──');

t('bežný zásuvkový obvod v Nemecku je zelený bez ručného odškrtávania', () => {
  const r = modeA({ loadMode: 'current', current: 16, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', minSection: 2.5 }, L);
  const g = grade(r);
  eq(g.color, 'green', `čakal zelenú, je ${g.color}: ${g.reason}`);
  ok(r.refs.every((x) => x.verified), 'vo výsledku je neoverená referencia');
});

t('každý overený dataset má uvedený aspoň jeden zdroj', () => {
  for (const [id, ds] of Object.entries(DATASETS)) {
    if (ds.verified) ok(ds.sources && ds.sources.length > 0, `${id} je overený, ale nemá zdroj`);
    else ok(!ds.sources || ds.sources.length === 0, `${id} je neoverený, ale tvári sa, že má zdroj`);
  }
});

t('Nemecko má pri 1,5 mm² v zateplenej stene 15,5 A, IEC/STN menej', () => {
  const de = ampacity({ S: 1.5, material: 'Cu', insulation: 'PVC', method: 'A1', loadedCores: 2, country: 'DE' }, L);
  const sk = ampacity({ S: 1.5, material: 'Cu', insulation: 'PVC', method: 'A1', loadedCores: 2, country: 'SK' }, L);
  near(de.izTable, 15.5, 0.001, 'DE A1 1,5 mm²');
  near(sk.izTable, 14.5, 0.001, 'SK A1 1,5 mm²');
  ok(de.refs.some((x) => x.datasetId === 'izPvcDE' && x.verified), 'DE hodnota má byť z overenej nemeckej odchýlky');
  ok(sk.refs.some((x) => x.datasetId === 'izPvcRest' && !x.verified), 'SK hodnota má byť označená ako neoverená');
});

t('kábel priamo v zemi (D2), 3 žily — hodnoty podľa B.52.4', () => {
  const q = { material: 'Cu', insulation: 'PVC', method: 'D2', loadedCores: 3, ambient: 20, country: 'SK' };
  near(ampacity({ ...q, S: 2.5 }, L).izTable, 24, 0.001, 'D2 2,5 mm²');
  near(ampacity({ ...q, S: 16 }, L).izTable, 70, 0.001, 'D2 16 mm²');
  near(ampacity({ ...q, S: 300 }, L).izTable, 359, 0.001, 'D2 300 mm²');
  near(ampacity({ ...q, S: 16, material: 'Al' }, L).izTable, 53, 0.001, 'D2 Al 16 mm²');
});

t('jednožilové káble F: 3 žily unesú menej než 2', () => {
  const two = ampacity({ S: 25, material: 'Cu', insulation: 'PVC', method: 'F', loadedCores: 2 }, L);
  const three = ampacity({ S: 25, material: 'Cu', insulation: 'PVC', method: 'F', loadedCores: 3 }, L);
  near(two.izTable, 131, 0.001, 'F 2 žily');
  near(three.izTable, 110, 0.001, 'F 3 žily');
});

t('zoskupenie: 10 káblov vo zväzku = 0,48; 8 káblov v zemi = 0,43', () => {
  const a = ampacity({ S: 2.5, material: 'Cu', insulation: 'PVC', method: 'B2', loadedCores: 3, circuits: 10 }, L);
  near(a.kGroup, 0.48, 0.001, 'zväzok 10');
  const b = ampacity({ S: 16, material: 'Cu', insulation: 'PVC', method: 'D2', loadedCores: 3, circuits: 8 }, L);
  near(b.kGroup, 0.43, 0.001, 'zem 8');
  const c = ampacity({ S: 2.5, material: 'Cu', insulation: 'PVC', method: 'B2', loadedCores: 3, circuits: 11 }, L);
  near(c.kGroup, 0.45, 0.001, '11 káblov → najbližší vyšší riadok (12)');
});

t('krátky čas odpojenia platí do 63 A, nad tým 5 s', () => {
  const a = faultLoopCheck({ S: 16, material: 'Cu', insulation: 'PVC', device: 'B', In: 50, L: 10, netType: 'TN-S', Ze: 0.1 }, L);
  const b = faultLoopCheck({ S: 25, material: 'Cu', insulation: 'PVC', device: 'B', In: 80, L: 10, netType: 'TN-S', Ze: 0.1 }, L);
  eq(a.requiredTime, 0.4, 'B50 má mať 0,4 s');
  eq(b.requiredTime, 5, 'B80 má mať 5 s');
});

t('predvolená impedancia siete je 0,3 Ω a je vypísaná', () => {
  const r = faultLoopCheck({ S: 2.5, material: 'Cu', insulation: 'PVC', device: 'B', In: 16, L: 20, netType: 'TN-C-S' }, L);
  near(r.Zs, 0.3 + 20 * (2 / (56 * 2.5)), 1e-6, 'Zs s predvolenou Ze');
  ok(r.defaults.some((d) => d.what.includes('Ze') && d.value.includes('0,3')), 'predvolená Ze nie je vypísaná');
});

t('wallbox 11 kW v Nemecku: stačí ohlásiť, ale platí § 14a', () => {
  const r = wallbox({ powerClass: 11, L: 20, country: 'DE' }, L);
  ok(!r.checks.some((c) => c.label.includes('12 kVA')), '11 kW nemá vyžadovať súhlas');
  ok(r.notes.some((n) => n.includes('14a')), 'chýba poznámka o § 14a');
});

/* ═══════════════ 3. Iz A KOREKCIE ═══════════════ */
console.log('\n── Prúdová zaťažiteľnosť a korekcie ──');

t('Iz = tabuľka × k_teplota × k_zoskupenie', () => {
  const r = ampacity({ S: 2.5, material: 'Cu', insulation: 'PVC', method: 'B2', loadedCores: 3, ambient: 40, circuits: 3 }, L);
  // B2/Cu/3 žily/2,5 mm² = 20 A, k(40°C,PVC)=0,87, k(3 obvody, bunched)=0,70
  near(r.izTable, 20, 0.001, 'Iz tabuľka');
  near(r.kTemp, 0.87, 0.001, 'k teplota');
  near(r.kGroup, 0.7, 0.001, 'k zoskupenie');
  near(r.iz, 20 * 0.87 * 0.7, 0.001, 'Iz po korekcii');
});

t('teplota medzi riadkami tabuľky sa zaokrúhli konzervatívne nahor', () => {
  const r = ampacity({ S: 2.5, material: 'Cu', insulation: 'PVC', method: 'C', loadedCores: 2, ambient: 37 }, L);
  eq(r.kTempKey, 40, 'pri 37 °C má použiť riadok 40 °C (menší faktor)');
});

t('zem používa inú tabuľku teplôt (referencia 20 °C)', () => {
  const r = ampacity({ S: 4, material: 'Cu', insulation: 'PVC', method: 'D2', loadedCores: 3, ambient: 20 }, L);
  near(r.kTemp, 1.0, 0.001, 'pri 20 °C v zemi má byť faktor 1,0');
  ok(r.refs.some((x) => x.datasetId === 'derateAmbientGround'), 'nepoužil tabuľku pre zem');
});

t('predvolené hodnoty sa vždy vypíšu', () => {
  const r = ampacity({ S: 2.5, material: 'Cu', insulation: 'PVC', method: 'B2', loadedCores: 2 }, L);
  ok(r.defaults.some((d) => d.what.includes('teplota')), 'nevypísal predvolenú teplotu');
  ok(r.defaults.some((d) => d.what.includes('obvodov')), 'nevypísal predvolený počet obvodov');
});

t('neznámy prierez v tabuľke nespadne, len chýba', () => {
  const r = ampacity({ S: 3, material: 'Cu', insulation: 'PVC', method: 'B2', loadedCores: 2 }, L);
  ok(r.missing.length > 0, 'malo chýbať Iz pre 3 mm²');
  eq(r.iz, undefined, 'Iz sa nemala interpolovať');
});

t('Al nemá prierezy pod 16 mm² → chýba, nie odhad', () => {
  const r = ampacity({ S: 2.5, material: 'Al', insulation: 'PVC', method: 'C', loadedCores: 2 }, L);
  eq(r.iz, undefined, 'pre Al 2,5 mm² nesmie vzniknúť Iz');
});

/* ═══════════════ 4. KOORDINÁCIA ISTENIA ═══════════════ */
console.log('\n── Ib ≤ In ≤ Iz a I2 ≤ 1,45·Iz ──');

t('istič: In ≤ Iz stačí, I2 = 1,45·In', () => {
  const r = coordination({ Ib: 14, In: 16, Iz: 17, device: 'B' }, L);
  near(r.I2, 23.2, 0.01, 'I2');
  ok(r.checks.every((c) => c.ok === true), 'malo prejsť');
});

t('poistka gG: In ≤ Iz nestačí (I2 = 1,6·In)', () => {
  const r = coordination({ Ib: 14, In: 16, Iz: 17, device: 'gG' }, L);
  const i2check = r.checks.find((c) => c.label.includes('I2'));
  eq(i2check.ok, false, 'pri gG 16 A a Iz 17 A musí podmienka I2 ≤ 1,45·Iz padnúť');
});

t('Ib > In → nevyhovuje', () => {
  const r = coordination({ Ib: 20, In: 16, Iz: 30, device: 'B' }, L);
  eq(r.status, 'fail', 'Ib > In musí byť fail');
});

t('In > Iz → nevyhovuje', () => {
  const r = coordination({ Ib: 10, In: 25, Iz: 20, device: 'B' }, L);
  eq(r.status, 'fail', 'In > Iz musí byť fail');
});

/* ═══════════════ 5. PE, SLUČKA, SKRAT ═══════════════ */
console.log('\n── PE, slučková impedancia, skratová odolnosť ──');

t('PE: S ≤ 16 → S, 16 < S ≤ 35 → 16, S > 35 → S/2', () => {
  eq(peCrossSection(L, 2.5).Spe, 2.5, 'PE pre 2,5');
  eq(peCrossSection(L, 16).Spe, 16, 'PE pre 16');
  eq(peCrossSection(L, 25).Spe, 16, 'PE pre 25');
  eq(peCrossSection(L, 50).Spe, 25, 'PE pre 50');
  eq(peCrossSection(L, 120).Spe, 60, 'PE pre 120');
});

t('impedancia slučky L+PE pri rovnakých prierezoch = 2/(κS)', () => {
  const z = loopImpedancePerM({ kappa: 56, S: 2.5, Spe: 2.5 });
  near(z, 2 / (56 * 2.5), 1e-12, 'z′');
});

t('minimálny prierez na skrat: S = Ik·√t / k', () => {
  near(minSectionForShortCircuit({ k: 115, Ik: 1000, t: 0.1 }), 2.75, 0.01, 'S min');
});

t('B16 na 2,5 mm² pri Ze 0,35 Ω a 20 m — odpojí a kábel vydrží', () => {
  const r = faultLoopCheck({ S: 2.5, material: 'Cu', insulation: 'PVC', device: 'B', In: 16, L: 20, netType: 'TN-C-S', Ze: 0.35 }, L);
  near(r.zPerM, 2 / (56 * 2.5), 1e-9, 'z′');
  near(r.Zs, 0.35 + 20 * (2 / (56 * 2.5)), 1e-6, 'Zs');
  near(r.Ia, 80, 0.001, 'Ia pre B16');
  near(r.zsMax, 2.7312, 0.001, 'Zs max');
  ok(r.Zs < r.zsMax, 'Zs musí byť pod Zs max');
  ok(r.checks.find((c) => c.label.includes('odpojenie')).ok === true, 'odpojenie malo vyhovieť');
  ok(r.checks.find((c) => c.label.includes('Skratová')).ok === true, 'skratová odolnosť mala vyhovieť');
});

t('D63 na 1,5 mm² — odpojenie nevyhovie', () => {
  const r = faultLoopCheck({ S: 1.5, material: 'Cu', insulation: 'PVC', device: 'D', In: 63, L: 30, netType: 'TN-C-S', Ze: 0.35 }, L);
  eq(r.status, 'fail', 'D63 na 1,5 mm² nemá vypnúť');
});

t('nameraná Zs má prednosť pred Ze + L·z′', () => {
  const r = faultLoopCheck({ S: 2.5, material: 'Cu', insulation: 'PVC', device: 'B', In: 16, L: 20, Zs: 1.2, netType: 'TN-C-S' }, L);
  near(r.Zs, 1.2, 1e-9, 'Zs z merania');
  ok(!r.defaults.some((d) => d.what.includes('Ze')), 'pri nameranej Zs nemá dosadzovať Ze');
});

t('chýbajúca Ze aj Zs → predvolený odhad je vypísaný', () => {
  const r = faultLoopCheck({ S: 2.5, material: 'Cu', insulation: 'PVC', device: 'B', In: 16, L: 20, netType: 'TN-C-S' }, L);
  ok(r.defaults.some((d) => d.what.includes('Ze')), 'predvolená Ze nebola vypísaná');
});

t('istič motora bez Ia → chýbajúci údaj, nie vymyslená hodnota', () => {
  const r = faultLoopCheck({ S: 2.5, material: 'Cu', insulation: 'PVC', device: 'motor', In: 16, L: 20, netType: 'TN-C-S', Ze: 0.35 }, L);
  ok(r.missing.some((m) => m.includes('Ia')), 'malo hlásiť chýbajúce Ia');
  ok(grade(r).color !== 'green', 'nesmie byť zelené');
});

/* ═══════════════ 6. REŽIM A ═══════════════ */
console.log('\n── Režim A: návrh prierezu a istenia ──');

t('zásuvkový obvod 3,5 kW / 1f / 20 m → 2,5 mm² + B16', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  ok(r.chosen, `nenavrhol nič: ${r.headline}`);
  eq(r.chosen.In, 16, 'istenie');
  eq(r.chosen.S, 2.5, 'prierez');
  eq(r.chosen.Spe, 2.5, 'PE');
});

t('dlhá trasa si vynúti väčší prierez kvôli úbytku', () => {
  const short = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  const long = modeA({ power: 3.5, phases: 1, L: 80, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  ok(long.chosen.S > short.chosen.S, `pri 80 m má byť väčší prierez (${short.chosen.S} → ${long.chosen.S})`);
  ok(long.chosen.dropPercent <= 3.0001, 'úbytok musí byť v limite');
});

t('návrh vždy splní všetky tri podmienky naraz', () => {
  const r = modeA({ power: 11, phases: 3, L: 60, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  ok(r.chosen, `nenavrhol nič: ${r.headline}`);
  ok(r.chosen.iz >= r.chosen.In, 'Iz < In');
  ok(r.chosen.dropPercent <= 3.0001, `úbytok ${r.chosen.dropPercent} %`);
  ok(r.chosen.Zs <= r.chosen.zsMax, 'Zs > Zs max');
});

t('vyšší počet obvodov a teplota zväčší prierez', () => {
  const a = modeA({ power: 7, phases: 1, L: 15, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  const b = modeA({ power: 7, phases: 1, L: 15, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35, ambient: 50, circuits: 6 }, L);
  ok(b.chosen.S >= a.chosen.S, 'korekcie mali prierez zväčšiť alebo nechať');
});

t('nesplniteľná záťaž → fail + konkrétne návrhy opráv', () => {
  const r = modeA({ power: 500, phases: 3, L: 300, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  eq(r.status, 'fail', 'malo padnúť');
  ok(Array.isArray(r.fixes) && r.fixes.length > 0, 'chýbajú návrhy opráv');
  ok(r.fixes.every((f) => f.label && f.result), 'návrh bez prepočtu');
});

t('návrhy opráv sú aj pri vyhovujúcom výsledku', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  ok(r.fixes.length > 0, 'chýbajú alternatívy');
});

t('Al pod minimom → upozornenie na svorky a minimálny prierez', () => {
  const r = modeA({ power: 20, phases: 3, L: 30, device: 'B', material: 'Al', insulation: 'PVC', method: 'D2', country: 'DE', Ze: 0.35 }, L);
  ok(r.notes.some((n) => n.includes('Al') || n.includes('svork')), 'chýba upozornenie na Al svorky');
});

t('SK a DE môžu dať iný návrh (limit úbytku sa nezjednocuje)', () => {
  const de = modeA({ power: 5, phases: 1, L: 45, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  const sk = modeA({ power: 5, phases: 1, L: 45, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'SK', Ze: 0.35 }, L);
  ok(de.defaults.some((d) => d.value === '3 %'), 'DE limit má byť 3 %');
  ok(sk.defaults.some((d) => d.value === '5 %'), 'SK limit má byť 5 %');
  ok(sk.chosen.S <= de.chosen.S, 'pri voľnejšom limite nemá byť väčší prierez');
});

t('minimálny prierez: SK zásuvky 16 A / 20 m dajú 1,5 mm², s minimom 2,5 mm² dajú 2,5', () => {
  const base = { loadMode: 'current', current: 16, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'SK', Ze: 0.35 };
  const free = modeA(base, L);
  const min = modeA({ ...base, minSection: 2.5 }, L);
  eq(free.chosen.S, 1.5, 'bez minima');
  eq(min.chosen.S, 2.5, 's minimom 2,5 mm²');
  ok(min.tried.some((x) => x.S === 1.5 && x.reasons[0].includes('minimom')), 'chýba dôvod, prečo 1,5 mm² neprešlo');
});

t('minimálny prierez neznižuje návrh, keď výpočet žiada viac', () => {
  const r = modeA({ loadMode: 'current', current: 16, phases: 1, L: 80, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35, minSection: 2.5 }, L);
  ok(r.chosen.S > 2.5, `pri 80 m má vyjsť viac ako 2,5 mm², vyšlo ${r.chosen.S}`);
});

/* ═══════════════ 7. REŽIM B ═══════════════ */
console.log('\n── Režim B: aké najväčšie istenie ──');

t('2,5 mm² Cu PVC B2 3 žily → B20 (Iz = 20 A)', () => {
  const r = modeB({ S: 2.5, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 3 }, L);
  near(r.iz, 20, 0.001, 'Iz');
  eq(r.In, 20, 'najväčšie istenie');
});

t('pri gG je najväčšie istenie menšie (I2 = 1,6·In)', () => {
  const mcb = modeB({ S: 2.5, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 3 }, L);
  const fuse = modeB({ S: 2.5, device: 'gG', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 3 }, L);
  ok(fuse.In < mcb.In, `gG má dať menšie istenie (${fuse.In} vs ${mcb.In})`);
});

t('korekcie znížia najväčšie istenie', () => {
  const a = modeB({ S: 6, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 3 }, L);
  const b = modeB({ S: 6, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 3, ambient: 50, circuits: 4 }, L);
  ok(b.In < a.In, `korekcie mali istenie znížiť (${a.In} → ${b.In})`);
});

/* ═══════════════ 8. REŽIM C — TRI SAMOSTATNÉ DĹŽKY ═══════════════ */
console.log('\n── Režim C: do akej dĺžky to vyhovuje ──');

t('vracia tri samostatné dĺžky a pomenuje, čo obmedzuje', () => {
  const r = modeC({ S: 2.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  ok(r.byDrop.L !== undefined, 'chýba dĺžka podľa úbytku');
  ok(r.byDisconnect.L !== undefined, 'chýba dĺžka podľa odpojenia');
  ok(r.byShort.L !== undefined, 'chýba dĺžka podľa skratovej odolnosti');
  ok(r.limitedBy, 'chýba, čo dĺžku obmedzuje');
  near(r.maxLength, Math.min(r.byDrop.L, r.byDisconnect.L, r.byShort.L), 0.01, 'výsledok má byť minimum z troch');
});

t('max. dĺžka podľa úbytku sa zhoduje s ručným prepočtom', () => {
  const r = modeC({ S: 2.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  const manual = maxLengthByDrop({ phases: 1, U: 230, I: 16, S: 2.5, kappa: 56, cos: 1, xPerM: 0, limitPercent: 3 });
  near(r.byDrop.L, manual, 0.01, 'dĺžka podľa úbytku');
  near(manual, (0.03 * 230) / (2 * 16 * (1 / (56 * 2.5))), 0.01, 'ručný vzorec');
});

t('max. dĺžka podľa odpojenia = (Zs_max − Ze) / z′', () => {
  const r = modeC({ S: 2.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  const zp = 2 / (56 * 2.5);
  near(r.byDisconnect.L, (2.7312 - 0.35) / zp, 0.05, 'dĺžka podľa odpojenia');
});

t('charakteristika D skrátí dĺžku podľa odpojenia proti B', () => {
  const b = modeC({ S: 2.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  const d = modeC({ S: 2.5, In: 16, device: 'D', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  ok(d.byDisconnect.L < b.byDisconnect.L, 'D má mať kratší limit odpojenia');
});

t('3f obvod má dlhší limit úbytku ako 1f pri rovnakom prúde', () => {
  const f1 = modeC({ S: 4, In: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'C', phases: 1, country: 'SK', Ze: 0.35 }, L);
  const f3 = modeC({ S: 4, In: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'C', phases: 3, country: 'SK', Ze: 0.35 }, L);
  ok(f3.byDrop.L > f1.byDrop.L, '3f má mať dlhší limit');
});

t('Ze väčšia ako Zs_max → nevyhovuje ani pri nulovej dĺžke', () => {
  const r = modeC({ S: 1.5, In: 63, device: 'D', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 2 }, L);
  ok(r.maxLength <= 0 || r.status === 'fail', 'malo byť nevyhovujúce');
});

t('plánovaná dĺžka nad limitom → fail + návrhy opráv', () => {
  const r = modeC({ S: 1.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, L: 150, country: 'DE', Ze: 0.35 }, L);
  eq(r.status, 'fail', 'malo padnúť');
  ok(r.fixes && r.fixes.length, 'chýbajú návrhy opráv');
});

/* ═══════════════ 9. REŽIM D ═══════════════ */
console.log('\n── Režim D: rýchla tabuľka ──');

t('tabuľka má riadok pre každý prierez s Iz, istením a dĺžkami', () => {
  const r = modeD({ device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  ok(r.rows.length >= 10, `málo riadkov: ${r.rows.length}`);
  const row = r.rows.find((x) => x.S === 2.5);
  ok(row, 'chýba riadok 2,5 mm²');
  near(row.iz, 23, 0.001, 'Iz pre 2,5 mm² B2 2 žily');
  eq(row.In, 20, 'istenie pre 2,5 mm²');
  ok(row.lengths.max > 0, 'chýba maximálna dĺžka');
  ok(row.lengths.limitedBy, 'chýba, čo obmedzuje');
});

t('Iz v tabuľke rastie s prierezom', () => {
  const r = modeD({ device: 'B', material: 'Cu', insulation: 'PVC', method: 'C', phases: 3, country: 'DE', Ze: 0.35 }, L);
  for (let k = 1; k < r.rows.length; k++) {
    ok(r.rows[k].iz > r.rows[k - 1].iz, `Iz neklesá monotónne pri ${r.rows[k].S} mm²`);
  }
});

/* ═══════════════ 10. MOTORY ═══════════════ */
console.log('\n── Motory ──');

t('motor 7,5 kW cez celý Result → 14,15 A', () => {
  const r = motor({ power: 7.5, phases: 3, U: 400, cos: 0.85, efficiency: 0.9 }, L);
  near(r.In, 14.15, 0.01, 'In');
  near(r.kVA, 9.81, 0.02, 'kVA');
});

t('rozbehový prúd: priamy štart ≈ 7×In, Y/D menší', () => {
  const dol = motor({ power: 7.5, phases: 3, U: 400, cos: 0.85, efficiency: 0.9, startMode: 'direct' }, L);
  const yd = motor({ power: 7.5, phases: 3, U: 400, cos: 0.85, efficiency: 0.9, startMode: 'stardelta' }, L);
  near(dol.startCurrent, 14.15 * 7, 0.1, 'priamy štart');
  ok(yd.startCurrent < dol.startCurrent, 'Y/D má mať menší rozbehový prúd');
});

t('nezadaný cos φ a η sa doplnia z dát a vypíšu ako predvolené', () => {
  const r = motor({ power: 7.5, phases: 3, U: 400 }, L);
  ok(r.defaults.some((d) => d.what.includes('cos')), 'cos φ nebol vypísaný ako predvolený');
  ok(r.defaults.some((d) => d.what.includes('účinnosť')), 'účinnosť nebola vypísaná');
  ok(grade(r).color !== 'green', 'na predvolených neoverených dátach nesmie byť zelená');
});

t('kompenzácia: Q = P · (tan φ₁ − tan φ₂)', () => {
  const r = motor({ power: 10, phases: 3, U: 400, cos: 0.7, efficiency: 0.9, targetCos: 0.95 }, L);
  const expected = 10 * (Math.tan(Math.acos(0.7)) - Math.tan(Math.acos(0.95)));
  near(r.compensation, expected, 0.01, 'kvar');
});

t('cieľový cos φ nižší ako súčasný → upozornenie, nie záporná kompenzácia', () => {
  const r = motor({ power: 10, phases: 3, U: 400, cos: 0.95, efficiency: 0.9, targetCos: 0.7 }, L);
  eq(r.compensation, undefined, 'nemá vracať kompenzáciu');
  ok(r.notes.some((n) => n.includes('nemá zmysel')), 'chýba upozornenie');
});

t('prepočty kW/kVA/A sú navzájom konzistentné', () => {
  const c = conversions({ phases: 3, U: 400, cos: 0.85 });
  const A = c.aFromKw(7.5);
  near(c.kwFromA(A), 7.5, 1e-9, 'kW → A → kW');
  near(c.kvaFromKw(7.5), 7.5 / 0.85, 1e-9, 'kVA z kW');
});

/* ═══════════════ 11. FOTOVOLTIKA ═══════════════ */
console.log('\n── Fotovoltika ──');

t('Uoc pri −10 °C stúpne', () => {
  const u = uocAtTemp({ uocStc: 41.5, tempCoeff: -0.003, temp: -10 });
  near(u, 41.5 * (1 + -0.003 * -35), 0.001, 'Uoc pri -10 °C');
  ok(u > 41.5, 'pri mraze musí Uoc stúpnuť');
});

t('max. počet panelov v reťazci podľa limitu striedača', () => {
  const r = pvString({ uocStc: 41.5, iscStc: 13.9, invMaxV: 1000, tempCoeff: -0.003, minTemp: -10 }, L);
  const uocCold = 41.5 * (1 + -0.003 * -35);
  eq(r.maxModules, Math.floor(1000 / uocCold), 'max panelov');
});

t('prekročený limit striedača → fail', () => {
  const r = pvString({ uocStc: 41.5, iscStc: 13.9, invMaxV: 600, modules: 20, tempCoeff: -0.003, minTemp: -10 }, L);
  eq(r.status, 'fail', 'malo padnúť');
});

t('Isc sa dimenzuje s koeficientom 1,25', () => {
  const r = pvString({ uocStc: 41.5, iscStc: 13.9, invMaxV: 1000 }, L);
  near(r.iscDesign, 13.9 * 1.25, 0.001, 'návrhový prúd');
});

t('teplotný súčiniteľ sa prijme aj v %/K', () => {
  const a = pvString({ uocStc: 41.5, iscStc: 13.9, invMaxV: 1000, tempCoeff: -0.3, minTemp: -10 }, L);
  const b = pvString({ uocStc: 41.5, iscStc: 13.9, invMaxV: 1000, tempCoeff: -0.003, minTemp: -10 }, L);
  near(a.uocCold, b.uocCold, 0.001, '-0,3 %/K a -0,003 /K musia dať to isté');
});

t('DC kábel: úbytok 2 × L', () => {
  const r = pvDcCable({ current: 11, L: 30, S: 6, U: 600, material: 'Cu' }, L);
  near(r.value, 2 * 30 * 11 * (1 / (56 * 6)), 0.01, 'ΔU DC');
});

t('AC kábel striedača počíta prúd aj úbytok', () => {
  const r = pvAcCable({ power: 10, phases: 3, L: 25, S: 6, material: 'Cu', country: 'DE' }, L);
  near(r.I, 10000 / (Math.sqrt(3) * 400), 0.01, 'prúd striedača');
});

/* ═══════════════ 12. WALLBOX ═══════════════ */
console.log('\n── Wallbox ──');

t('11 kW → 3f/16 A, navrhne kábel a istenie', () => {
  const r = wallbox({ powerClass: 11, L: 20, material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  eq(r.phases, 3, 'fázy');
  eq(r.current, 16, 'prúd');
  ok(r.design, `nenavrhol kábel: ${r.headline}`);
  ok(r.design.S >= 2.5, 'prierez');
});

t('22 kW v DE → upozornenie na schválenie nad 12 kW', () => {
  const r = wallbox({ powerClass: 22, L: 20, material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  ok(r.checks.some((c) => c.label.includes('12 kVA')), 'chýba upozornenie na 12 kVA');
  ok(r.reporting && r.reporting.length, 'chýbajú ohlasovacie povinnosti');
});

t('DE a SK majú iné ohlasovacie texty (nezjednotené)', () => {
  const de = wallbox({ powerClass: 11, L: 20, country: 'DE', Ze: 0.35 }, L);
  const sk = wallbox({ powerClass: 11, L: 20, country: 'SK', Ze: 0.35 }, L);
  ok(JSON.stringify(de.reporting) !== JSON.stringify(sk.reporting), 'texty sa nemajú zhodovať');
});

t('wallbox vždy upozorní na DC 6 mA ochranu', () => {
  const r = wallbox({ powerClass: 11, L: 20, country: 'DE', Ze: 0.35 }, L);
  ok(r.checks.some((c) => c.label.includes('6 mA')), 'chýba kontrola DC 6 mA');
});

/* ═══════════════ 13. NULOVÉ, ZÁPORNÉ A NEZMYSELNÉ VSTUPY ═══════════════ */
console.log('\n── Nulové, záporné, chýbajúce a nezmyselné vstupy ──');

t('nulová dĺžka → chyba vstupu, nie NaN', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 0, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'malo padnúť');
  ok(r.headline.includes('nemôže byť nula') || r.headline.includes('menšie'), `nečakaná správa: ${r.headline}`);
});

t('záporná dĺžka → chyba vstupu', () => {
  const r = modeA({ power: 3.5, phases: 1, L: -20, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'malo padnúť');
});

t('záporný výkon → chyba vstupu', () => {
  const r = modeA({ power: -5, phases: 1, L: 20, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'malo padnúť');
});

t('chýbajúca dĺžka → jasná správa, nie NaN', () => {
  const r = modeA({ power: 3.5, phases: 1, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'malo padnúť');
  ok(r.headline.includes('Chýba'), `nečakaná správa: ${r.headline}`);
});

t('cos φ > 1 → chyba vstupu', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, cos: 1.3, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'cos φ 1,3 musí byť chyba');
});

t('cos φ = 0 → chyba vstupu', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, cos: 0, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'cos φ 0 musí byť chyba');
});

t('text namiesto čísla → jasná správa', () => {
  const r = modeA({ power: 'tri kilowatty', phases: 1, L: 20, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'malo padnúť');
  ok(r.headline.includes('zadaj číslo'), `nečakaná správa: ${r.headline}`);
});

t('desatinná čiarka funguje ako desatinná bodka', () => {
  const a = modeA({ power: '3,5', phases: 1, L: '20', device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  const b = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  eq(a.chosen.S, b.chosen.S, 'čiarka a bodka majú dať to isté');
});

t('nezmyselne veľký výkon → chyba vstupu, nie nekonečná smyčka', () => {
  const r = modeA({ power: 1e9, phases: 3, L: 20, device: 'B', country: 'DE' }, L);
  eq(r.status, 'fail', 'malo padnúť');
});

t('nezmyselná kombinácia: Al 1,5 mm² → chýba Iz, nie výmysel', () => {
  const r = modeA({ power: 2, phases: 1, L: 10, device: 'B', material: 'Al', insulation: 'PVC', method: 'C', country: 'DE', Ze: 0.35 }, L);
  // najmenší Al v tabuľke je 16 mm² — návrh musí buď zvoliť 16, alebo povedať, že nemá dáta
  ok(r.chosen === undefined || r.chosen.S >= 16, `Al návrh ${r.chosen?.S} mm² je pod tabuľkou`);
});

t('neznámy spôsob uloženia → chýbajúce dáta, nie pád', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'XX', country: 'DE' }, L);
  ok(r.missing.length > 0, 'malo hlásiť chýbajúce dáta');
  ok(grade(r).color !== 'green', 'nesmie byť zelené');
});

t('neznámy materiál vodiča → fail, nie NaN', () => {
  const r = voltageDrop({ phases: 1, U: 230, I: 16, L: 30, S: 2.5, material: 'Zlato' }, L);
  eq(r.status, 'fail', 'malo padnúť');
});

t('neznámy typ istenia → chýbajúce dáta', () => {
  const r = modeB({ S: 2.5, device: 'ZZZ', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1 }, L);
  ok(r.missing.length > 0 || r.status !== 'ok', 'malo hlásiť problém');
});

t('nulový prierez → chyba vstupu', () => {
  const r = modeB({ S: 0, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1 }, L);
  eq(r.status, 'fail', 'malo padnúť');
});

t('žiadny výsledok neobsahuje NaN', () => {
  const results = [
    modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L),
    modeB({ S: 6, device: 'B', material: 'Cu', insulation: 'PVC', method: 'C', phases: 3 }, L),
    modeC({ S: 2.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L),
    modeD({ device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L),
    motor({ power: 7.5, phases: 3, U: 400 }, L),
    pvString({ uocStc: 41.5, iscStc: 13.9, invMaxV: 1000 }, L),
    wallbox({ powerClass: 11, L: 20, country: 'DE', Ze: 0.35 }, L),
  ];
  const json = JSON.stringify(results);
  ok(!json.includes('NaN'), 'niektorý výsledok obsahuje NaN');
  ok(!json.includes('"Infinity"'), 'niektorý výsledok obsahuje Infinity');
});

/* ═══════════════ 14. TRANSPARENTNOSŤ ═══════════════ */
console.log('\n── Transparentnosť výpočtu ──');

t('každý výsledok nesie referencie na použité tabuľky', () => {
  const r = modeA({ power: 3.5, phases: 1, L: 20, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', country: 'DE', Ze: 0.35 }, L);
  ok(r.refs.length >= 4, `málo referencií: ${r.refs.length}`);
  ok(r.refs.every((x) => x.standard && x.table && typeof x.verified === 'boolean'), 'referencia bez normy/tabuľky/stavu');
});

t('každý krok má vzorec aj dosadené hodnoty', () => {
  const r = modeC({ S: 2.5, In: 16, device: 'B', material: 'Cu', insulation: 'PVC', method: 'B2', phases: 1, country: 'DE', Ze: 0.35 }, L);
  ok(r.steps.length >= 5, `málo krokov: ${r.steps.length}`);
  ok(r.steps.every((s) => s.label && s.formula), 'krok bez popisu alebo vzorca');
});

t('úprava hodnoty v overlay sa prepíše do výsledku', () => {
  const custom = createLookup({ 'izPvcHD.B2.Cu.2.2.5': 30 });
  const r = ampacity({ S: 2.5, material: 'Cu', insulation: 'PVC', method: 'B2', loadedCores: 2, ambient: 30, circuits: 1 }, custom);
  near(r.izTable, 30, 0.001, 'prepísaná hodnota sa nepoužila');
  ok(r.refs.some((x) => x.overridden), 'prepis nie je označený v referencii');
});

t('selektivita je len orientačná a vždy to povie', () => {
  const s = selectivity({ In: 16, InUp: 25, device: 'B', deviceUp: 'B' });
  ok(s.warn.includes('NEDÁ'), 'chýba upozornenie na orientačnosť');
  eq(s.ok, false, '25/16 = 1,56× má byť pod hranicou 2×');
  const s2 = selectivity({ In: 16, InUp: 63, device: 'B', deviceUp: 'gG' });
  eq(s2.ok, true, '63/16 = 3,9× má byť nad hranicou');
});

/* ═══════════════ VÝSLEDOK ═══════════════ */
console.log(`\n\n${'═'.repeat(60)}`);
console.log(`Prešlo: ${pass}   Padlo: ${failn}`);
if (fails.length) {
  console.log(`${'═'.repeat(60)}`);
  for (const f of fails) console.log(`\n✗ ${f.name}\n  ${f.msg}`);
  process.exitCode = 1;
} else {
  console.log('Všetky testy prešli.');
}
