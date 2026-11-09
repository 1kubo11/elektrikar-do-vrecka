/** Hlavná kalkulačka — kábel a istenie, režimy A/B/C/D. */

import { esc, fieldNum, fieldSelect, segmented, details, toast, h } from './dom.js';
import { renderResult, resultToText } from './result.js';
import { methodIcon } from './methodIcons.js';
import { modeA, modeB, modeC, modeD } from '../calc/design.js';
import { CROSS_SECTIONS, fmt, grade } from '../calc/core.js';
import { DATASETS } from '../data/norms.js';
import { CABLES } from '../data/cables.js';
import * as store from '../store.js';
import { shareText, printResult } from '../share.js';

const MODES = [
  { v: 'A', t: 'A — Mám záťaž a dĺžku', sub: 'Navrhne najmenší vyhovujúci prierez a istenie.' },
  { v: 'B', t: 'B — Mám kábel', sub: 'Aké najväčšie istenie môžem použiť?' },
  { v: 'C', t: 'C — Mám kábel a istenie', sub: 'Do akej dĺžky to vyhovuje?' },
  { v: 'D', t: 'D — Rýchla tabuľka', sub: 'Istenia a maximálne dĺžky pre zvolený kábel.' },
];

const METHODS = ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2', 'E', 'F'];

const CALC_KEY = 'edv.calc.v1';

const DEFAULT_STATE = {
  mode: 'A',
  material: 'Cu',
  insulation: 'PVC',
  cableType: 'NYM',
  method: 'B2',
  phases: 1,
  U: '',
  loadMode: 'power',
  power: '3.5',
  current: '',
  cos: '',
  diversity: '',
  L: '20',
  S: '2.5',
  In: '16',
  device: 'B',
  ambient: '',
  circuits: '',
  loadedCores: '',
  netType: 'TN-C-S',
  Ze: '',
  Zs: '',
  limitPercent: '',
  circuitPurpose: 'power',
  thd: '',
  xPerM: '',
  InUp: '',
  iaManual: '',
  job: '',
};

function loadState() {
  try {
    const raw = localStorage.getItem(CALC_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch { return { ...DEFAULT_STATE }; }
}
function saveState(s) {
  try { localStorage.setItem(CALC_KEY, JSON.stringify(s)); } catch {}
}

let S = loadState();
let lastResult = null;
let ctxRef = null;

export function setInputs(inputs) {
  S = { ...S, ...inputs };
  saveState(S);
}

export const title = 'Kábel a istenie';

export function render(root, ctx) {
  ctxRef = ctx;
  root.innerHTML = `
    <div class="mode-strip">
      ${MODES.map((m) => `<button type="button" class="mode-btn ${S.mode === m.v ? 'on' : ''}" data-mode="${m.v}">
        <b>${esc(m.v)}</b><span>${esc(m.t.split('— ')[1])}</span></button>`).join('')}
    </div>
    <p class="mode-sub">${esc(MODES.find((m) => m.v === S.mode).sub)}</p>
    <form id="calc-form" autocomplete="off">${formFields(ctx)}</form>
    <div id="calc-results"></div>
  `;
  bind(root, ctx);
  recompute(root, ctx);
}

/* ───────────────── formulár ───────────────── */

function formFields(ctx) {
  const mode = S.mode;
  const show = {
    load: mode === 'A',
    length: mode === 'A' || mode === 'C',
    section: mode === 'B' || mode === 'C',
    rating: mode === 'C',
  };

  const cableOpts = CABLES.map((c) => ({ v: c.id, t: `${c.id} — ${c.de.split(' /')[0]}` }));

  return `
  <div class="grid">
    ${segmented({ name: 'phases', label: 'Sieť', de: 'Netz', value: S.phases, options: [
      { v: 1, t: '1f 230 V' }, { v: 3, t: '3f 400 V' }, { v: 'custom', t: 'vlastné' },
    ] })}
    ${String(S.phases) === 'custom' ? fieldNum({ name: 'U', label: 'Vlastné napätie', de: 'Spannung', value: S.U, unit: 'V', placeholder: 'napr. 500' }) : ''}

    ${segmented({ name: 'material', label: 'Materiál', de: 'Material', value: S.material, options: [
      { v: 'Cu', t: 'Cu — meď' }, { v: 'Al', t: 'Al — hliník' },
    ] })}

    ${segmented({ name: 'insulation', label: 'Izolácia', de: 'Isolierung', value: S.insulation, options: [
      { v: 'PVC', t: 'PVC 70 °C' }, { v: 'XLPE', t: 'XLPE 90 °C' },
    ] })}

    ${fieldSelect({ name: 'cableType', label: 'Typ kábla', de: 'Kabeltyp', value: S.cableType, options: cableOpts,
      hint: cableHint(S.cableType) })}

    ${show.load ? `
      ${segmented({ name: 'loadMode', label: 'Záťaž zadám ako', value: S.loadMode, options: [
        { v: 'power', t: 'výkon kW' }, { v: 'current', t: 'prúd A' },
      ] })}
      ${S.loadMode === 'power'
        ? fieldNum({ name: 'power', label: 'Výkon', de: 'Leistung', value: S.power, unit: 'kW' })
        : fieldNum({ name: 'current', label: 'Prúd záťaže', de: 'Laststrom', value: S.current, unit: 'A' })}
      ${fieldNum({ name: 'cos', label: 'cos φ', de: 'Leistungsfaktor', value: S.cos, placeholder: '1,00', hint: 'Nezadané = 1,00 (odporová záťaž)' })}
      ${fieldNum({ name: 'diversity', label: 'Súčasnosť', de: 'Gleichzeitigkeitsfaktor', value: S.diversity, placeholder: '1,00', hint: 'Nezadané = 1,00 (plná záťaž)' })}
    ` : ''}

    ${show.section ? fieldSelect({ name: 'S', label: 'Prierez', de: 'Querschnitt', value: S.S,
      options: CROSS_SECTIONS.map((x) => ({ v: x, t: `${String(x).replace('.', ',')} mm²` })) }) : ''}

    ${fieldSelect({ name: 'device', label: 'Typ istenia', de: 'Schutzorgan', value: S.device, options: [
      { v: 'B', t: 'Istič B' }, { v: 'C', t: 'Istič C' }, { v: 'D', t: 'Istič D' },
      { v: 'gG', t: 'Poistka gG' }, { v: 'nh', t: 'Poistka NH' }, { v: 'motor', t: 'Istič motora' },
    ], hint: S.device === 'motor' ? 'Pri ističi motora zadaj Ia z katalógu v rozšírených vstupoch — inak sa odpojenie nedá overiť.' : '' })}

    ${show.rating ? fieldNum({ name: 'In', label: 'Menovité istenie In', de: 'Nennstrom', value: S.In, unit: 'A' }) : ''}

    ${show.length ? fieldNum({ name: 'L', label: mode === 'C' ? 'Plánovaná dĺžka (nepovinné)' : 'Dĺžka trasy', de: 'Länge', value: S.L, unit: 'm' }) : ''}
  </div>

  <div class="method-pick">
    <span class="field-label">Spôsob uloženia<em class="de">Verlegeart</em></span>
    <div class="methods">
      ${METHODS.map((m) => {
        const d = DATASETS.installMethods.data[m];
        return `<button type="button" class="mcard ${S.method === m ? 'on' : ''}" data-method="${m}">
          ${methodIcon(m)}
          <b>${m}</b>
          <span>${esc(d.sk)}</span>
        </button>`;
      }).join('')}
    </div>
    <p class="method-hint"><strong>${esc(DATASETS.installMethods.data[S.method]?.sk || '')}</strong>
      <em class="de">${esc(DATASETS.installMethods.data[S.method]?.de || '')}</em><br>
      ${esc(DATASETS.installMethods.data[S.method]?.hint || '')}</p>
  </div>

  <div class="grid">
    ${fieldNum({ name: 'ambient', label: S.method === 'D1' || S.method === 'D2' ? 'Teplota zeme' : 'Teplota okolia',
      de: S.method === 'D1' || S.method === 'D2' ? 'Erdtemperatur' : 'Umgebungstemperatur',
      value: S.ambient, unit: '°C', placeholder: S.method === 'D1' || S.method === 'D2' ? '20' : '30',
      hint: 'Nezadané = referenčná teplota tabuľky' })}
    ${fieldNum({ name: 'circuits', label: 'Počet súbežných obvodov', de: 'Anzahl Stromkreise', value: S.circuits, placeholder: '1' })}
    ${fieldSelect({ name: 'loadedCores', label: 'Počet zaťažených žíl', de: 'belastete Adern', value: S.loadedCores, options: [
      { v: '', t: 'podľa počtu fáz' }, { v: '2', t: '2 zaťažené žily' }, { v: '3', t: '3 zaťažené žily' },
    ] })}
  </div>

  ${details('Sieť, impedancia a limity', `
    <div class="grid">
      ${fieldSelect({ name: 'netType', label: 'Typ siete', de: 'Netzform', value: S.netType, options: [
        { v: 'TN-C', t: 'TN-C' }, { v: 'TN-S', t: 'TN-S' }, { v: 'TN-C-S', t: 'TN-C-S' },
        { v: 'TT', t: 'TT' }, { v: 'IT', t: 'IT' },
      ], hint: DATASETS.netTypes.data[S.netType]?.warn || '' })}
      ${fieldNum({ name: 'Ze', label: 'Impedancia na začiatku Ze', de: 'Vorimpedanz', value: S.Ze, unit: 'Ω', placeholder: '0,35',
        hint: 'Nezadané = predvolený odhad 0,35 Ω. Radšej nameraj.' })}
      ${fieldNum({ name: 'Zs', label: 'Nameraná Zs (má prednosť)', de: 'gemessene Schleifenimpedanz', value: S.Zs, unit: 'Ω',
        hint: 'Ak zadáš, Ze a dĺžka sa pre odpojenie nepoužijú.' })}
      ${fieldSelect({ name: 'circuitPurpose', label: 'Typ obvodu (pre limit úbytku)', value: S.circuitPurpose, options: [
        { v: 'power', t: 'zásuvkový / silový' }, { v: 'lighting', t: 'svetelný' },
        { v: 'wallbox', t: 'nabíjanie áut' }, { v: 'motorRun', t: 'motor — chod' },
      ] })}
      ${fieldNum({ name: 'limitPercent', label: 'Povolený úbytok (prepíše normu)', de: 'zul. Spannungsfall', value: S.limitPercent, unit: '%',
        hint: `Nezadané = ${dropHint(S)} podľa krajiny a typu obvodu` })}
      ${fieldNum({ name: 'xPerM', label: "Reaktancia X′", de: 'Reaktanz', value: S.xPerM, unit: 'Ω/m', placeholder: '0',
        hint: 'Nezadané = 0 (zanedbaná). Pri S ≥ 50 mm² zadaj cca 0,00008.' })}
      ${fieldNum({ name: 'thd', label: '3. harmonická v N', de: 'Oberschwingungen', value: S.thd, unit: '%', placeholder: '15',
        hint: 'LED, spínané zdroje, meniče. Nad 33 % sa N nesmie zmenšovať.' })}
      ${fieldNum({ name: 'InUp', label: 'Predradené istenie (selektivita)', de: 'vorgeschaltete Sicherung', value: S.InUp, unit: 'A' })}
      ${S.device === 'motor' ? fieldNum({ name: 'iaManual', label: 'Ia ističa motora z katalógu', value: S.iaManual, unit: 'A' }) : ''}
    </div>`)}

  ${details('Názov zákazky (pre uloženie a zdieľanie)', `
    <label class="field"><span class="field-label">Zákazka</span>
    <span class="field-input"><input type="text" name="job" value="${esc(S.job)}" data-input placeholder="napr. Müller, Hauptstr. 12 — kúpeľňa"></span></label>`)}
  `;
}

function cableHint(id) {
  const c = CABLES.find((x) => x.id === id);
  if (!c) return '';
  return `${c.sk} · ${c.volt} · ${c.use} ${c.noUse !== '—' ? `POZOR: ${c.noUse}` : ''}`;
}

function dropHint(s) {
  const c = store.getCountry();
  const v = DATASETS.voltageDropLimits.data[c]?.[s.circuitPurpose];
  return v ? `${v} %` : 'hodnota z dát';
}

/* ───────────────── udalosti ───────────────── */

function bind(root, ctx) {
  root.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => { S.mode = b.dataset.mode; saveState(S); render(root, ctx); });
  });
  root.querySelectorAll('[data-method]').forEach((b) => {
    b.addEventListener('click', () => { S.method = b.dataset.method; saveState(S); render(root, ctx); });
  });
  root.querySelectorAll('[data-seg]').forEach((b) => {
    b.addEventListener('click', () => { S[b.dataset.seg] = b.dataset.val; saveState(S); render(root, ctx); });
  });
  root.querySelectorAll('[data-input]').forEach((inp) => {
    const handler = () => {
      S[inp.name] = inp.value;
      saveState(S);
      if (['device', 'cableType', 'circuitPurpose', 'netType'].includes(inp.name)) render(root, ctx);
      else recompute(root, ctx);
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });

  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if (!a || !lastResult) return;
    const meta = { job: S.job, country: store.getCountry(), inputs: inputSummary() };
    if (a.dataset.action === 'share-text') {
      shareText(resultToText(lastResult, meta), lastResult.title);
    } else if (a.dataset.action === 'share-pdf') {
      printResult({ title: lastResult.title, job: S.job, country: store.getCountry(), text: resultToText(lastResult, meta) });
    } else if (a.dataset.action === 'save-calc') {
      const name = prompt('Názov výpočtu:', S.job || `${S.mode} — ${lastResult.headline || ''}`.slice(0, 60));
      if (name === null) return;
      store.saveCalc({ name, job: S.job, module: 'calculator', inputs: { ...S }, headline: lastResult.headline, country: store.getCountry() });
      toast('Výpočet uložený.');
    }
  });
}

function inputSummary() {
  const out = {
    'Režim': S.mode,
    'Sieť': String(S.phases) === 'custom' ? `${S.U} V` : (Number(S.phases) === 3 ? '3f 400 V' : '1f 230 V'),
    'Materiál': S.material,
    'Izolácia': S.insulation,
    'Typ kábla': S.cableType,
    'Uloženie': `${S.method} — ${DATASETS.installMethods.data[S.method]?.sk || ''}`,
    'Istenie': S.device + (S.In && S.mode === 'C' ? ` ${S.In} A` : ''),
    'Typ siete': S.netType,
  };
  if (S.mode === 'A') out[S.loadMode === 'power' ? 'Výkon' : 'Prúd záťaže'] = S.loadMode === 'power' ? `${S.power} kW` : `${S.current} A`;
  if (S.S && (S.mode === 'B' || S.mode === 'C')) out['Prierez'] = `${S.S} mm²`;
  if (S.L) out['Dĺžka'] = `${S.L} m`;
  if (S.cos) out['cos φ'] = S.cos;
  if (S.diversity) out['Súčasnosť'] = S.diversity;
  if (S.ambient) out['Teplota'] = `${S.ambient} °C`;
  if (S.circuits) out['Súbežné obvody'] = S.circuits;
  if (S.Ze) out['Ze'] = `${S.Ze} Ω`;
  if (S.Zs) out['Nameraná Zs'] = `${S.Zs} Ω`;
  if (S.limitPercent) out['Povolený úbytok'] = `${S.limitPercent} %`;
  return out;
}

/* ───────────────── výpočet ───────────────── */

function buildInputs() {
  const phases = String(S.phases) === 'custom' ? (Number(S.U) > 300 ? 3 : 1) : Number(S.phases);
  return {
    mode: S.mode,
    phases,
    U: String(S.phases) === 'custom' ? S.U : '',
    material: S.material,
    insulation: S.insulation,
    method: S.method,
    device: S.device,
    loadMode: S.loadMode,
    power: S.loadMode === 'power' ? S.power : '',
    current: S.loadMode === 'current' ? S.current : '',
    cos: S.cos,
    diversity: S.diversity,
    L: S.L,
    S: S.S,
    In: S.In,
    ambient: S.ambient,
    circuits: S.circuits,
    loadedCores: S.loadedCores ? Number(S.loadedCores) : undefined,
    netType: S.netType,
    Ze: S.Ze,
    Zs: S.Zs,
    limitPercent: S.limitPercent,
    circuitPurpose: S.circuitPurpose,
    thd: S.thd,
    xPerM: S.xPerM,
    InUp: S.InUp,
    iaManual: S.iaManual ? Number(S.iaManual) : undefined,
    country: store.getCountry(),
  };
}

function recompute(root, ctx) {
  const box = root.querySelector('#calc-results');
  if (!box) return;
  const inputs = buildInputs();
  let r;
  try {
    r = S.mode === 'A' ? modeA(inputs, ctx.lookup)
      : S.mode === 'B' ? modeB(inputs, ctx.lookup)
        : S.mode === 'C' ? modeC(inputs, ctx.lookup)
          : modeD(inputs, ctx.lookup);
  } catch (e) {
    box.innerHTML = `<div class="banner bad"><strong>Neočekávaná chyba výpočtu:</strong> ${esc(e.message)}</div>`;
    console.error(e);
    return;
  }
  lastResult = r;

  let extra = '';
  if (S.mode === 'A' && r.chosen) extra = renderChosen(r);
  if (S.mode === 'C') extra = renderThreeLengths(r);
  if (S.mode === 'D') extra = renderQuickTable(r);
  if (S.mode === 'A' && r.tried?.length) extra += renderTried(r);

  box.innerHTML = extra + renderResult(r);
  if (r.headline) store.pushRecent({ module: 'calculator', inputs: { ...S }, headline: `${S.mode}: ${r.headline}` });
}

function renderChosen(r) {
  const c = r.chosen;
  return `<div class="hero">
    <div class="hero-main">
      <div class="hero-big">${esc(S.material)} ${esc(String(c.S).replace('.', ','))} mm²</div>
      <div class="hero-big">${esc(c.device)}${esc(c.In)} A</div>
    </div>
    <dl class="hero-kv">
      <div><dt>Prúd záťaže Ib</dt><dd>${fmt(r.Ib, 2)} A</dd></div>
      <div><dt>Iz po korekciách</dt><dd>${fmt(c.iz, 1)} A</dd></div>
      <div><dt>Úbytok napätia</dt><dd>${fmt(c.dropPercent, 2)} % (${fmt(c.dropVolts, 2)} V)</dd></div>
      <div><dt>PE</dt><dd>${fmt(c.Spe, 1)} mm²</dd></div>
      <div><dt>Zs / Zs max</dt><dd>${fmt(c.Zs, 3)} / ${fmt(c.zsMax, 3)} Ω</dd></div>
      <div><dt>Ik</dt><dd>${fmt(c.Ik, 0)} A</dd></div>
      <div><dt>Čas vypnutia</dt><dd>${c.tripTime !== undefined ? `${fmt(c.tripTime, 2)} s` : '—'}</dd></div>
      <div><dt>Kábel znesie</dt><dd>${c.tPerm !== undefined ? `${fmt(c.tPerm, 3)} s` : '—'}</dd></div>
    </dl>
  </div>`;
}

function renderThreeLengths(r) {
  const row = (key, label, v, note) => {
    const isMin = r.limitedKey === key;
    return `<div class="len-row ${isMin ? 'limiting' : ''}">
      <div class="len-label">${esc(label)}${isMin ? '<span class="pill">obmedzuje</span>' : ''}</div>
      <div class="len-val">${v === undefined || !Number.isFinite(v) ? '—' : `${fmt(Math.max(0, v), 1)} m`}</div>
      ${note ? `<div class="len-note">${esc(note)}</div>` : ''}
    </div>`;
  };
  const short = r.byShort || {};
  return `<div class="hero">
    <div class="hero-big">${r.maxLength !== undefined ? `${fmt(Math.max(0, r.maxLength), 1)} m` : '—'}</div>
    <p class="hero-sub">${r.limitedBy ? `Obmedzuje: <strong>${esc(r.limitedBy)}</strong>` : 'Nedá sa určiť'}</p>
    <div class="lens">
      ${row('drop', 'Podľa úbytku napätia', r.byDrop?.L, r.byDrop?.limit ? `limit ${r.byDrop.limit} %` : '')}
      ${row('disconnect', 'Podľa odpojenia poruchy', r.byDisconnect?.L, r.byDisconnect?.option ? `Ia = ${fmt(r.byDisconnect.option.ia, 0)} A, Zs max = ${fmt(r.byDisconnect.option.zsMax, 3)} Ω` : '')}
      ${row('short', 'Podľa skratovej odolnosti', short.impossible ? 0 : short.L,
        short.impossible ? 'kábel neodolá skratu pri tomto istení pri žiadnej dĺžke'
          : short.sameAsDisconnect ? 'neobmedzuje samostatne — rozhoduje odpojenie poruchy'
            : short.shortWarning ? `pozor aj na krátke trasy pod ${fmt(short.shortWarning, 1)} m` : '')}
    </div>
    <p class="muted small">Skratová odolnosť je najkritickejšia na začiatku obvodu, kde je skratový prúd najväčší. Preto pri veľmi krátkych trasách kontroluj aj to, či kábel znesie energiu pri plnom skratovom prúde.</p>
  </div>`;
}

function renderQuickTable(r) {
  if (!r.rows?.length) return '';
  return `<div class="hero">
    <p class="hero-sub">${esc(r.headline)}${r.kTemp !== undefined ? ` · korekcie ${fmt(r.kTemp, 2)} × ${fmt(r.kGroup, 2)}` : ''}</p>
    <div class="table-wrap">
      <table class="tbl">
        <thead><tr>
          <th>mm²</th><th>Iz tab.</th><th>Iz korig.</th><th>max. istenie</th>
          <th>L úbytok</th><th>L odpojenie</th><th>L max</th><th>obmedzuje</th>
        </tr></thead>
        <tbody>
        ${r.rows.map((x) => `<tr>
          <td><b>${String(x.S).replace('.', ',')}</b></td>
          <td>${fmt(x.izTable, 1)}</td>
          <td>${fmt(x.iz, 1)}</td>
          <td>${x.In ? `${S.device}${x.In}` : '—'}</td>
          <td>${x.lengths?.drop !== undefined ? fmt(x.lengths.drop, 0) : '—'}</td>
          <td>${x.lengths?.disconnect !== undefined ? fmt(Math.max(0, x.lengths.disconnect), 0) : '—'}</td>
          <td><b>${x.lengths?.max !== undefined ? fmt(Math.max(0, x.lengths.max), 0) : '—'}</b></td>
          <td class="small">${esc(x.lengths?.limitedBy || '—')}</td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="muted small">Dĺžky sú v metroch, počítané pre maximálne istenie v riadku a plný menovitý prúd. Pri menšom prúde záťaže sú dĺžky väčšie.</p>
  </div>`;
}

function renderTried(r) {
  const rows = r.tried.filter((x) => x.reasons.length);
  if (!rows.length) return '';
  return details(`Prečo neprešli menšie prierezy (${rows.length})`, `
    <ul class="tried">
      ${rows.map((x) => `<li><b>${String(x.S).replace('.', ',')} mm²</b> — ${esc(x.reasons.join('; '))}</li>`).join('')}
    </ul>`);
}
