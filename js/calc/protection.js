/**
 * Istenie, slučková impedancia, čas odpojenia, skratová odolnosť, PE a N.
 */

import { SQRT3, newResult, step, useRef, addDefault, note, check, missing, round, fmt, num, resistancePerM, largestRatingUpTo, smallestRatingAtLeast } from './core.js';
import { dsMagnetic, dsI2, dsDisconnectTime } from '../data/norms.js';

/* ───────────────── záťaž ───────────────── */

/**
 * Prúd záťaže Ib.
 * 1f: I = P / (U · cos φ)        3f: I = P / (√3 · U · cos φ)
 */
export function currentFromPower({ powerW, phases, U, cos = 1, efficiency = 1 }) {
  const d = (phases === 3 ? SQRT3 * U : U) * cos * efficiency;
  return powerW / d;
}

export function powerFromCurrent({ I, phases, U, cos = 1 }) {
  return (phases === 3 ? SQRT3 * U : U) * I * cos;
}

export function apparentPower({ I, phases, U }) {
  return (phases === 3 ? SQRT3 * U : U) * I;
}

/* ───────────────── Ib ≤ In ≤ Iz a I2 ≤ 1,45·Iz ───────────────── */

/**
 * Základná koordinácia istenia a kábla.
 */
export function coordination({ Ib, In, Iz, device }, lookup, r = newResult('Koordinácia istenia')) {
  const i2 = lookup.get(dsI2(device), [device]);
  useRef(r, i2.ref);
  if (i2.missing) {
    missing(r, `súčiniteľ I2/In pre typ istenia ${device}`);
    return r;
  }
  const I2 = i2.value * In;

  const okIb = Ib <= In + 1e-9;
  const okIn = In <= Iz + 1e-9;
  const okI2 = I2 <= 1.45 * Iz + 1e-9;

  step(r, 'Podmienka Ib ≤ In', 'Ib ≤ In', `${fmt(Ib, 2)} ≤ ${fmt(In, 0)}`, okIb ? 'OK' : 'NEVYHOVUJE');
  step(r, 'Podmienka In ≤ Iz', 'In ≤ Iz', `${fmt(In, 0)} ≤ ${fmt(Iz, 2)}`, okIn ? 'OK' : 'NEVYHOVUJE');
  step(r, 'Podmienka I2 ≤ 1,45 · Iz',
    `I2 = ${fmt(i2.value, 2)} · In`,
    `${fmt(I2, 2)} ≤ 1,45 · ${fmt(Iz, 2)} = ${fmt(1.45 * Iz, 2)}`,
    okI2 ? 'OK' : 'NEVYHOVUJE',
    `${i2.ref.standard} — ${i2.ref.table}`);

  check(r, 'Ib ≤ In (istič prenesie záťaž)', okIb, `${fmt(Ib, 2)} A ≤ ${fmt(In, 0)} A`,
    Ib > 0
      ? (okIb ? `Istič ${fmt(In, 0)} A stačí na záťaž ${fmt(Ib, 1)} A` : `Istič ${fmt(In, 0)} A je na záťaž ${fmt(Ib, 1)} A slabý`)
      : false);
  check(r, 'In ≤ Iz (kábel prenesie istenie)', okIn, `${fmt(In, 0)} A ≤ ${fmt(Iz, 2)} A`,
    okIn ? `Kábel unesie ${fmt(Iz, 1)} A — istič má ${fmt(In, 0)} A`
      : `Kábel unesie len ${fmt(Iz, 1)} A — istič ${fmt(In, 0)} A je naň priveľký`);
  check(r, 'I2 ≤ 1,45 · Iz (ochrana pri preťažení)', okI2, `${fmt(I2, 2)} A ≤ ${fmt(1.45 * Iz, 2)} A`,
    okI2 ? false : `Poistka ${fmt(In, 0)} A kábel pri preťažení neochráni — daj menšiu alebo hrubší kábel`);

  if (i2.value > 1.45) {
    note(r, `Poistka ${device} má I2 = ${fmt(i2.value, 2)}·In, preto nestačí In ≤ Iz — potrebuješ In ≤ ${fmt(1.45 / i2.value, 3)} · Iz = ${fmt((1.45 / i2.value) * Iz, 1)} A.`);
  }

  r.I2 = I2;
  r.i2Factor = i2.value;
  return r;
}

/** Najväčšie istenie, ktoré kábel s danou Iz unesie (rešpektuje aj I2). */
export function maxRatingForCable({ Iz, device }, lookup) {
  const i2 = lookup.get(dsI2(device), [device]);
  const ratings = lookup.get('breakerRatings', [deviceFamily(device)]);
  if (i2.missing || ratings.missing) return { In: null, refs: [i2.ref, ratings.ref] };
  const limit = Math.min(Iz, (1.45 / i2.value) * Iz);
  return { In: largestRatingUpTo(ratings.value, limit), limit, refs: [i2.ref, ratings.ref] };
}

export function deviceFamily(device) {
  if (device === 'gG') return 'gG';
  if (device === 'nh') return 'nh';
  return 'mcb';
}

/* ───────────────── odpojenie poruchy ───────────────── */

/**
 * Prúd, pri ktorom istenie odpojí v požadovanom čase.
 * @returns {{ options: Array<{t:number, ia:number, src:string}>, refs:Array, missing:string|null }}
 */
export function disconnectOptions({ device, In, maxTime, iaManual }, lookup) {
  const refs = [];
  if (iaManual) {
    return { options: [{ t: lookup.get('faultLoop', ['instantTripTime']).value, ia: iaManual, src: 'zadané ručne' }], refs, missing: null };
  }
  if (device === 'B' || device === 'C' || device === 'D') {
    const m = lookup.get(dsMagnetic(device), [device, 'multiple']);
    const tInst = lookup.get('faultLoop', ['instantTripTime']);
    refs.push(m.ref, tInst.ref);
    if (m.missing) return { options: [], refs, missing: `násobok Ia pre charakteristiku ${device}` };
    return {
      options: [{ t: tInst.value, ia: m.value * In, src: `${m.value}×In (horná hranica pásma ${lookup.get(dsMagnetic(device), [device, 'range']).value})` }],
      refs,
      missing: null,
    };
  }
  if (device === 'gG' || device === 'nh') {
    const opts = [];
    for (const t of [0.4, 5]) {
      if (maxTime && t > maxTime + 1e-9) continue;
      const g = lookup.get('fuseDisconnectCurrent', ['gG', String(t), String(In)]);
      refs.push(g.ref);
      if (!g.missing) opts.push({ t, ia: g.value, src: `tabuľka gG ${In} A / ${t} s` });
    }
    if (!opts.length) return { options: [], refs, missing: `prúd odpojenia gG ${In} A` };
    return { options: opts, refs, missing: null };
  }
  if (device === 'motor') {
    return { options: [], refs, missing: 'Ia ističa motora (zadaj z katalógu výrobcu — pásmo sa veľmi líši)' };
  }
  return { options: [], refs, missing: `typ istenia ${device}` };
}

/** Maximálna dovolená slučková impedancia: Zs = c · U0 / Ia */
export function zsMax({ c, U0, Ia }) {
  return (c * U0) / Ia;
}

/** Impedancia slučky L+PE na metr [Ω/m]. */
export function loopImpedancePerM({ kappa, S, Spe }) {
  return resistancePerM(kappa, S) + resistancePerM(kappa, Spe || S);
}

/** Maximálny čas, ktorý kábel znesie pri skratovom prúde: t = k²·S² / I² */
export function maxTimeForShortCircuit({ k, S, Ik }) {
  return (k * k * S * S) / (Ik * Ik);
}

/** Minimálny prierez na skratovú odolnosť: S = I·√t / k */
export function minSectionForShortCircuit({ k, Ik, t }) {
  return (Ik * Math.sqrt(t)) / k;
}

/** Súčiniteľ k pre k²S². */
export function shortCircuitK(lookup, { material, insulation, S }) {
  if (insulation === 'PVC' && S > 300) {
    return lookup.get('shortCircuitK', [material, 'PVC_over300']);
  }
  return lookup.get('shortCircuitK', [material, insulation]);
}

/** Maximálny dovolený čas odpojenia podľa siete a typu obvodu. */
export function requiredDisconnectTime(lookup, { netType, circuitKind, In }) {
  const fam = netType.startsWith('TN') ? 'TN' : netType === 'TT' ? 'TT' : 'IT';
  /* krátky čas platí pre zásuvkové obvody do 63 A (pevné do 32 A) — berieme prísnejšiu hranicu */
  const limit = lookup.get('faultLoop', ['finalCircuitMaxA']).value ?? 32;
  const kind = circuitKind || (In <= limit ? 'final' : 'distribution');
  const got = lookup.get(dsDisconnectTime(fam), ['maxTime', fam, kind]);
  return { t: got.value, ref: got.ref, kind, fam, missing: got.missing };
}

/**
 * Kompletná kontrola poruchovej slučky a skratovej odolnosti pre známu dĺžku.
 */
export function faultLoopCheck(i, lookup, r = newResult('Odpojenie poruchy a skrat')) {
  const { S, material, insulation, device, In, L, netType = 'TN-C-S' } = i;
  const Spe = i.Spe || peCrossSection(lookup, S, material).Spe;

  const kap = lookup.get('conductivity', [material]);
  const cf = lookup.get('faultLoop', ['cFactor']);
  useRef(r, kap.ref);
  useRef(r, cf.ref);

  let U0 = i.U0;
  if (U0 === undefined || U0 === '' || U0 === null) {
    U0 = 230;
    addDefault(r, 'U0 (fáza–PE)', '230 V', 'nezadané — predvolené pre sieť 230/400 V');
  }
  let c = i.c;
  if (c === undefined || c === '' || c === null) {
    c = cf.value;
    addDefault(r, 'súčiniteľ c', String(c), `predvolené z dát (${cf.ref.standard})`);
  }

  const req = requiredDisconnectTime(lookup, { netType, circuitKind: i.circuitKind, In });
  useRef(r, req.ref);
  if (req.missing) missing(r, `maximálny čas odpojenia pre sieť ${netType}`);

  const opts = disconnectOptions({ device, In, maxTime: req.t, iaManual: i.iaManual }, lookup);
  opts.refs.forEach((x) => useRef(r, x));
  if (opts.missing) {
    missing(r, opts.missing);
    note(r, 'Bez prúdu odpojenia neviem overiť samočinné odpojenie. Zadaj Ia z katalógu alebo doplň dáta.');
  }

  const zPerM = loopImpedancePerM({ kappa: kap.value, S, Spe });
  let Ze = i.Ze;
  if (Ze === undefined || Ze === '' || Ze === null) {
    if (i.Zs !== undefined && i.Zs !== '' && i.Zs !== null) {
      Ze = null; // použijeme nameranú Zs
    } else {
      const zeDef = lookup.get('faultLoop', ['defaultZe']);
      useRef(r, zeDef.ref);
      Ze = zeDef.value;
      addDefault(r, 'Ze na začiatku obvodu', `${fmt(Ze, 2)} Ω`,
        'nezadané ani namerané — PREDVOLENÝ ODHAD, nameraj Ze alebo Zs, inak je výsledok len orientačný');
      note(r, 'Ze je predvolený odhad. Bez merania Ze alebo Zs sa na overenie odpojenia nespoliehaj.');
    }
  }

  const Zs = i.Zs !== undefined && i.Zs !== '' && i.Zs !== null
    ? num(i.Zs, 'nameraná Zs', { min: 0.001, max: 1000 })
    : Ze + L * zPerM;

  const Ik = (c * U0) / Zs;

  step(r, 'Impedancia slučky na metr', "z′ = 1/(κ·S) + 1/(κ·S_PE)",
    `1/(${kap.value}·${S}) + 1/(${kap.value}·${Spe})`, `${zPerM.toExponential(4)} Ω/m`);
  if (i.Zs !== undefined && i.Zs !== '' && i.Zs !== null) {
    step(r, 'Slučková impedancia', 'Zs = nameraná', `${fmt(Zs, 3)} Ω`, `${fmt(Zs, 3)} Ω`, 'meranie na mieste');
  } else {
    step(r, 'Slučková impedancia', 'Zs = Ze + L · z′',
      `${fmt(Ze, 3)} + ${fmt(L, 1)} · ${zPerM.toExponential(4)}`, `${fmt(Zs, 3)} Ω`);
  }
  step(r, 'Skratový prúd (fáza–PE)', 'Ik = c · U0 / Zs',
    `${fmt(c, 2)} · ${fmt(U0, 0)} / ${fmt(Zs, 3)}`, `${fmt(Ik, 0)} A`);

  r.Zs = Zs;
  r.Ik = Ik;
  r.zPerM = zPerM;
  r.Spe = Spe;
  r.requiredTime = req.t;

  /* samočinné odpojenie */
  let tripped = null;
  let usedOption = null;
  for (const o of opts.options) {
    if (Ik >= o.ia) {
      if (!usedOption || o.t < usedOption.t) usedOption = o;
    }
  }
  if (opts.options.length) {
    if (usedOption) {
      tripped = usedOption.t <= (req.t ?? Infinity) + 1e-9;
      const zm = zsMax({ c, U0, Ia: usedOption.ia });
      step(r, 'Max. dovolená Zs', 'Zs_max = c · U0 / Ia',
        `${fmt(c, 2)} · ${fmt(U0, 0)} / ${fmt(usedOption.ia, 0)}`, `${fmt(zm, 3)} Ω`,
        usedOption.src);
      check(r, `Samočinné odpojenie do ${fmt(req.t ?? 0, 1)} s`, tripped,
        `Ik = ${fmt(Ik, 0)} A ≥ Ia = ${fmt(usedOption.ia, 0)} A → odpojí v ${fmt(usedOption.t, 2)} s. Zs = ${fmt(Zs, 3)} Ω ≤ Zs_max = ${fmt(zm, 3)} Ω`,
        tripped ? 'Pri poruche istič vypne včas' : 'Pri poruche istič nevypne dosť rýchlo');
      r.zsMax = zm;
      r.tripTime = usedOption.t;
      r.Ia = usedOption.ia;
    } else {
      const worst = opts.options.reduce((a, b) => (a.ia < b.ia ? a : b));
      const zm = zsMax({ c, U0, Ia: worst.ia });
      check(r, 'Samočinné odpojenie', false,
        `Ik = ${fmt(Ik, 0)} A je menší ako potrebný Ia = ${fmt(worst.ia, 0)} A. Zs = ${fmt(Zs, 3)} Ω > Zs_max = ${fmt(zm, 3)} Ω. Istenie nevypne v požadovanom čase.`,
        'Pri poruche istič nevypne včas — kábel je pridlhý alebo pritenký');
      r.zsMax = zm;
      r.Ia = worst.ia;
      r.fixesHint = 'skráť trasu, zväčši prierez, zmeň charakteristiku na nižšiu (D→C→B) alebo pridaj RCD';
    }
  } else {
    check(r, 'Samočinné odpojenie', null, 'chýba prúd odpojenia Ia',
      'Vypnutie pri poruche sa nedá overiť — chýba údaj o istení');
  }

  if (netType === 'TT') {
    note(r, 'V sieti TT sa ochrana samočinným odpojením takmer vždy robí RCD, nie ističom. Zs cez zemniče je vysoká — spoliehaj sa na RCD a nameraj RA.');
  }
  if (netType === 'TN-C') {
    note(r, 'TN-C: za PEN nemôžeš použiť RCD. V novej inštalácii sa TN-C nepoužíva.');
  }
  if (netType === 'IT') {
    note(r, 'IT sieť: prvá porucha neodpojí. Potrebuješ hlásič izolačného stavu a inú logiku overenia.');
  }

  /* skratová odolnosť */
  const kk = shortCircuitK(lookup, { material, insulation, S });
  useRef(r, kk.ref);
  if (kk.missing) {
    missing(r, `súčiniteľ k pre ${material}/${insulation}`);
  } else {
    const k = kk.value;
    const k2s2 = k * k * S * S;
    const tPerm = maxTimeForShortCircuit({ k, S, Ik });
    step(r, 'Energia, ktorú kábel znesie', 'k² · S²',
      `${k}² · ${S}²`, `${fmt(k2s2, 0)} A²s`,
      `${kk.ref.standard} — ${kk.ref.table}`);
    step(r, 'Max. čas pri tomto skratovom prúde', 't_max = k²·S² / Ik²',
      `${fmt(k2s2, 0)} / ${fmt(Ik, 0)}²`, `${fmt(tPerm, 4)} s`);
    r.k = k;
    r.k2s2 = k2s2;
    r.tPerm = tPerm;

    if (r.tripTime !== undefined) {
      const okTherm = r.tripTime <= tPerm + 1e-12;
      step(r, 'Podmienka k²·S² ≥ I²·t', 'k²·S² ≥ Ik² · t_vypnutia',
        `${fmt(k2s2, 0)} ≥ ${fmt(Ik, 0)}² · ${fmt(r.tripTime, 3)} = ${fmt(Ik * Ik * r.tripTime, 0)}`,
        okTherm ? 'OK' : 'NEVYHOVUJE');
      check(r, 'Skratová odolnosť kábla (k²S² ≥ I²t)', okTherm,
        `kábel znesie ${fmt(tPerm, 3)} s, istenie vypne za ${fmt(r.tripTime, 3)} s`,
        okTherm ? 'Kábel vydrží skrat' : 'Kábel nevydrží skrat — treba väčší prierez');
      if (!okTherm) {
        const sMin = minSectionForShortCircuit({ k, Ik, t: r.tripTime });
        note(r, `Na skratovú odolnosť potrebuješ minimálne S = Ik·√t / k = ${fmt(sMin, 2)} mm².`);
        r.sMinShort = sMin;
      }
    } else {
      check(r, 'Skratová odolnosť kábla', null, 'bez času vypnutia sa nedá overiť', false);
    }
    note(r, 'Skratová odolnosť je najkritickejšia na ZAČIATKU obvodu, kde je skratový prúd najväčší — nie na konci. Preto ju kontroluj aj pre Ik na začiatku.');
  }

  return r;
}

/* ───────────────── PE a N ───────────────── */

/** Prierez PE podľa fázového vodiča. */
export function peCrossSection(lookup, S, material = 'Cu') {
  const rules = lookup.get('peSizing', ['rules']);
  if (rules.missing) return { Spe: S, ref: rules.ref, rule: '—' };
  for (const r of rules.value) {
    if (S <= r.upTo) {
      const Spe = r.pe === 'S' ? S : r.pe === '16' ? 16 : S / 2;
      return { Spe, ref: rules.ref, rule: r.pe };
    }
  }
  return { Spe: S / 2, ref: rules.ref, rule: 'S/2' };
}

/** Odporúčanie pre N vrátane harmonických. */
export function neutralAdvice(lookup, { S, phases, thd }) {
  const t = lookup.get('neutralSizing', ['thresholds']);
  if (t.missing) return { text: '', ref: t.ref, factor: 1 };
  const th = thd === undefined || thd === null || thd === '' ? 15 : Number(thd);
  for (const row of t.value) {
    if (th <= row.thdMax) {
      return {
        text: phases === 3
          ? `Podiel 3. harmonickej do ${row.thdMax} %: ${row.text}`
          : 'Pri 1f obvode má N rovnaký prierez ako fáza.',
        factor: row.factor,
        ref: t.ref,
        thdUsed: th,
        assumed: thd === undefined || thd === null || thd === '',
      };
    }
  }
  return { text: '', ref: t.ref, factor: 1 };
}

/* ───────────────── selektivita ───────────────── */

/**
 * Orientačná selektivita voči predradenému isteniu.
 * Pravidlo palca: pomer menovitých hodnôt ≥ 1,6 pre poistky, ≥ 2–3 pre ističe.
 */
export function selectivity({ In, InUp, device, deviceUp }) {
  if (!InUp) return null;
  const ratio = InUp / In;
  const needed = deviceFamily(deviceUp) === 'mcb' || deviceFamily(device) === 'mcb' ? 2 : 1.6;
  const ok = ratio >= needed;
  return {
    ratio,
    needed,
    ok,
    text: ok
      ? `Pomer ${fmt(ratio, 2)}× (${InUp} A / ${In} A) je nad orientačnou hranicou ${needed}×. Selektivita je PRAVDEPODOBNÁ, ale over ju v selektivitných tabuľkách výrobcu.`
      : `Pomer len ${fmt(ratio, 2)}× (${InUp} A / ${In} A), orientačne treba aspoň ${needed}×. Pri skrate môže vypnúť aj predradené istenie. Over tabuľky výrobcu.`,
    warn: 'Selektivita pri skrate sa NEDÁ spoľahlivo určiť z menovitých hodnôt. Toto je len orientácia — rozhodujú selektivitné tabuľky výrobcu.',
  };
}

/* ───────────────── svorky a materiál ───────────────── */

export function materialWarnings(lookup, { material, country, S }) {
  const out = [];
  const mc = lookup.get('minCrossSection', [country]);
  if (!mc.missing) {
    if (material === 'Al') {
      out.push(mc.value.alNote);
      if (S < mc.value.minAl) {
        out.push(`Prierez ${S} mm² je pod minimom ${mc.value.minAl} mm² pre Al v ${country === 'DE' ? 'Nemecku' : 'SR'} (podľa dát v aplikácii — NEOVERENÉ).`);
      }
      out.push('Al vyžaduje svorky schválené pre Al. Nikdy nespájaj Al a Cu priamo — použi bimetalovú svorku (Al/Cu) alebo svorku s povolením pre oba materiály.');
      out.push('Al má tečenie (creep) — po montáži a aj po čase dotiahni svorky uťahovacím momentom od výrobcu. Používaj kontaktnú pastu podľa návodu svorky.');
    }
    if (S < mc.value.powerCu && material === 'Cu') {
      out.push(`Prierez ${S} mm² je pod minimom ${mc.value.powerCu} mm² pre pevné uloženie (NEOVERENÉ).`);
    }
  }
  /* referencia na (neoverený) dataset len vtedy, keď z neho naozaj niečo zaznelo */
  return { warnings: out, ref: out.length ? mc.ref : null };
}
