/**
 * Hlavná kalkulačka — režimy A, B, C, D a návrhy opráv.
 */

import {
  SQRT3, newResult, step, useRef, addDefault, note, check, missing, round, fmt, num,
  cosPhi as vCos, safely, largestRatingUpTo, smallestRatingAtLeast, resistancePerM,
} from './core.js';
import { ampacity, ampacityAll, isGroundMethod } from './ampacity.js';
import { voltageDrop, maxLengthByDrop, phaseFactor } from './voltdrop.js';
import {
  currentFromPower, coordination, maxRatingForCable, deviceFamily, disconnectOptions,
  zsMax, loopImpedancePerM, shortCircuitK, requiredDisconnectTime, faultLoopCheck,
  peCrossSection, neutralAdvice, selectivity, materialWarnings, minSectionForShortCircuit,
} from './protection.js';
import { dsI2, dsDropLimit } from '../data/norms.js';

/* ───────────────── spoločné vstupy ───────────────── */

export function resolveLoad(i, lookup, r) {
  const phases = Number(i.phases) === 3 ? 3 : 1;
  let U = i.U;
  if (U === undefined || U === '' || U === null) {
    U = phases === 3 ? 400 : 230;
    addDefault(r, 'napätie', `${U} V`, `nezadané — predvolené pre ${phases}f`);
  }
  U = num(U, 'napätie', { min: 1, max: 100000 });

  const cosGiven = !(i.cos === undefined || i.cos === '' || i.cos === null);
  const cos = cosGiven ? vCos(i.cos) : 1;
  if (!cosGiven) addDefault(r, 'cos φ', '1,00', 'nezadaný — čisto odporová záťaž');

  const divGiven = !(i.diversity === undefined || i.diversity === '' || i.diversity === null);
  const diversity = divGiven ? num(i.diversity, 'súčasnosť', { min: 0.01, max: 1 }) : 1;
  if (!divGiven) addDefault(r, 'súčasnosť', '1,00', 'nezadaná — počítam s plnou záťažou');

  let Ib;
  if (i.loadMode === 'current' || (i.current !== undefined && i.current !== '' && i.current !== null && !i.power)) {
    Ib = num(i.current, 'prúd záťaže', { min: 0.01, max: 10000 }) * diversity;
    step(r, 'Prúd záťaže', 'Ib = I_zadané · súčasnosť',
      `${fmt(num(i.current, 'prúd'), 2)} · ${fmt(diversity, 2)}`, `${fmt(Ib, 2)} A`);
  } else {
    const kW = num(i.power, 'výkon', { min: 0.001, max: 100000 });
    Ib = currentFromPower({ powerW: kW * 1000, phases, U, cos }) * diversity;
    step(r, 'Prúd záťaže',
      phases === 3 ? 'Ib = P / (√3 · U · cos φ) · súčasnosť' : 'Ib = P / (U · cos φ) · súčasnosť',
      `${fmt(kW * 1000, 0)} / (${phases === 3 ? '√3 · ' : ''}${fmt(U, 0)} · ${fmt(cos, 3)}) · ${fmt(diversity, 2)}`,
      `${fmt(Ib, 2)} A`);
  }
  return { Ib, phases, U, cos, diversity };
}

export function resolveDropLimit(i, lookup, r) {
  if (i.limitPercent !== undefined && i.limitPercent !== '' && i.limitPercent !== null) {
    return { limit: num(i.limitPercent, 'povolený úbytok', { min: 0.1, max: 50 }), ref: null };
  }
  const country = i.country || 'DE';
  const kind = i.circuitPurpose || 'power';
  const got = lookup.get(dsDropLimit(kind), [country, kind]);
  useRef(r, got.ref);
  if (got.missing) {
    missing(r, `povolený úbytok napätia pre ${country}/${kind}`);
    return { limit: undefined, ref: got.ref };
  }
  addDefault(r, 'povolený úbytok napätia', `${got.value} %`,
    `z dát pre ${country === 'DE' ? 'Nemecko (VDE)' : 'Slovensko (STN)'}, typ obvodu "${kind}" — v Nemecku si limit môže určiť prevádzkovateľ v TAB`);
  return { limit: got.value, ref: got.ref };
}

/* ───────────────── maximálne dĺžky ───────────────── */

/**
 * Tri samostatné maximálne dĺžky. Vracia aj to, čo dĺžku obmedzuje.
 */
export function maxLengths(i, lookup, r = newResult('Maximálna dĺžka')) {
  const { S, material, insulation, device, In, netType = 'TN-C-S' } = i;
  const phases = Number(i.phases) === 3 ? 3 : 1;
  const U = i.U || (phases === 3 ? 400 : 230);
  const cos = i.cos === undefined || i.cos === '' ? 1 : vCos(i.cos);
  const I = i.I !== undefined && i.I !== '' ? num(i.I, 'prúd') : In;

  const kap = lookup.get('conductivity', [material]);
  const cf = lookup.get('faultLoop', ['cFactor']);
  useRef(r, kap.ref);
  useRef(r, cf.ref);
  const kappa = kap.value;
  const c = i.c ?? cf.value;
  const U0 = i.U0 ?? 230;
  const Spe = i.Spe || peCrossSection(lookup, S, material).Spe;
  const zPerM = loopImpedancePerM({ kappa, S, Spe });

  let Ze = i.Ze;
  if (Ze === undefined || Ze === '' || Ze === null) {
    const zeDef = lookup.get('faultLoop', ['defaultZe']);
    useRef(r, zeDef.ref);
    Ze = zeDef.value;
    addDefault(r, 'Ze na začiatku obvodu', `${fmt(Ze, 2)} Ω`, 'nezadané — PREDVOLENÝ ODHAD, nameraj Ze');
  } else {
    Ze = num(Ze, 'Ze', { min: 0, max: 1000, allowZero: true });
  }

  /* 1. podľa úbytku napätia */
  const lim = resolveDropLimit(i, lookup, r);
  let byDrop = { L: undefined };
  if (lim.limit !== undefined) {
    const xPerM = i.xPerM ?? lookup.get('reactance', ['default']).value;
    const L = maxLengthByDrop({ phases, U, I, S, kappa, cos, xPerM, limitPercent: lim.limit });
    byDrop = { L, limit: lim.limit, formula: `L = (ΔU% / 100 · U) / (${phases === 3 ? '√3' : '2'} · I · (R′·cos φ + X′·sin φ))` };
    step(r, 'Max. dĺžka podľa úbytku napätia', byDrop.formula,
      `(${lim.limit}/100 · ${fmt(U, 0)}) / (${phases === 3 ? '√3' : '2'} · ${fmt(I, 2)} · ${resistancePerM(kappa, S).toExponential(4)}·${fmt(cos, 2)})`,
      `${fmt(L, 1)} m`);
  }

  /* 2. podľa odpojenia poruchy */
  const req = requiredDisconnectTime(lookup, { netType, circuitKind: i.circuitKind, In });
  useRef(r, req.ref);
  const opts = disconnectOptions({ device, In, maxTime: req.t, iaManual: i.iaManual }, lookup);
  opts.refs.forEach((x) => useRef(r, x));

  let byDisconnect = { L: undefined };
  const optionResults = [];
  if (opts.missing) {
    missing(r, opts.missing);
  } else {
    for (const o of opts.options) {
      const zm = zsMax({ c, U0, Ia: o.ia });
      const La = (zm - Ze) / zPerM;
      optionResults.push({ ...o, zsMax: zm, La });
    }
    const best = optionResults.reduce((a, b) => (a && a.La > b.La ? a : b), null);
    byDisconnect = { L: best ? best.La : undefined, option: best };
    if (best) {
      step(r, 'Max. dovolená Zs', 'Zs_max = c · U0 / Ia',
        `${fmt(c, 2)} · ${fmt(U0, 0)} / ${fmt(best.ia, 0)}`, `${fmt(best.zsMax, 3)} Ω`, best.src);
      step(r, 'Max. dĺžka podľa odpojenia poruchy', 'L = (Zs_max − Ze) / z′',
        `(${fmt(best.zsMax, 3)} − ${fmt(Ze, 3)}) / ${zPerM.toExponential(4)}`,
        `${fmt(best.La, 1)} m`);
      if (best.La <= 0) note(r, `Zs_max (${fmt(best.zsMax, 3)} Ω) je menšia než samotná Ze (${fmt(Ze, 3)} Ω) — istenie nevypne ani pri nulovej dĺžke kábla.`);
    }
  }

  /* 3. podľa skratovej odolnosti */
  const kk = shortCircuitK(lookup, { material, insulation, S });
  useRef(r, kk.ref);
  let byShort = { L: undefined };
  if (kk.missing) {
    missing(r, `súčiniteľ k pre ${material}/${insulation}`);
  } else if (optionResults.length) {
    const k = kk.value;
    const k2s2 = k * k * S * S;
    const valid = [];
    for (const o of optionResults) {
      // kábel znesie prúd len do Ik_max = k·S/√t  →  Zs musí byť aspoň c·U0·√t/(k·S)
      const ikMax = (k * S) / Math.sqrt(o.t);
      const zsMin = (c * U0) / ikMax;
      const lMin = (zsMin - Ze) / zPerM;
      valid.push({ ...o, ikMax, lMin, feasible: o.La >= Math.max(0, lMin) });
    }
    const feas = valid.filter((v) => v.feasible);
    const lMinNeeded = Math.max(0, ...valid.map((v) => v.lMin));
    if (!feas.length) {
      byShort = { L: 0, impossible: true, lMin: lMinNeeded, k, k2s2 };
      note(r, `Kábel ${S} mm² ${material}/${insulation} neodolá skratu pri tomto istení pri žiadnej dĺžke: aby istenie vypínalo, treba Ik ≥ ${fmt(valid[0].ia, 0)} A, ale kábel znesie najviac ${fmt(valid[0].ikMax, 0)} A počas ${fmt(valid[0].t, 2)} s. Potrebný minimálny prierez: ${fmt(minSectionForShortCircuit({ k, Ik: valid[0].ia, t: valid[0].t }), 2)} mm².`);
    } else {
      const best = feas.reduce((a, b) => (a.La > b.La ? a : b));
      byShort = { L: best.La, k, k2s2, limiting: false, lMin: Math.max(0, best.lMin) };
      step(r, 'Energia, ktorú kábel znesie', 'k² · S²', `${k}² · ${S}²`, `${fmt(k2s2, 0)} A²s`,
        `${kk.ref.standard} — ${kk.ref.table}`);
      step(r, 'Max. dĺžka podľa skratovej odolnosti', 'najdlhšia dĺžka, pri ktorej ešte platí k²·S² ≥ Ik²·t',
        `Ik ≤ k·S/√t = ${fmt(best.ikMax, 0)} A pri t = ${fmt(best.t, 2)} s`,
        `${fmt(best.La, 1)} m`);
      if (best.lMin > 0.5) {
        note(r, `POZOR na krátke trasy: pri dĺžke pod ${fmt(best.lMin, 1)} m je skratový prúd taký veľký, že kábel ${S} mm² neznesie energiu za ${fmt(best.t, 2)} s. Skratová odolnosť je najkritickejšia na začiatku obvodu.`);
        byShort.shortWarning = best.lMin;
      }
      if (Math.abs(best.La - (byDisconnect.L ?? best.La)) < 0.01) {
        byShort.limiting = false;
        byShort.sameAsDisconnect = true;
      }
    }
  }

  const candidates = [
    { key: 'drop', label: 'úbytok napätia', L: byDrop.L },
    { key: 'disconnect', label: 'odpojenie poruchy', L: byDisconnect.L },
    { key: 'short', label: 'skratová odolnosť', L: byShort.L },
  ].filter((x) => x.L !== undefined && Number.isFinite(x.L));

  let final = null;
  if (candidates.length) {
    final = candidates.reduce((a, b) => (a.L <= b.L ? a : b));
  }

  r.byDrop = byDrop;
  r.byDisconnect = byDisconnect;
  r.byShort = byShort;
  r.maxLength = final ? Math.max(0, final.L) : undefined;
  r.limitedBy = final ? final.label : undefined;
  r.limitedKey = final ? final.key : undefined;
  r.candidates = candidates;
  r.zPerM = zPerM;
  r.Spe = Spe;

  if (final) {
    r.value = round(Math.max(0, final.L), 1);
    r.unit = 'm';
    r.headline = final.L <= 0
      ? `Nevyhovuje ani pri nulovej dĺžke — obmedzuje: ${final.label}`
      : `Max. ${fmt(final.L, 1)} m — obmedzuje: ${final.label}`;
    if (final.L <= 0) check(r, 'Existuje vyhovujúca dĺžka', false, `obmedzuje ${final.label}`,
      'S týmto istením to nevyjde pri žiadnej dĺžke');
  } else {
    missing(r, 'nedá sa určiť žiadna z troch maximálnych dĺžok');
  }
  if (byShort.impossible) check(r, 'Skratová odolnosť kábla', false, 'kábel neodolá skratu pri tomto istení',
    'Kábel nevydrží skrat — treba väčší prierez');

  return r;
}

/* ───────────────── REŽIM A: mám záťaž a dĺžku ───────────────── */

export function modeA(i, lookup) {
  return safely('Režim A — návrh prierezu a istenia', (r) => {
    const load = resolveLoad(i, lookup, r);
    const L = num(i.L, 'dĺžka', { min: 0.1, max: 100000 });
    const device = i.device || 'B';
    const material = i.material || 'Cu';
    const insulation = i.insulation || 'PVC';
    const method = i.method || 'B2';
    const loadedCores = i.loadedCores ?? (load.phases === 3 ? 3 : 2);

    const ratings = lookup.get('breakerRatings', [deviceFamily(device)]);
    useRef(r, ratings.ref);
    if (ratings.missing) { missing(r, 'rad menovitých hodnôt istenia'); return r; }

    const In = smallestRatingAtLeast(ratings.value, load.Ib);
    if (In === null) {
      r.status = 'fail';
      const maxIn = ratings.value[ratings.value.length - 1];
      r.headline = `Spotrebič berie ${fmt(load.Ib, 0)} A — to je viac, než zvládne najväčší istič ${device} (${maxIn} A).`;
      note(r, 'Rozdeľ záťaž na viac obvodov alebo použi istenie z vyššieho radu (NH).');
      r.fixes = [
        {
          label: `Rozdeliť záťaž na ${Math.ceil(load.Ib / maxIn)} obvody`,
          ok: true,
          result: `Na každý obvod by vyšlo cca ${fmt(load.Ib / Math.ceil(load.Ib / maxIn), 1)} A.`,
          detail: 'Najjednoduchšie riešenie, ak sa dá záťaž rozdeliť (napr. viac vývodov v rozvádzači).',
        },
        {
          label: 'Použiť istenie NH (väčší rad)',
          ok: null,
          result: `Rad NH ide do ${lookup.get('breakerRatings', ['nh']).value?.slice(-1)[0] ?? '—'} A.`,
          detail: 'Prepni typ istenia na NH a výpočet zopakuj. Pozor: NH má I2 = 1,6·In, takže potrebuje väčšiu Iz.',
        },
        ...(load.phases === 1
          ? [{
            label: 'Previesť obvod na 3f 400 V',
            ok: null,
            result: `Pri 3f klesne prúd cca na ${fmt(load.Ib / SQRT3, 1)} A.`,
            detail: 'Vyžaduje 5-žilový kábel a rozdelenie záťaže na fázy.',
          }]
          : []),
        {
          label: 'Zvýšiť napätie / použiť prívod z vyššej úrovne',
          ok: null,
          result: 'Pri takomto prúde už ide o prívod, nie o koncový obvod — rieš to ako NN prípojku alebo rozvádzač.',
          detail: 'Nad niekoľko stoviek ampér to prestáva byť úloha pre koncový obvod.',
        },
      ];
      return r;
    }
    step(r, 'Menovitý prúd istenia', 'In = najbližší rad ≥ Ib',
      `${fmt(load.Ib, 2)} A → ${In} A`, `${In} A ${device}`);

    const all = ampacityAll({ insulation, method, material, loadedCores, ambient: i.ambient, circuits: i.circuits, groupingType: i.groupingType, country: i.country }, lookup);
    (all.probe.refs || []).forEach((x) => useRef(r, x));
    all.probe.defaults.forEach((d) => r.defaults.push(d));
    if (!all.list.length) {
      missing(r, `tabuľka Iz pre ${insulation}/${material}/${method}/${loadedCores} žily`);
      note(r, 'Pre túto kombináciu nemám tabuľkové hodnoty — nevymýšľam ich. Doplň ich v časti Tabuľky a hodnoty.');
      return r;
    }

    const lim = resolveDropLimit(i, lookup, r);
    const i2 = lookup.get(dsI2(device), [device]);
    useRef(r, i2.ref);
    const izNeeded = Math.max(In, (i2.value ? i2.value / 1.45 : 1) * In);

    /* voliteľné minimum prierezu — napr. zaužívaných 2,5 mm² na zásuvky */
    const minS = i.minSection === undefined || i.minSection === '' || i.minSection === null
      ? 0 : num(i.minSection, 'minimálny prierez', { min: 0.1, max: 1000 });

    const tried = [];
    let chosen = null;
    for (const row of all.list) {
      if (row.S < minS) {
        tried.push({ S: row.S, iz: row.iz, izTable: row.izTable, reasons: [`pod zvoleným minimom ${fmt(minS, 1)} mm²`] });
        continue;
      }
      const reasons = [];
      if (row.iz < izNeeded - 1e-9) reasons.push(`Iz ${fmt(row.iz, 1)} A < potrebných ${fmt(izNeeded, 1)} A`);

      let dropR = null;
      if (lim.limit !== undefined) {
        dropR = voltageDrop({ phases: load.phases, U: load.U, I: load.Ib, L, S: row.S, material, cos: load.cos, xPerM: i.xPerM, limitPercent: lim.limit }, lookup, newResult());
        if (dropR.percent > lim.limit + 1e-9) reasons.push(`úbytok ${fmt(dropR.percent, 2)} % > ${lim.limit} %`);
      }

      let loopR = null;
      if (!reasons.length) {
        loopR = faultLoopCheck({ S: row.S, material, insulation, device, In, L, netType: i.netType, Ze: i.Ze, Zs: i.Zs, U0: i.U0, c: i.c, circuitKind: i.circuitKind, iaManual: i.iaManual }, lookup, newResult());
        if (loopR.status === 'fail') reasons.push('nevyhovuje odpojenie poruchy alebo skratová odolnosť');
      }

      tried.push({ S: row.S, iz: row.iz, izTable: row.izTable, reasons, drop: dropR?.percent, loop: loopR });
      if (!reasons.length) { chosen = { ...row, drop: dropR, loop: loopR }; break; }
    }

    r.tried = tried;
    r.In = In;
    r.device = device;
    r.Ib = load.Ib;
    r.izNeeded = izNeeded;

    if (!chosen) {
      r.status = 'fail';
      r.headline = 'Žiadny prierez z tabuľky nevyhovuje všetkým podmienkam.';
      note(r, `Najväčší dostupný prierez ${all.list[all.list.length - 1].S} mm² stále nevyhovuje. Dôvod: ${tried[tried.length - 1].reasons.join('; ')}`);
      r.fixes = buildFixes(i, lookup, { load, L, In, device, material, insulation, method, loadedCores, lim });
      return r;
    }

    useRef(r, chosen.ref);
    step(r, 'Zvolený prierez', 'najmenší S, ktorý splní Iz, úbytok, odpojenie aj skrat',
      `Iz = ${fmt(chosen.iz, 1)} A ≥ ${fmt(izNeeded, 1)} A`, `${chosen.S} mm²`);

    /* zlúčenie kontrol zo sub-výsledkov */
    const coord = coordination({ Ib: load.Ib, In, Iz: chosen.iz, device }, lookup, newResult());
    mergeChecks(r, coord);
    if (chosen.drop) mergeChecks(r, chosen.drop);
    if (chosen.loop) mergeChecks(r, chosen.loop);

    const pe = peCrossSection(lookup, chosen.S, material);
    useRef(r, pe.ref);
    const nAdv = neutralAdvice(lookup, { S: chosen.S, phases: load.phases, thd: i.thd });
    useRef(r, nAdv.ref);
    if (nAdv.assumed && load.phases === 3) {
      addDefault(r, 'podiel 3. harmonickej', 'do 15 %', 'nezadaný — bez zvýšenia prúdu v N');
    }
    const mw = materialWarnings(lookup, { material, country: i.country || 'DE', S: chosen.S });
    useRef(r, mw.ref);
    mw.warnings.forEach((w) => note(r, w));

    const sel = selectivity({ In, InUp: i.InUp, device, deviceUp: i.deviceUp || device });

    r.chosen = {
      S: chosen.S,
      In,
      device,
      iz: chosen.iz,
      izTable: chosen.izTable,
      dropPercent: chosen.drop?.percent,
      dropVolts: chosen.drop?.value,
      Spe: pe.Spe,
      peRule: pe.rule,
      Zs: chosen.loop?.Zs,
      Ik: chosen.loop?.Ik,
      tripTime: chosen.loop?.tripTime,
      tPerm: chosen.loop?.tPerm,
      zsMax: chosen.loop?.zsMax,
      neutral: nAdv.text,
      selectivity: sel,
    };
    r.value = chosen.S;
    r.unit = 'mm²';
    r.headline = `${material} ${fmt(chosen.S, 2)} mm² + ${device}${In} A — úbytok ${fmt(chosen.drop?.percent ?? 0, 2)} %, Iz ${fmt(chosen.iz, 1)} A`;
    note(r, `PE: ${fmt(pe.Spe, 1)} mm² (pravidlo ${pe.rule}).`);
    if (nAdv.text) note(r, nAdv.text);
    if (sel) note(r, sel.text);

    /* aj keď vyhovuje, ponúkni alternatívy */
    r.fixes = buildFixes(i, lookup, { load, L, In, device, material, insulation, method, loadedCores, lim }, chosen.S);
    return r;
  });
}

function mergeChecks(target, src) {
  (src.checks || []).forEach((c) => {
    target.checks.push(c);
    if (c.ok === false) target.status = 'fail';
    else if (c.ok === null && target.status === 'ok') target.status = 'warn';
  });
  (src.refs || []).forEach((x) => useRef(target, x));
  (src.missing || []).forEach((m) => missing(target, m));
  (src.notes || []).forEach((n) => note(target, n));
  (src.defaults || []).forEach((d) => {
    if (!target.defaults.some((x) => x.what === d.what)) target.defaults.push(d);
  });
  (src.steps || []).forEach((s) => target.steps.push(s));
}

/* ───────────────── REŽIM B: mám kábel → aké istenie ───────────────── */

export function modeB(i, lookup) {
  return safely('Režim B — najväčšie istenie pre daný kábel', (r) => {
    const S = num(i.S, 'prierez', { min: 0.1, max: 1000 });
    const device = i.device || 'B';
    const material = i.material || 'Cu';
    const insulation = i.insulation || 'PVC';
    const method = i.method || 'B2';
    const phases = Number(i.phases) === 3 ? 3 : 1;
    const loadedCores = i.loadedCores ?? (phases === 3 ? 3 : 2);

    const amp = ampacity({ S, material, insulation, method, loadedCores, ambient: i.ambient, circuits: i.circuits, groupingType: i.groupingType, country: i.country }, lookup, newResult());
    mergeChecks(r, amp);
    if (amp.iz === undefined) {
      r.headline = 'Chýba tabuľková hodnota Iz pre túto kombináciu.';
      return r;
    }

    const mx = maxRatingForCable({ Iz: amp.iz, device }, lookup);
    mx.refs.forEach((x) => useRef(r, x));
    if (!mx.In) {
      r.status = 'fail';
      r.headline = `Kábel ${S} mm² (Iz = ${fmt(amp.iz, 1)} A) neunesie ani najmenšie istenie z radu.`;
      return r;
    }
    step(r, 'Limit pre istenie', 'In ≤ min(Iz ; 1,45·Iz / (I2/In))',
      `min(${fmt(amp.iz, 2)} ; ${fmt(mx.limit, 2)})`, `${fmt(mx.limit, 2)} A`);
    step(r, 'Najväčšie menovité istenie', 'najbližší rad ≤ limit',
      `${fmt(mx.limit, 2)} A → ${mx.In} A`, `${device}${mx.In} A`);

    const coord = coordination({ Ib: i.Ib ? num(i.Ib, 'Ib') : 0, In: mx.In, Iz: amp.iz, device }, lookup, newResult());
    mergeChecks(r, coord);

    r.iz = amp.iz;
    r.In = mx.In;
    r.value = mx.In;
    r.unit = 'A';
    r.headline = `Najviac ${device}${mx.In} A pri Iz = ${fmt(amp.iz, 1)} A`;

    if (i.L) {
      const ml = maxLengths({ ...i, S, In: mx.In, device, material, insulation, phases, I: i.Ib || mx.In }, lookup, newResult());
      mergeChecks(r, ml);
      r.maxLength = ml.maxLength;
      r.limitedBy = ml.limitedBy;
      const Lgiven = num(i.L, 'dĺžka', { min: 0.1 });
      if (ml.maxLength !== undefined) {
        check(r, `Zadaná dĺžka ${fmt(Lgiven, 1)} m je v limite`, Lgiven <= ml.maxLength,
          `max ${fmt(ml.maxLength, 1)} m (obmedzuje ${ml.limitedBy})`,
          Lgiven <= ml.maxLength
            ? `Dĺžka ${fmt(Lgiven, 0)} m je v poriadku — najviac ${fmt(ml.maxLength, 0)} m`
            : `Dĺžka ${fmt(Lgiven, 0)} m je priveľa — najviac ${fmt(ml.maxLength, 0)} m`);
      }
    }
    return r;
  });
}

/* ───────────────── REŽIM C: mám kábel a istenie → do akej dĺžky ───────────────── */

export function modeC(i, lookup) {
  return safely('Režim C — do akej dĺžky to vyhovuje', (r) => {
    const S = num(i.S, 'prierez', { min: 0.1, max: 1000 });
    const In = num(i.In, 'menovité istenie', { min: 1, max: 10000 });
    const device = i.device || 'B';
    const material = i.material || 'Cu';
    const insulation = i.insulation || 'PVC';
    const method = i.method || 'B2';
    const phases = Number(i.phases) === 3 ? 3 : 1;
    const loadedCores = i.loadedCores ?? (phases === 3 ? 3 : 2);

    /* najprv overenie, že kábel vôbec unesie toto istenie */
    const amp = ampacity({ S, material, insulation, method, loadedCores, ambient: i.ambient, circuits: i.circuits, groupingType: i.groupingType, country: i.country }, lookup, newResult());
    mergeChecks(r, amp);
    if (amp.iz !== undefined) {
      const coord = coordination({ Ib: i.current ? num(i.current, 'Ib') : 0, In, Iz: amp.iz, device }, lookup, newResult());
      mergeChecks(r, coord);
      r.iz = amp.iz;
    }

    const I = i.current !== undefined && i.current !== '' && i.current !== null
      ? num(i.current, 'prúd záťaže', { min: 0.01 })
      : In;
    if (i.current === undefined || i.current === '' || i.current === null) {
      addDefault(r, 'prúd pre úbytok napätia', `${In} A`, 'nezadaný prúd záťaže — počítam s plným menovitým prúdom istenia (najhorší prípad)');
    }

    const ml = maxLengths({ ...i, S, In, device, material, insulation, phases, I }, lookup, newResult());
    mergeChecks(r, ml);

    r.byDrop = ml.byDrop;
    r.byDisconnect = ml.byDisconnect;
    r.byShort = ml.byShort;
    r.maxLength = ml.maxLength;
    r.limitedBy = ml.limitedBy;
    r.limitedKey = ml.limitedKey;
    r.value = ml.value;
    r.unit = 'm';
    r.headline = r.status === 'fail' && ml.maxLength !== undefined
      ? `${ml.headline} — ale samotná kombinácia kábla a istenia nevyhovuje (pozri kontroly)`
      : ml.headline;

    if (i.L !== undefined && i.L !== '' && i.L !== null && ml.maxLength !== undefined) {
      const Lg = num(i.L, 'dĺžka', { min: 0.1 });
      check(r, `Plánovaná dĺžka ${fmt(Lg, 1)} m`, Lg <= ml.maxLength,
        `max ${fmt(ml.maxLength, 1)} m (obmedzuje ${ml.limitedBy})`,
        Lg <= ml.maxLength
          ? `Dĺžka ${fmt(Lg, 0)} m je v poriadku — najviac ${fmt(ml.maxLength, 0)} m`
          : `Dĺžka ${fmt(Lg, 0)} m je priveľa — najviac ${fmt(ml.maxLength, 0)} m`);
      r.plannedLength = Lg;
    }

    if (r.status === 'fail' || (ml.maxLength !== undefined && i.L && num(i.L, 'd') > ml.maxLength)) {
      const load = { Ib: I, phases, U: i.U || (phases === 3 ? 400 : 230), cos: i.cos === undefined || i.cos === '' ? 1 : vCos(i.cos) };
      r.fixes = buildFixes(i, lookup, { load, L: i.L ? num(i.L, 'd') : ml.maxLength, In, device, material, insulation, method, loadedCores, lim: resolveDropLimit(i, lookup, newResult()) }, S);
    }
    return r;
  });
}

/* ───────────────── REŽIM D: rýchla tabuľka ───────────────── */

export function modeD(i, lookup) {
  return safely('Režim D — rýchla tabuľka', (r) => {
    const device = i.device || 'B';
    const material = i.material || 'Cu';
    const insulation = i.insulation || 'PVC';
    const method = i.method || 'B2';
    const phases = Number(i.phases) === 3 ? 3 : 1;
    const loadedCores = i.loadedCores ?? (phases === 3 ? 3 : 2);

    const all = ampacityAll({ insulation, method, material, loadedCores, ambient: i.ambient, circuits: i.circuits, groupingType: i.groupingType, country: i.country }, lookup);
    (all.probe.refs || []).forEach((x) => useRef(r, x));
    all.probe.defaults.forEach((d) => r.defaults.push(d));
    if (!all.list.length) {
      missing(r, `tabuľka Iz pre ${insulation}/${material}/${method}`);
      return r;
    }

    const rows = [];
    for (const row of all.list) {
      useRef(r, row.ref);
      const mx = maxRatingForCable({ Iz: row.iz, device }, lookup);
      mx.refs.forEach((x) => useRef(r, x));
      let lengths = null;
      if (mx.In) {
        const ml = maxLengths({ ...i, S: row.S, In: mx.In, device, material, insulation, phases, I: mx.In }, lookup, newResult());
        (ml.refs || []).forEach((x) => useRef(r, x));
        (ml.missing || []).forEach((m) => missing(r, m));
        lengths = {
          drop: ml.byDrop?.L,
          disconnect: ml.byDisconnect?.L,
          short: ml.byShort?.L,
          max: ml.maxLength,
          limitedBy: ml.limitedBy,
        };
      }
      rows.push({ S: row.S, izTable: row.izTable, iz: row.iz, In: mx.In, lengths });
    }
    r.rows = rows;
    r.headline = `${material} ${insulation}, uloženie ${method}, ${loadedCores} zaťažené žily, ${phases}f`;
    r.kTemp = all.probe.kTemp;
    r.kGroup = all.probe.kGroup;
    return r;
  });
}

/* ───────────────── návrhy opráv s prepočtom ───────────────── */

export function buildFixes(i, lookup, ctx, currentS) {
  const { load, L, In, device, material, insulation, method, loadedCores, lim } = ctx;
  const fixes = [];
  const base = { ...i, loadedCores, material, insulation };

  /* väčší prierez */
  const all = ampacityAll({ insulation, method, material, loadedCores, ambient: i.ambient, circuits: i.circuits, groupingType: i.groupingType, country: i.country }, lookup);
  const bigger = all.list.filter((x) => !currentS || x.S > currentS).slice(0, 3);
  for (const b of bigger) {
    const d = lim.limit !== undefined
      ? voltageDrop({ phases: load.phases, U: load.U, I: load.Ib, L, S: b.S, material, cos: load.cos, xPerM: i.xPerM, limitPercent: lim.limit }, lookup, newResult())
      : null;
    const loop = faultLoopCheck({ S: b.S, material, insulation, device, In, L, netType: i.netType, Ze: i.Ze, Zs: i.Zs, circuitKind: i.circuitKind, iaManual: i.iaManual }, lookup, newResult());
    const ok = b.iz >= In && (!d || d.percent <= lim.limit) && loop.status !== 'fail';
    fixes.push({
      label: `Zväčšiť prierez na ${b.S} mm²`,
      ok,
      result: `Iz = ${fmt(b.iz, 1)} A${d ? `, úbytok ${fmt(d.percent, 2)} %` : ''}, Zs = ${fmt(loop.Zs, 3)} Ω, Ik = ${fmt(loop.Ik, 0)} A`,
      detail: ok ? 'Vyhovuje.' : 'Stále nevyhovuje.',
    });
  }

  /* iná charakteristika istenia */
  for (const dev of ['B', 'C', 'D'].filter((x) => x !== device)) {
    if (deviceFamily(device) !== 'mcb') continue;
    const S = currentS || all.list[0]?.S;
    if (!S) continue;
    const loop = faultLoopCheck({ S, material, insulation, device: dev, In, L, netType: i.netType, Ze: i.Ze, Zs: i.Zs, circuitKind: i.circuitKind }, lookup, newResult());
    fixes.push({
      label: `Zmeniť charakteristiku na ${dev}${In} A`,
      ok: loop.status !== 'fail',
      result: `Ia = ${fmt(loop.Ia, 0)} A, Zs_max = ${fmt(loop.zsMax, 3)} Ω, Zs = ${fmt(loop.Zs, 3)} Ω`,
      detail: dev === 'B'
        ? 'B vypína pri najmenšom násobku — najlepšie pre dlhé trasy. Pozor na spínacie prúdy (LED, trafá, motory).'
        : dev === 'D'
          ? 'D potrebuje najväčší skratový prúd — na dlhé trasy je najhoršie.'
          : 'C je kompromis pre záťaže so spínacím prúdom.',
    });
  }

  /* RCD */
  fixes.push({
    label: 'Pridať RCD 30 mA',
    ok: null,
    result: 'RCD rieši ochranu pri poruche aj tam, kde Ik nestačí na vypnutie ističa.',
    detail: 'RCD ale NERIEŠI preťaženie ani skratovú odolnosť kábla. Ak nevyhovuje úbytok napätia alebo k²S², RCD nepomôže. V TT sieti je RCD prakticky povinný.',
  });

  /* zmena uloženia */
  const better = { A1: 'B1', A2: 'B2', B1: 'C', B2: 'C', C: 'E', D1: 'D2', E: 'E', D2: 'D2', F: 'F' }[method];
  if (better && better !== method) {
    const alt = ampacityAll({ insulation, method: better, material, loadedCores, ambient: i.ambient, circuits: i.circuits, groupingType: i.groupingType, country: i.country }, lookup);
    const row = alt.list.find((x) => x.S === (currentS || alt.list[0]?.S));
    if (row) {
      fixes.push({
        label: `Zmeniť uloženie z ${method} na ${better}`,
        ok: null,
        result: `Iz pre ${row.S} mm² stúpne na ${fmt(row.iz, 1)} A`,
        detail: 'Lepšie chladenie zvýši Iz, ale úbytok napätia ani odpojenie poruchy to nezmení.',
      });
    }
  }

  /* skrátenie trasy */
  if (lim.limit !== undefined && currentS) {
    const kap = lookup.get('conductivity', [material]);
    const lmax = maxLengthByDrop({
      phases: load.phases, U: load.U, I: load.Ib, S: currentS, kappa: kap.value,
      cos: load.cos, xPerM: i.xPerM ?? lookup.get('reactance', ['default']).value, limitPercent: lim.limit,
    });
    fixes.push({
      label: `Skrátiť trasu na ${fmt(lmax, 1)} m`,
      ok: Number.isFinite(lmax),
      result: `Pri ${currentS} mm² a ${fmt(load.Ib, 1)} A je limit úbytku ${lim.limit} % na ${fmt(lmax, 1)} m.`,
      detail: 'Platí len pre úbytok napätia — odpojenie poruchy môže mať iný limit.',
    });
  }

  /* zvýšenie prívodného napätia / prechod na 3f */
  if (load.phases === 1) {
    fixes.push({
      label: 'Previesť obvod na 3f 400 V',
      ok: null,
      result: 'Pri rovnakom výkone klesne prúd cca na 1/√3 a úbytok výrazne klesne.',
      detail: 'Vyžaduje 5-žilový kábel a rovnomerné rozdelenie záťaže na fázy.',
    });
  }

  return fixes;
}
