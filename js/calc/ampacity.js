/**
 * Prúdová zaťažiteľnosť Iz a korekcie.
 * Iz = Iz_tab · k_teplota · k_zoskupenie
 */

import { newResult, step, useRef, addDefault, note, missing, round, fmt, stepUpKey, stepDownKey, availableSections } from './core.js';

const DATASET_BY_INSULATION = { PVC: 'ampacityPvc', XLPE: 'ampacityXlpe' };

/** Je spôsob uloženia v zemi? */
export function isGroundMethod(method) {
  return method === 'D1' || method === 'D2';
}

/** Tabuľka prierez→Iz pre danú kombináciu, alebo undefined. */
export function ampacityTable(lookup, { insulation, method, material, loadedCores }) {
  const dsId = DATASET_BY_INSULATION[insulation];
  if (!dsId) return { table: undefined, ref: undefined, dsId: undefined };
  const got = lookup.get(dsId, [method, material, String(loadedCores)]);
  return { table: got.missing ? undefined : got.value, ref: got.ref, dsId };
}

/**
 * Korekčný súčiniteľ na teplotu.
 */
export function tempFactor(lookup, { insulation, method, ambient }) {
  const dsId = isGroundMethod(method) ? 'derateAmbientGround' : 'derateAmbientAir';
  const whole = lookup.get(dsId, [insulation]);
  if (whole.missing || !whole.value) return { factor: undefined, ref: whole.ref, dsId };
  const key = stepUpKey(whole.value, ambient);
  const got = lookup.get(dsId, [insulation, String(key)]);
  return { factor: got.value, usedKey: key, ref: got.ref, dsId, refTemp: isGroundMethod(method) ? 20 : 30 };
}

/**
 * Korekčný súčiniteľ na zoskupenie.
 */
export function groupingFactor(lookup, { method, circuits, groupingType }) {
  let type = groupingType;
  let typeRef;
  if (!type) {
    const g = lookup.get('groupingByMethod', [method]);
    type = g.value;
    typeRef = g.ref;
  }
  if (!type) return { factor: undefined, ref: typeRef };
  const whole = lookup.get('derateGrouping', [type]);
  if (whole.missing || !whole.value) return { factor: undefined, ref: whole.ref, type };
  const key = stepDownKey(whole.value, circuits) === circuits ? circuits : nearestGroupKey(whole.value, circuits);
  const got = lookup.get('derateGrouping', [type, String(key)]);
  return { factor: got.value, usedKey: key, ref: got.ref, type, typeRef };
}

function nearestGroupKey(table, circuits) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  // konzervatívne: ak presný počet nie je v tabuľke, ber najbližší VYŠŠÍ (menší faktor)
  for (const k of keys) if (circuits <= k) return k;
  return keys[keys.length - 1];
}

/**
 * Iz pre konkrétny prierez vrátane korekcií.
 * @returns Result s r.iz, r.izTable, r.kTemp, r.kGroup
 */
export function ampacity(i, lookup, r = newResult('Prúdová zaťažiteľnosť Iz')) {
  const { insulation = 'PVC', method = 'B2', material = 'Cu', S } = i;
  const loadedCores = i.loadedCores === 3 ? 3 : 2;
  const circuits = i.circuits === undefined || i.circuits === '' ? 1 : Number(i.circuits);
  const ground = isGroundMethod(method);

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

  const { table, ref: tabRef, dsId } = ampacityTable(lookup, { insulation, method, material, loadedCores });
  useRef(r, tabRef);

  if (!table || !Object.keys(table).length) {
    missing(r, `tabuľka Iz pre ${insulation} / ${material} / spôsob ${method} / ${loadedCores} zaťažené žily`);
    note(r, `Pre túto kombináciu nemám tabuľkovú hodnotu. Nevymýšľam ju — doplň ju v Overenie dát (dataset ${dsId}).`);
    r.sections = [];
    return r;
  }
  r.sections = availableSections(table);

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
    // čítame cez lookup, aby fungovala aj používateľská úprava jedinej hodnoty
    const baseGot = lookup.get(dsId, [method, material, String(loadedCores), String(sNum)]);
    const base = baseGot.missing ? undefined : baseGot.value;
    if (!baseGot.missing) useRef(r, baseGot.ref);
    if (base === undefined) {
      missing(r, `Iz pre prierez ${sNum} mm² v tejto tabuľke`);
      note(r, `Prierez ${sNum} mm² nie je v tabuľke. Dostupné: ${r.sections.join(', ')} mm².`);
      return r;
    }
    const kt = kT.factor ?? 1;
    const kg = kG.factor ?? 1;
    const iz = base * kt * kg;

    step(r, 'Tabuľková zaťažiteľnosť',
      `Iz_tab (${insulation}, ${material}, ${method}, ${loadedCores} žily, ${sNum} mm²)`,
      baseGot.ref?.overridden ? 'ručne upravená hodnota' : '—', `${fmt(base, 1)} A`,
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

/** Iz pre všetky prierezy v tabuľke — pre rýchlu tabuľku a návrh. */
export function ampacityAll(i, lookup) {
  const probe = ampacity({ ...i, S: undefined }, lookup);
  const insulation = i.insulation || 'PVC';
  const method = i.method || 'B2';
  const material = i.material || 'Cu';
  const loadedCores = i.loadedCores === 3 ? 3 : 2;
  const dsId = DATASET_BY_INSULATION[insulation];
  const out = [];
  for (const S of probe.sections || []) {
    // cez lookup, aby platili používateľské úpravy jednotlivých hodnôt
    const got = lookup.get(dsId, [method, material, String(loadedCores), String(S)]);
    if (got.missing) continue;
    out.push({ S, izTable: got.value, iz: got.value * (probe.kTemp ?? 1) * (probe.kGroup ?? 1) });
  }
  return { list: out, probe };
}
