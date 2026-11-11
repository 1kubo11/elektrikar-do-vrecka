/**
 * Prúdová zaťažiteľnosť Iz a korekcie.
 * Iz = Iz_tab · k_teplota · k_zoskupenie
 *
 * Tabuľka Iz je v dátach rozdelená do viacerých datasetov (spoločné hodnoty HD,
 * nemecká odchýlka, časť bez overeného zdroja). Poradie hľadania pre krajinu
 * určuje IZ_CHAIN — prvý dataset, ktorý hodnotu má, vyhráva a jeho referencia
 * ide do výsledku.
 */

import { newResult, step, useRef, addDefault, note, missing, round, fmt, stepUpKey } from './core.js';
import { IZ_CHAIN, dsGrouping } from '../data/norms.js';

/** Je spôsob uloženia v zemi? */
export function isGroundMethod(method) {
  return method === 'D1' || method === 'D2';
}

function chain(insulation, country) {
  return IZ_CHAIN[insulation]?.[country === 'SK' ? 'SK' : 'DE'] || [];
}

/** Iz z tabuľky pre jeden prierez: { value, ref, missing }. */
export function izLookup(lookup, { insulation, method, material, loadedCores, country }, S) {
  let lastRef;
  for (const dsId of chain(insulation, country)) {
    const got = lookup.get(dsId, [method, material, String(loadedCores), String(S)]);
    lastRef = got.ref;
    if (!got.missing) return got;
  }
  return { value: undefined, ref: lastRef, missing: true };
}

/** Všetky prierezy, pre ktoré v niektorom datasete reťazca existuje hodnota. */
export function izSections(lookup, { insulation, method, material, loadedCores, country }) {
  const set = new Set();
  for (const dsId of chain(insulation, country)) {
    const got = lookup.get(dsId, [method, material, String(loadedCores)]);
    if (!got.missing && got.value) Object.keys(got.value).forEach((k) => set.add(Number(k)));
  }
  return [...set].sort((a, b) => a - b);
}

/** Korekčný súčiniteľ na teplotu. */
export function tempFactor(lookup, { insulation, method, ambient }) {
  const dsId = isGroundMethod(method) ? 'derateAmbientGround' : 'derateAmbientAir';
  const whole = lookup.get(dsId, [insulation]);
  if (whole.missing || !whole.value) return { factor: undefined, ref: whole.ref, dsId };
  const key = stepUpKey(whole.value, ambient);
  const got = lookup.get(dsId, [insulation, String(key)]);
  return { factor: got.value, usedKey: key, ref: got.ref, dsId, refTemp: isGroundMethod(method) ? 20 : 30 };
}

/** Korekčný súčiniteľ na zoskupenie. */
export function groupingFactor(lookup, { method, circuits, groupingType }) {
  let type = groupingType;
  let typeRef;
  if (!type) {
    const g = lookup.get('groupingByMethod', [method]);
    type = g.value;
    typeRef = g.ref;
  }
  if (!type) return { factor: undefined, ref: typeRef };
  const dsId = dsGrouping(type);
  const whole = lookup.get(dsId, [type]);
  if (whole.missing || !whole.value) return { factor: undefined, ref: whole.ref, type, typeRef };
  // keď presný počet nie je v tabuľke, ber najbližší VYŠŠÍ (menší, prísnejší súčiniteľ)
  const keys = Object.keys(whole.value).map(Number).sort((a, b) => a - b);
  const key = keys.find((k) => circuits <= k) ?? keys[keys.length - 1];
  const got = lookup.get(dsId, [type, String(key)]);
  return { factor: got.value, usedKey: key, ref: got.ref, type, typeRef };
}

/**
 * Iz pre konkrétny prierez vrátane korekcií.
 * @returns Result s r.iz, r.izTable, r.kTemp, r.kGroup, r.sections
 */
export function ampacity(i, lookup, r = newResult('Prúdová zaťažiteľnosť Iz')) {
  const { insulation = 'PVC', method = 'B2', material = 'Cu', S } = i;
  const country = i.country === 'SK' ? 'SK' : 'DE';
  const loadedCores = i.loadedCores === 3 ? 3 : 2;
  const circuits = i.circuits === undefined || i.circuits === '' ? 1 : Number(i.circuits);
  const ground = isGroundMethod(method);
  const q = { insulation, method, material, loadedCores, country };

  let ambient = i.ambient;
  if (ambient === undefined || ambient === '' || ambient === null) {
    ambient = ground ? 20 : 30;
    addDefault(r, ground ? 'teplota zeme' : 'teplota okolia', `${ambient} °C`,
      'nezadaná — použitá referenčná teplota tabuľky');
  } else {
    ambient = Number(ambient);
  }
  if (circuits === 1 && (i.circuits === undefined || i.circuits === '')) {
    addDefault(r, 'počet súbežných obvodov', '1', 'nezadaný — bez zoskupenia');
  }
  if (i.loadedCores === undefined) {
    addDefault(r, 'počet zaťažených žíl', String(loadedCores), 'nezadaný — odvodené z počtu fáz');
  }

  r.sections = izSections(lookup, q);
  if (!r.sections.length) {
    missing(r, `tabuľka Iz pre ${insulation} / ${material} / spôsob ${method} / ${loadedCores} zaťažené žily`);
    note(r, 'Pre túto kombináciu nemám tabuľkovú hodnotu. Nevymýšľam ju — doplň ju v prehľade tabuliek.');
    return r;
  }

  const kT = tempFactor(lookup, { insulation, method, ambient });
  useRef(r, kT.ref);
  const kG = groupingFactor(lookup, { method, circuits, groupingType: i.groupingType });
  useRef(r, kG.ref);
  if (kG.typeRef) useRef(r, kG.typeRef);

  r.kTemp = kT.factor;
  r.kGroup = kG.factor;
  r.kTempKey = kT.usedKey;
  r.kGroupKey = kG.usedKey;
  r.groupingType = kG.type;
  r.ambient = ambient;

  if (kT.factor === undefined) missing(r, `korekcia na teplotu ${ambient} °C pre ${insulation}`);
  if (kG.factor === undefined) missing(r, `korekcia na zoskupenie ${circuits} obvodov`);

  if (S !== undefined && S !== '' && S !== null) {
    const sNum = Number(S);
    const baseGot = izLookup(lookup, q, sNum);
    if (baseGot.missing) {
      missing(r, `Iz pre prierez ${sNum} mm² v tejto tabuľke`);
      note(r, `Prierez ${sNum} mm² nie je v tabuľke. Dostupné: ${r.sections.join(', ')} mm².`);
      return r;
    }
    const base = baseGot.value;
    const tabRef = baseGot.ref;
    useRef(r, tabRef);
    const kt = kT.factor ?? 1;
    const kg = kG.factor ?? 1;
    const iz = base * kt * kg;

    step(r, 'Tabuľková zaťažiteľnosť',
      `Iz_tab (${insulation}, ${material}, ${method}, ${loadedCores} žily, ${sNum} mm²)`,
      tabRef?.overridden ? 'ručne upravená hodnota' : '—', `${fmt(base, 1)} A`,
      `${tabRef.standard} — ${tabRef.table}${tabRef.verified ? '' : ' (NEOVERENÉ)'}`);
    step(r, 'Korekcia na teplotu',
      'k_teplota',
      `${ground ? 'zem' : 'vzduch'} ${ambient} °C → tabuľka ${kT.usedKey} °C (ref. ${kT.refTemp} °C)`,
      `${fmt(kt, 3)}`,
      kT.ref ? `${kT.ref.standard} — ${kT.ref.table}` : '');
    step(r, 'Korekcia na zoskupenie',
      'k_zoskupenie',
      `${circuits} obvod(ov), typ "${kG.type}" → tabuľka ${kG.usedKey}`,
      `${fmt(kg, 3)}`,
      kG.ref ? `${kG.ref.standard} — ${kG.ref.table}` : '');
    step(r, 'Zaťažiteľnosť po korekciách',
      'Iz = Iz_tab · k_teplota · k_zoskupenie',
      `${fmt(base, 1)} · ${fmt(kt, 3)} · ${fmt(kg, 3)}`,
      `${fmt(iz, 2)} A`);

    r.izTable = base;
    r.iz = iz;
    r.value = round(iz, 2);
    r.unit = 'A';
    r.headline = `Iz = ${fmt(iz, 1)} A (tabuľka ${fmt(base, 1)} A × ${fmt(kt, 2)} × ${fmt(kg, 2)})`;
  }

  return r;
}

/**
 * Iz pre všetky prierezy v tabuľke — pre rýchlu tabuľku a návrh.
 * Každý riadok nesie vlastnú referenciu (ref), lebo hodnoty môžu pochádzať
 * z rôznych datasetov; probe.refs obsahuje len korekčné súčinitele.
 */
export function ampacityAll(i, lookup) {
  const probe = ampacity({ ...i, S: undefined }, lookup);
  const q = {
    insulation: i.insulation || 'PVC',
    method: i.method || 'B2',
    material: i.material || 'Cu',
    loadedCores: i.loadedCores === 3 ? 3 : 2,
    country: i.country === 'SK' ? 'SK' : 'DE',
  };
  const out = [];
  for (const S of probe.sections || []) {
    const got = izLookup(lookup, q, S);
    if (got.missing) continue;
    out.push({ S, izTable: got.value, iz: got.value * (probe.kTemp ?? 1) * (probe.kGroup ?? 1), ref: got.ref });
  }
  return { list: out, probe };
}
