/** Globálne vyhľadávanie naprieč všetkými časťami. */

import { esc, mark } from './dom.js';
import { WORDS, PHRASES } from '../data/glossary.js';
import { CABLES, PLACE_GUIDE } from '../data/cables.js';
import { WIRE_COLORS, BREAKER_CHARS, IP_CODE, IK_CODE, BATHROOM_ZONES, SYMBOLS, TERMINALS, TORQUES, RCD_CURRENTS } from '../data/reference.js';
import { DATASETS } from '../data/norms.js';

export const title = 'Hľadanie';

let INDEX = null;

function buildIndex() {
  const idx = [];
  const add = (section, route, label, text, extra = '') => idx.push({ section, route, label, text, extra });

  add('Kalkulačka', '#/kalkulacka', 'Kábel a istenie — návrh prierezu, istenia, úbytok, odpojenie, skrat', 'kábel istenie prierez úbytok napätia odpojenie skrat Iz In Ib zs ik kalkulačka návrh dĺžka');
  add('Kalkulačka', '#/kalkulacka', 'Režim C — do akej dĺžky to vyhovuje', 'maximálna dĺžka limit úbytok odpojenie skratová odolnosť režim c');
  add('Kalkulačka', '#/kalkulacka', 'Režim D — rýchla tabuľka istení a dĺžok', 'rýchla tabuľka istenie dĺžky režim d prehľad');
  add('Motory', '#/motory', 'Motory — prúd, rozbeh, stýkač, kompenzácia', 'motor kw kva ampér rozbeh hviezda trojuholník softštart menič stýkač ac-3 kompenzácia kvar účinník tepelná ochrana');
  add('Fotovoltika', '#/fv', 'FV — reťazec, Uoc pri mraze, limity striedača', 'fotovoltika fv panel reťazec string uoc isc impp striedač mppt poistka gpv spd dc kábel');
  add('Fotovoltika', '#/fv', 'FV — AC kábel striedač → rozvádzač', 'ac kábel striedač rozvádzač úbytok fv');
  add('Wallbox', '#/wallbox', 'Wallbox — kábel, istenie, RCD, ohlásenie', 'wallbox nabíjanie auto elektromobil 3,7 7,4 11 22 kw rcd typ b 6 ma rdc-dd ohlásenie vnb marktstammdatenregister');
  add('Tabuľky', '#/tabulky', 'Tabuľky a značenie', 'tabuľky značenie farby vodičov ip ik zóny kúpeľňa značky svorky momenty');
  add('Slovník', '#/slovnik', 'Slovník SK–DE', 'slovník nemčina preklad výslovnosť vety');
  add('Overenie dát', '#/data', 'Overenie dát — kontrola a oprava normových hodnôt', 'overenie dáta normy tabuľky export import neoverené verified');
  add('Uložené', '#/ulozene', 'Uložené výpočty, posledné a obľúbené', 'uložené posledné obľúbené zákazka história');

  WORDS.forEach((w) => add('Slovník', '#/slovnik', `${w.sk} → ${w.de}`, `${w.sk} ${w.de} ${w.p} ${w.a || ''}`, `[${w.p}]`));
  PHRASES.forEach((p) => add('Slovník — veta', '#/slovnik', `${p.sk} → ${p.de}`, `${p.sk} ${p.de} ${p.p}`, `[${p.p}]`));

  CABLES.forEach((c) => add('Typ kábla', '#/tabulky', `${c.id} (${c.de})`, `${c.id} ${c.de} ${c.sk} ${c.use} ${c.noUse} ${c.insulation} ${c.volt}`, c.use));
  PLACE_GUIDE.forEach((p) => add('Typ miesta', '#/tabulky', `${p.sk} (${p.de})`, `${p.sk} ${p.de} ${p.cables} ${p.protection} ${p.ip} ${p.warn}`, p.protection));

  WIRE_COLORS.current.forEach((c) => add('Farby vodičov', '#/tabulky', `${c.fn} — ${c.color}`, `${c.fn} ${c.sk} ${c.de} ${c.color} ${c.note}`, c.note));
  [...WIRE_COLORS.oldDE, ...WIRE_COLORS.oldSK].forEach((c) => add('Staré značenie', '#/tabulky', `${c.fn} — ${c.color}`, `${c.fn} ${c.color} ${c.note}`, c.note));
  BREAKER_CHARS.forEach((b) => add('Istenie', '#/tabulky', `${b.sk} (${b.de})`, `${b.id} ${b.sk} ${b.de} ${b.trip} ${b.use} ${b.warn}`, b.trip));
  RCD_CURRENTS.forEach((r) => add('RCD', '#/tabulky', `RCD ${r.sk}`, `rcd chránič ${r.sk} ${r.use}`, r.use));
  Object.entries(DATASETS.rcdTypes.data).forEach(([k, v]) => add('RCD', '#/tabulky', `RCD typ ${k}`, `rcd typ ${k} ${v.sk} ${v.use}`, v.use));
  IP_CODE.common.forEach((x) => add('Krytie', '#/tabulky', x.code, `${x.code} ip krytie ${x.use}`, x.use));
  IK_CODE.forEach((x) => add('Krytie', '#/tabulky', x.code, `${x.code} ik ${x.j} ${x.use}`, x.use));
  BATHROOM_ZONES.zones.forEach((z) => add('Kúpeľňa', '#/tabulky', `${z.sk} (${z.de})`, `kúpeľňa zóna ${z.id} ${z.sk} ${z.de} ${z.geometry} ${z.allowed} ${z.ip}`, z.allowed));
  SYMBOLS.forEach((s) => add('Značka', '#/tabulky', `${s.sk} (${s.de})`, `${s.sk} ${s.de} ${s.mark} ${s.note}`, s.note));
  TERMINALS.forEach((t) => add('Svorky', '#/tabulky', `${t.sk} — ${t.marks}`, `${t.sk} ${t.de} ${t.marks} ${t.note}`, t.note));
  TORQUES.rows.forEach((t) => add('Momenty', '#/tabulky', `${t.size} — ${t.nm}`, `moment ${t.size} ${t.nm} ${t.note}`, t.note));
  Object.entries(DATASETS.installMethods.data).forEach(([k, v]) => add('Uloženie', '#/kalkulacka', `${k} — ${v.sk}`, `${k} ${v.sk} ${v.de} ${v.hint} uloženie verlegeart`, v.hint));
  Object.entries(DATASETS.netTypes.data).forEach(([k, v]) => add('Sieť', '#/tabulky', `${k} — ${v.sk}`, `${k} ${v.sk} ${v.de} ${v.warn}`, v.warn));
  Object.keys(DATASETS).forEach((id) => add('Dataset', '#/data', id, `${id} ${DATASETS[id].standard} ${DATASETS[id].table} ${DATASETS[id].note}`, DATASETS[id].standard));

  return idx;
}

export function search(q) {
  if (!INDEX) INDEX = buildIndex();
  const n = q.trim().toLowerCase();
  if (n.length < 2) return [];
  const words = n.split(/\s+/);
  const scored = [];
  for (const it of INDEX) {
    const hay = `${it.label} ${it.text}`.toLowerCase();
    if (!words.every((w) => hay.includes(w))) continue;
    let score = 0;
    if (it.label.toLowerCase().startsWith(n)) score += 100;
    if (it.label.toLowerCase().includes(n)) score += 40;
    score += 10 - Math.min(9, it.label.length / 12);
    scored.push({ ...it, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 60);
}

export function renderResults(results, q) {
  if (!q || q.trim().length < 2) return '<p class="muted">Napíš aspoň dva znaky.</p>';
  if (!results.length) return `<p class="muted">Nič som nenašel pre „${esc(q)}“.</p>`;
  return `<ul class="search-res">
    ${results.map((r) => `<li><a href="${esc(r.route)}" data-close-search>
      <span class="pill">${esc(r.section)}</span>
      <b>${mark(r.label, q)}</b>
      ${r.extra ? `<span class="small muted">${esc(String(r.extra).slice(0, 120))}</span>` : ''}
    </a></li>`).join('')}
  </ul>`;
}

export function render(root) {
  root.innerHTML = `
    <div class="search-row"><input type="search" id="gs" placeholder="Hľadaj čokoľvek…" autocomplete="off"></div>
    <div id="gs-res"></div>`;
  const inp = root.querySelector('#gs');
  const box = root.querySelector('#gs-res');
  inp.addEventListener('input', () => { box.innerHTML = renderResults(search(inp.value), inp.value); });
  inp.focus();
}
