/**
 * Motory a prúdy.
 */

import { SQRT3, newResult, step, useRef, addDefault, note, check, missing, round, fmt, num, cosPhi as vCos, safely, stepUpKey, smallestRatingAtLeast } from './core.js';
import { currentFromPower, apparentPower, deviceFamily } from './protection.js';
import { dropVolts } from './voltdrop.js';

/** I = P / (√3 · U · cos φ · η) pre 3f, I = P / (U · cos φ · η) pre 1f */
export function motorCurrent({ powerW, phases, U, cos, efficiency }) {
  return currentFromPower({ powerW, phases, U, cos, efficiency });
}

/** Prepočty kW ↔ kVA ↔ A */
export function conversions({ phases, U, cos }) {
  const d = phases === 3 ? SQRT3 * U : U;
  return {
    aFromKw: (kW) => (kW * 1000) / (d * cos),
    aFromKva: (kVA) => (kVA * 1000) / d,
    kwFromA: (A) => (d * A * cos) / 1000,
    kvaFromA: (A) => (d * A) / 1000,
    kvaFromKw: (kW) => kW / cos,
  };
}

export function motor(i, lookup) {
  return safely('Motor — prúdy a istenie', (r) => {
    const phases = Number(i.phases) === 3 ? 3 : 1;
    const kW = num(i.power, 'výkon motora', { min: 0.01, max: 10000 });
    let U = i.U;
    if (U === undefined || U === '' || U === null) {
      U = phases === 3 ? 400 : 230;
      addDefault(r, 'napätie', `${U} V`, 'nezadané');
    }
    U = num(U, 'napätie', { min: 1 });

    /* cos φ */
    let cos;
    if (i.cos === undefined || i.cos === '' || i.cos === null) {
      const t = lookup.get('motorCosPhi');
      useRef(r, t.ref);
      const key = stepUpKey(t.value, kW);
      cos = t.value[key];
      addDefault(r, 'cos φ', fmt(cos, 2), `nezadaný — orientačná hodnota pre ${key} kW z dát (NEOVERENÉ, radšej zo štítku)`);
    } else {
      cos = vCos(i.cos);
    }

    /* účinnosť */
    let eta;
    if (i.efficiency === undefined || i.efficiency === '' || i.efficiency === null) {
      const t = lookup.get('motorEfficiency');
      useRef(r, t.ref);
      const key = stepUpKey(t.value, kW);
      eta = t.value[key];
      addDefault(r, 'účinnosť η', fmt(eta, 3), `nezadaná — orientačná hodnota pre ${key} kW (NEOVERENÉ, radšej zo štítku)`);
    } else {
      eta = num(i.efficiency, 'účinnosť', { min: 0.1, max: 1 });
    }

    const In = motorCurrent({ powerW: kW * 1000, phases, U, cos, efficiency: eta });
    step(r, 'Menovitý prúd motora',
      phases === 3 ? 'I = P / (√3 · U · cos φ · η)' : 'I = P / (U · cos φ · η)',
      `${fmt(kW * 1000, 0)} / (${phases === 3 ? '√3 · ' : ''}${fmt(U, 0)} · ${fmt(cos, 3)} · ${fmt(eta, 3)})`,
      `${fmt(In, 2)} A`);

    const S_kva = apparentPower({ I: In, phases, U }) / 1000;
    step(r, 'Zdanlivý výkon', phases === 3 ? 'S = √3 · U · I' : 'S = U · I',
      `${phases === 3 ? '√3 · ' : ''}${fmt(U, 0)} · ${fmt(In, 2)}`, `${fmt(S_kva, 2)} kVA`);

    /* rozbeh */
    const startMode = i.startMode || 'direct';
    const sm = lookup.get('motorStart', [startMode]);
    useRef(r, sm.ref);
    if (sm.missing) {
      missing(r, `násobok rozbehového prúdu pre "${startMode}"`);
    } else {
      const mult = i.startMultiple ? num(i.startMultiple, 'násobok rozbehu', { min: 1, max: 30 }) : sm.value.multiple;
      if (!i.startMultiple) {
        addDefault(r, 'násobok rozbehového prúdu', `${mult}×In`, `stred rozsahu ${sm.value.range} pre ${sm.value.sk} (NEOVERENÉ — zo štítku motora)`);
      }
      const Ia = In * mult;
      step(r, `Rozbehový prúd — ${sm.value.sk} (${sm.value.de})`, 'Ia = násobok · In',
        `${mult} · ${fmt(In, 2)}`, `${fmt(Ia, 1)} A`, `rozsah ${sm.value.range}`);
      r.startCurrent = Ia;
      r.startMode = sm.value;

      /* úbytok pri rozbehu */
      if (i.L && i.S) {
        const kap = lookup.get('conductivity', [i.material || 'Cu']);
        useRef(r, kap.ref);
        const d = dropVolts({
          phases, U, I: Ia, L: num(i.L, 'dĺžka', { min: 0.1 }), S: num(i.S, 'prierez', { min: 0.1 }),
          kappa: kap.value, cos: 0.35, xPerM: i.xPerM ?? 0,
        });
        addDefault(r, 'cos φ pri rozbehu', '0,35', 'typický rozbehový účinník — NEOVERENÉ, pri presnom výpočte použi údaj výrobcu');
        step(r, 'Úbytok napätia pri rozbehu',
          phases === 3 ? 'ΔU = √3 · L · Ia · R′·cos φ_rozbeh' : 'ΔU = 2 · L · Ia · R′·cos φ_rozbeh',
          `${phases === 3 ? '√3' : '2'} · ${fmt(num(i.L, 'd'), 1)} · ${fmt(Ia, 1)} · ...`,
          `${fmt(d.deltaU, 1)} V (${fmt(d.percent, 1)} %)`);
        const lim = lookup.get('voltageDropOther', [i.country || 'DE', 'motorStart']);
        useRef(r, lim.ref);
        if (!lim.missing) {
          check(r, `Úbytok pri rozbehu ≤ ${lim.value} %`, d.percent <= lim.value,
            `${fmt(d.percent, 1)} % (pri väčšom úbytku môže motor nerozbehnúť alebo zhasnú svetlá)`,
            d.percent <= lim.value
              ? `Úbytok pri rozbehu ${fmt(d.percent, 1)} % — povolené ${lim.value} %`
              : `Úbytok pri rozbehu ${fmt(d.percent, 1)} % je priveľa — motor sa nemusí rozbehnúť`);
        }
        r.startDrop = d;
      }
    }

    /* istenie motora */
    const ratings = lookup.get('breakerRatings', ['mcb']);
    useRef(r, ratings.ref);
    const motorBreaker = smallestRatingAtLeast(ratings.value, In);
    note(r, `Istič motora (Motorschutzschalter) nastav na menovitý prúd motora zo štítku: ${fmt(In, 2)} A. Rozsah nastavenia zvoľ tak, aby ${fmt(In, 2)} A bolo v strede rozsahu.`);
    note(r, 'Tepelná ochrana (nadprúdové relé) sa nastavuje na prúd zo ŠTÍTKU motora, nie na vypočítaný. Pri Y/D sa nastavuje na 0,58× menovitého prúdu, ak je v prívode trojuholníka.');
    if (startMode === 'direct') {
      note(r, `Pri priamom štarte nepoužívaj istič char. B — rozbehový prúd (${fmt(r.startCurrent ?? 0, 0)} A) ho vyhodí. Použi istič motora, char. D alebo poistku gG.`);
    }

    /* stýkač */
    const ct = lookup.get('contactorAC3');
    useRef(r, ct.ref);
    if (!ct.missing && phases === 3) {
      const key = stepUpKey(ct.value, kW);
      const ie = ct.value[key];
      step(r, 'Stýkač podľa AC-3', 'Ie(AC-3) pre najbližší výkon',
        `${kW} kW → tabuľka ${key} kW`, `Ie ≈ ${ie} A`, `${ct.ref.standard}`);
      note(r, `Stýkač: orientačne Ie ≈ ${ie} A v kategórii AC-3 pri 400 V. Konkrétny typ vyber z katalógu — priradenie sa medzi výrobcami líši (NEOVERENÉ).`);
      r.contactor = ie;
    }

    /* kompenzácia */
    if (i.targetCos) {
      const t = vCos(i.targetCos, 'cieľový cos φ');
      if (t <= cos) {
        note(r, `Cieľový cos φ ${fmt(t, 2)} nie je vyšší ako súčasný ${fmt(cos, 2)} — kompenzácia nemá zmysel.`);
      } else {
        const P = kW;
        const tan1 = Math.tan(Math.acos(cos));
        const tan2 = Math.tan(Math.acos(t));
        const Q = P * (tan1 - tan2);
        step(r, 'Kompenzácia účinníka', 'Q = P · (tan φ₁ − tan φ₂)',
          `${fmt(P, 2)} · (${fmt(tan1, 3)} − ${fmt(tan2, 3)})`, `${fmt(Q, 2)} kvar`);
        note(r, `Pre priamu kompenzáciu pri motore nepresahuj cca 90 % magnetizačného prúdu motora — inak hrozí samobudenie pri výbehu. Pri frekvenčnom meniči kondenzátor na výstup NIKDY nedávaj.`);
        r.compensation = Q;
      }
    }

    r.In = In;
    r.cos = cos;
    r.efficiency = eta;
    r.kVA = S_kva;
    r.value = round(In, 2);
    r.unit = 'A';
    r.headline = `In = ${fmt(In, 2)} A, ${fmt(S_kva, 2)} kVA, rozbeh ${fmt(r.startCurrent ?? 0, 0)} A`;
    r.motorBreaker = motorBreaker;
    return r;
  });
}
