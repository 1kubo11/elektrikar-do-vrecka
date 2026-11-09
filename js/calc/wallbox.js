/**
 * Wallboxy — kábel, istenie, RCD, ohlasovacie povinnosti.
 */

import { newResult, useRef, addDefault, note, check, missing, fmt, num, safely, step } from './core.js';
import { modeA } from './design.js';

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
    const rules = lookup.get('wallboxRules', [country]);
    useRef(r, rules.ref);
    if (!rules.missing) {
      r.rcd = rules.value.rcd;
      r.reporting = rules.value.reporting;
      r.extra = rules.value.extra;
      note(r, rules.value.rcd);
      note(r, rules.value.extra);
      check(r, 'Ochrana pred DC poruchovým prúdom 6 mA je vyriešená', null,
        'Over v návode wallboxu, či má zabudovanú RDC-DD (DC detekciu). Ak NEMÁ, musíš použiť RCD typ B. RCD typ A sám nestačí.');
    }

    if (country === 'DE' && Number(key) > 12) {
      check(r, 'Výkon nad 12 kW — potrebné schválenie VNB', null,
        `${key} kW presahuje hranicu 12 kW pre jednoduché ohlásenie. V Nemecku to vyžaduje SCHVÁLENIE prevádzkovateľa siete, nie len ohlásenie (NEOVERENÉ — over aktuálne TAB).`);
      note(r, 'Preto sa v praxi často montuje 11 kW wallbox namiesto 22 kW, alebo 22 kW s obmedzením výkonu.');
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
