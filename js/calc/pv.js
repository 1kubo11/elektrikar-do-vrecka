/**
 * Fotovoltika — reťazec, DC kábel, poistky, striedač → rozvádzač.
 */

import { SQRT3, newResult, step, useRef, addDefault, note, check, missing, round, fmt, num, cosPhi as vCos, safely, smallestRatingAtLeast, resistancePerM } from './core.js';
import { dropVolts } from './voltdrop.js';
import { currentFromPower } from './protection.js';

/** Uoc pri najnižšej teplote: Uoc(T) = Uoc_STC · (1 + β · (T − 25)) */
export function uocAtTemp({ uocStc, tempCoeff, temp, stcTemp = 25 }) {
  return uocStc * (1 + tempCoeff * (temp - stcTemp));
}

export function pvString(i, lookup) {
  return safely('FV reťazec — napätie a limity striedača', (r) => {
    const uoc = num(i.uocStc, 'Uoc panelu (STC)', { min: 1, max: 500 });
    const isc = num(i.iscStc, 'Isc panelu (STC)', { min: 0.1, max: 100 });
    const country = i.country || 'DE';

    let tempCoeff;
    if (i.tempCoeff === undefined || i.tempCoeff === '' || i.tempCoeff === null) {
      const t = lookup.get('pvDesign', ['tempCoeffUoc']);
      useRef(r, t.ref);
      tempCoeff = t.value;
      addDefault(r, 'teplotný súčiniteľ Uoc', `${fmt(tempCoeff * 100, 3)} %/K`,
        `nezadaný — predvolená typická hodnota (rozsah ${lookup.get('pvDesign', ['tempCoeffRange']).value}). VŽDY ber z datasheetu panelu.`);
    } else {
      const v = num(i.tempCoeff, 'teplotný súčiniteľ', { min: -2, max: 0, allowZero: true });
      tempCoeff = Math.abs(v) > 0.02 ? v / 100 : v; // prijmi aj -0,3 (%/K)
    }

    let tMin;
    if (i.minTemp === undefined || i.minTemp === '' || i.minTemp === null) {
      const t = lookup.get('pvDesign', ['minTemp', country]);
      useRef(r, t.ref);
      tMin = t.value;
      addDefault(r, 'najnižšia návrhová teplota', `${tMin} °C`,
        `nezadaná — predvolená pre ${country === 'DE' ? 'Nemecko' : 'Slovensko'} (PREDPOKLAD, nie norma)`);
    } else {
      tMin = num(i.minTemp, 'najnižšia teplota', { min: -60, max: 40, allowZero: true });
    }

    const uocCold = uocAtTemp({ uocStc: uoc, tempCoeff, temp: tMin });
    step(r, 'Uoc panelu pri najnižšej teplote', 'Uoc(T) = Uoc_STC · (1 + β · (T − 25))',
      `${fmt(uoc, 2)} · (1 + ${fmt(tempCoeff, 5)} · (${tMin} − 25))`, `${fmt(uocCold, 2)} V`);

    const n = i.modules ? num(i.modules, 'počet panelov v reťazci', { min: 1, max: 200 }) : undefined;
    const uMaxInv = i.invMaxV ? num(i.invMaxV, 'max. DC napätie striedača', { min: 10, max: 2000 }) : undefined;

    if (uMaxInv) {
      const nMax = Math.floor(uMaxInv / uocCold);
      step(r, 'Maximálny počet panelov v reťazci', 'n ≤ U_max_striedač / Uoc(T_min)',
        `${fmt(uMaxInv, 0)} / ${fmt(uocCold, 2)}`, `${nMax} panelov`);
      r.maxModules = nMax;
      if (n) {
        const uString = n * uocCold;
        step(r, 'Napätie reťazca pri najnižšej teplote', 'U = n · Uoc(T_min)',
          `${n} · ${fmt(uocCold, 2)}`, `${fmt(uString, 1)} V`);
        check(r, `Napätie reťazca ≤ ${fmt(uMaxInv, 0)} V (limit striedača)`, uString <= uMaxInv,
          `${fmt(uString, 1)} V pri ${tMin} °C`);
        r.stringVoltage = uString;
        if (uString > uMaxInv) {
          note(r, `Skráť reťazec na ${nMax} panelov, alebo rozdeľ na dva reťazce.`);
        }
      }
    } else {
      missing(r, 'maximálne DC napätie striedača');
    }

    /* MPP rozsah */
    if (i.mppMin && n) {
      const mppMin = num(i.mppMin, 'dolná hranica MPP', { min: 10, max: 2000 });
      const umpTypical = i.vmpStc ? num(i.vmpStc, 'Vmp panelu') : undefined;
      if (umpTypical) {
        const uHot = umpTypical * (1 + tempCoeff * (70 - 25));
        addDefault(r, 'teplota panelu v lete', '70 °C', 'predvolený odhad pre kontrolu dolnej hranice MPP (PREDPOKLAD)');
        step(r, 'Vmp reťazca pri 70 °C', 'U = n · Vmp · (1 + β · (70 − 25))',
          `${n} · ${fmt(umpTypical, 2)} · (1 + ${fmt(tempCoeff, 5)} · 45)`, `${fmt(n * uHot, 1)} V`);
        check(r, `Vmp reťazca v lete ≥ ${fmt(mppMin, 0)} V (dolná hranica MPP)`, n * uHot >= mppMin,
          `${fmt(n * uHot, 1)} V. Ak by napätie kleslo pod hranicu MPP, striedač v horúcom dni nezačne pracovať.`);
        note(r, 'β pre Vmp je iný ako pre Uoc (zvyčajne väčší v absolútnej hodnote). Tento výpočet používa β pre Uoc — je to ZJEDNODUŠENIE, pre presný návrh použi β(Vmp) z datasheetu.');
      } else {
        missing(r, 'Vmp panelu pre kontrolu MPP rozsahu');
      }
    }

    /* Isc a prúdové limity */
    const sf = lookup.get('pvDesign', ['iscSafetyFactor']);
    useRef(r, sf.ref);
    const iscDesign = isc * sf.value;
    step(r, 'Návrhový prúd reťazca', 'I = Isc · 1,25',
      `${fmt(isc, 2)} · ${sf.value}`, `${fmt(iscDesign, 2)} A`,
      `${sf.ref.standard} — ${sf.ref.table}`);
    r.iscDesign = iscDesign;

    if (i.invMaxA) {
      const iMax = num(i.invMaxA, 'max. prúd vstupu striedača', { min: 0.1, max: 100 });
      check(r, `Isc reťazca ≤ ${fmt(iMax, 1)} A (limit vstupu striedača)`, isc <= iMax,
        `Isc = ${fmt(isc, 2)} A. Pozor: striedače uvádzajú zvlášť max. prúd MPPT a max. Isc.`);
    }

    /* poistky reťazcov */
    const ratings = lookup.get('breakerRatings', ['gG']);
    useRef(r, ratings.ref);
    const fuse = smallestRatingAtLeast(ratings.value, iscDesign);
    if (fuse) {
      note(r, `Poistka reťazca: aspoň ${fmt(iscDesign, 2)} A → najbližší rad ${fuse} A. MUSÍ byť DC poistka gPV (nie gG!) s napätím ≥ napätie reťazca. Súčasne nesmie presiahnuť "Maximum series fuse rating" z datasheetu panelu.`);
      r.stringFuse = fuse;
    }
    note(r, 'Poistky reťazcov majú zmysel pri 3 a viac paralelných reťazcoch. Pri 1–2 reťazcoch ich väčšinou netreba — over v datasheete panelu a IEC 62548.');
    note(r, 'Prepäťová ochrana: SPD typ 2 na DC strane pri striedači a pri generátore, ak je vzdialenosť väčšia ako cca 10 m. Pri objekte s LPS (bleskozvodom) rieš odstupové vzdialenosti a SPD typ 1. Toto je orientácia, nie projekt.');

    r.uocCold = uocCold;
    r.tempCoeff = tempCoeff;
    r.minTemp = tMin;
    r.value = round(uocCold, 2);
    r.unit = 'V';
    r.headline = `Uoc pri ${tMin} °C = ${fmt(uocCold, 2)} V/panel${r.maxModules ? `, max. ${r.maxModules} panelov v reťazci` : ''}`;
    return r;
  });
}

/** DC kábel reťazca — úbytok napätia (DC: 2 × L). */
export function pvDcCable(i, lookup) {
  return safely('FV — DC kábel reťazca', (r) => {
    const I = num(i.current, 'prúd reťazca (Impp)', { min: 0.1, max: 100 });
    const L = num(i.L, 'dĺžka (jedna cesta)', { min: 0.1, max: 10000 });
    const S = num(i.S, 'prierez', { min: 0.1, max: 1000 });
    const U = num(i.U, 'napätie reťazca (Umpp)', { min: 10, max: 2000 });
    const kap = lookup.get('conductivity', [i.material || 'Cu']);
    useRef(r, kap.ref);

    const rPerM = resistancePerM(kap.value, S);
    const dU = 2 * L * I * rPerM;
    const pct = (dU / U) * 100;
    step(r, 'Úbytok na DC strane', 'ΔU = 2 · L · I · R′',
      `2 · ${fmt(L, 1)} · ${fmt(I, 2)} · ${rPerM.toExponential(4)}`, `${fmt(dU, 2)} V (${fmt(pct, 2)} %)`);

    const lim = i.limitPercent ? num(i.limitPercent, 'limit', { min: 0.1, max: 10 }) : lookup.get('pvDesign', ['dcVoltageDropLimit']).value;
    if (!i.limitPercent) {
      useRef(r, lookup.get('pvDesign', ['dcVoltageDropLimit']).ref);
      addDefault(r, 'povolený úbytok na DC strane', `${lim} %`, 'nezadaný — bežne používaný návrhový limit (NEOVERENÉ)');
    }
    check(r, `Úbytok DC ≤ ${lim} %`, pct <= lim, `${fmt(pct, 2)} % — každé % je priamo stratená výroba`);

    note(r, 'DC kábel musí byť solárny (H1Z2Z2-K), dvojito izolovaný, UV odolný, pre 1,5 kV DC. Nepoužívaj NYM ani H07V-K.');
    note(r, 'Plus a mínus veď čo najbližšie pri sebe (malá indukčná smyčka), inak sa pri blesku indukuje prepätie.');

    r.value = round(dU, 2);
    r.unit = 'V';
    r.percent = pct;
    r.headline = `ΔU = ${fmt(dU, 2)} V (${fmt(pct, 2)} %)`;
    return r;
  });
}

/** AC kábel striedač → rozvádzač. */
export function pvAcCable(i, lookup) {
  return safely('FV — AC kábel striedač → rozvádzač', (r) => {
    const phases = Number(i.phases) === 3 ? 3 : 1;
    const kW = num(i.power, 'AC výkon striedača', { min: 0.1, max: 1000 });
    let U = i.U;
    if (U === undefined || U === '' || U === null) {
      U = phases === 3 ? 400 : 230;
      addDefault(r, 'napätie', `${U} V`, 'nezadané');
    }
    U = num(U, 'napätie', { min: 1 });
    const cos = i.cos === undefined || i.cos === '' ? 1 : vCos(i.cos);
    if (i.cos === undefined || i.cos === '') addDefault(r, 'cos φ striedača', '1,00', 'nezadaný — striedače bežne pracujú pri cos φ ≈ 1, ale VNB môže vyžadovať jalový výkon');

    const I = currentFromPower({ powerW: kW * 1000, phases, U, cos });
    step(r, 'Prúd striedača', phases === 3 ? 'I = P / (√3 · U · cos φ)' : 'I = P / (U · cos φ)',
      `${fmt(kW * 1000, 0)} / (${phases === 3 ? '√3 · ' : ''}${fmt(U, 0)} · ${fmt(cos, 2)})`, `${fmt(I, 2)} A`);

    const L = num(i.L, 'dĺžka', { min: 0.1 });
    const S = num(i.S, 'prierez', { min: 0.1 });
    const kap = lookup.get('conductivity', [i.material || 'Cu']);
    useRef(r, kap.ref);
    const d = dropVolts({ phases, U, I, L, S, kappa: kap.value, cos, xPerM: i.xPerM ?? 0 });
    step(r, 'Úbytok napätia',
      phases === 3 ? 'ΔU = √3 · L · I · R′·cos φ' : 'ΔU = 2 · L · I · R′·cos φ',
      `${phases === 3 ? '√3' : '2'} · ${fmt(L, 1)} · ${fmt(I, 2)} · ${resistancePerM(kap.value, S).toExponential(4)}`,
      `${fmt(d.deltaU, 2)} V (${fmt(d.percent, 2)} %)`);

    const limGot = lookup.get('voltageDropOther', [i.country || 'DE', 'pvAc']);
    useRef(r, limGot.ref);
    const lim = i.limitPercent ? num(i.limitPercent, 'limit') : limGot.value;
    if (!i.limitPercent) addDefault(r, 'povolený úbytok AC', `${lim} %`, 'z dát — pre FV sa bežne drží 1 % (NEOVERENÉ, over v TAB)');
    check(r, `Úbytok AC ≤ ${lim} %`, d.percent <= lim, `${fmt(d.percent, 2)} %`);

    note(r, 'Istenie AC strany dimenzuj na menovitý prúd striedača, nie na prierez kábla. Kábel musí uniesť istenie.');
    note(r, 'Striedač musí mať možnosť odpojenia (istič) a v DE sa rieši aj NA-ochrana podľa VDE-AR-N 4105 (do 30 kVA integrovaná v striedači).');

    r.I = I;
    r.value = round(d.deltaU, 2);
    r.unit = 'V';
    r.percent = d.percent;
    r.headline = `I = ${fmt(I, 2)} A, ΔU = ${fmt(d.deltaU, 2)} V (${fmt(d.percent, 2)} %)`;
    return r;
  });
}
