/**
 * Wallboxy — kábel, istenie, RCD, ohlasovacie povinnosti.
 */

import { newResult, useRef, addDefault, note, check, missing, fmt, num, safely, step } from './core.js';
import { modeA } from './design.js';
import { dsWallboxRules } from '../data/norms.js';

export function wallbox(i, lookup) {
  return safely('Wallbox — kábel, istenie a ochrana', (r) => {
    const country = i.country || 'DE';
    const key = String(i.powerClass ?? 11);
    const wp = lookup.get('wallboxPower', [key]);
    useRef(r, wp.ref);
    if (wp.missing) {
      missing(r, `výkonový stupeň wallboxu ${key} kW`);
      return r;
    }
    const { phases, current, label } = wp.value;
    step(r, 'Výkonový stupeň', '—', label, `${phases}f, ${current} A trvalo`);

    note(r, 'Nabíjanie je TRVALÁ záťaž (hodiny na plnom prúde). Nepoužívaj súčasnosť ani zníženie — kábel aj istenie dimenzuj na 100 % menovitého prúdu.');

    /* návrh kábla a istenia cez hlavnú kalkulačku */
    const design = modeA({
      ...i,
      loadMode: 'current',
      current,
      diversity: 1,
      phases,
      cos: 1,
      circuitPurpose: 'wallbox',
      device: i.device || 'B',
      material: i.material || 'Cu',
      insulation: i.insulation || 'PVC',
      method: i.method || 'B2',
      loadedCores: phases === 3 ? 3 : 2,
      country,
    }, lookup);

    (design.refs || []).forEach((x) => useRef(r, x));
    (design.defaults || []).forEach((d) => r.defaults.push(d));
    (design.notes || []).forEach((n) => note(r, n));
    (design.checks || []).forEach((c) => {
      r.checks.push(c);
      if (c.ok === false) r.status = 'fail';
      else if (c.ok === null && r.status === 'ok') r.status = 'warn';
    });
    (design.missing || []).forEach((m) => missing(r, m));
    (design.steps || []).forEach((s) => r.steps.push(s));

    r.design = design.chosen;
    r.designResult = design;

    /* RCD a DC ochrana */
    const rules = lookup.get(dsWallboxRules(country), []);
    useRef(r, rules.ref);
    if (!rules.missing) {
      r.rcd = rules.value.rcd;
      r.reporting = rules.value.reporting;
      r.extra = rules.value.extra;
      note(r, rules.value.rcd);
      note(r, rules.value.extra);
      check(r, 'Ochrana pred DC poruchovým prúdom 6 mA je vyriešená', null,
        'Over v návode wallboxu, či má zabudovanú RDC-DD (DC detekciu). Ak NEMÁ, musíš použiť RCD typ B. RCD typ A sám nestačí.',
        'Pozri v návode, či má wallbox DC ochranu 6 mA. Ak nie, treba chránič typ B.');

      /* hranice z dát: súhlas nad 12 kVA, riadenie podľa § 14a nad 4,2 kW (len Nemecko) */
      const kva = ((phases === 3 ? Math.sqrt(3) * 400 : 230) * current) / 1000;
      const lim = rules.value.approvalAboveKva;
      if (lim && kva > lim) {
        check(r, `Výkon nad ${lim} kVA — treba súhlas prevádzkovateľa siete`, null,
          `${key} kW (${fmt(kva, 1)} kVA) presahuje ${lim} kVA. Nestačí ohlásenie, prevádzkovateľ siete musí dať súhlas; vyjadrí sa do dvoch mesiacov.`,
          `Nad ${lim} kVA (asi 11 kW) treba súhlas prevádzkovateľa siete, nestačí ohlásenie.`);
        note(r, 'Preto sa v praxi často montuje 11 kW wallbox namiesto 22 kW.');
      }
      const ctl = rules.value.controllableAboveKw;
      if (ctl && Number(key) > ctl) {
        note(r, `Wallbox nad ${String(ctl).replace('.', ',')} kW spadá v Nemecku pod § 14a EnWG — treba dohodu o riadení zo strany siete a k tomu meranie a ovládanie.`);
      }
    }

    note(r, 'Wallbox daj na samostatný obvod, bez zásuviek a iných spotrebičov. Prívodný kábel chráň pred mechanickým poškodením.');
    note(r, 'Pri viacerých wallboxoch rieš riadenie nabíjania (Lastmanagement), inak sa prekročí pripojovací výkon objektu.');

    r.phases = phases;
    r.current = current;
    r.value = design.chosen?.S;
    r.unit = 'mm²';
    r.headline = design.chosen
      ? `${label}: ${i.material || 'Cu'} ${fmt(design.chosen.S, 2)} mm² + ${design.chosen.device}${design.chosen.In} A, úbytok ${fmt(design.chosen.dropPercent ?? 0, 2)} %`
      : `${label}: návrh kábla sa nedá dokončiť — ${design.headline || 'chýbajú dáta'}`;
    return r;
  });
}
