/**
 * Hlavná kalkulačka — kábel a istenie.
 *
 * JEDNODUCHÝ režim (predvolený): pár otázok bežnou rečou, jedna jasná odpoveď.
 * PODROBNÝ režim: všetky vstupy a celý rozpis — pre projekt a revíziu.
 */

import { esc, fieldNum, fieldSelect, segmented, details, toast } from './dom.js';
import { renderResult, resultToText } from './result.js';
import { methodIcon } from './methodIcons.js';
import { modeA, modeB, modeC, modeD } from '../calc/design.js';
import { CROSS_SECTIONS, fmt } from '../calc/core.js';
import { DATASETS } from '../data/norms.js';
import { CABLES } from '../data/cables.js';
import * as store from '../store.js';
import { shareText, printResult } from '../share.js';

const MODES = [
  { v: 'A', t: 'Aký kábel?', sub: 'Viem, čo zapájam a ako ďaleko. Chcem vedieť kábel a istič.' },
  { v: 'B', t: 'Aký istič?', sub: 'Mám kábel. Aký najväčší istič naň môžem dať?' },
  { v: 'C', t: 'Aká dĺžka?', sub: 'Mám kábel aj istič. Ako ďaleko s ním môžem ísť?' },
  { v: 'D', t: 'Tabuľka', sub: 'Prehľad: prierez, čo unesie, aký istič a do akej dĺžky.' },
];

const METHODS = ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2', 'E', 'F'];

/** Jednoduchý výber uloženia — štyri bežné prípady. */
const PLACES = [
  { m: 'B2', t: 'Pod omietkou alebo v trubke', s: 'bežná stena, chránička' },
  { m: 'A2', t: 'V zateplenej stene', s: 'sadrokartón s vatou' },
  { m: 'C', t: 'Na povrchu', s: 'na stene, strope, v rošte' },
  { m: 'D2', t: 'V zemi', s: 'zemný kábel' },
];

/** Čo zapájaš — rýchle predvoľby. */
const PRESETS = [
  { id: 'sockets', t: 'Zásuvky', s: 'istič 16 A', set: { loadMode: 'current', current: '16', phases: 1 } },
  { id: 'lights', t: 'Svetlá', s: 'istič 10 A', set: { loadMode: 'current', current: '10', phases: 1 } },
  { id: 'cooker', t: 'Sporák', s: '3 fázy, 16 A', set: { loadMode: 'current', current: '16', phases: 3 } },
  { id: 'custom', t: 'Niečo iné', s: 'zadám výkon', set: { loadMode: 'power' } },
];

const COMMON_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
const CALC_KEY = 'edv.calc.v1';

const DEFAULT_STATE = {
  mode: 'A',
  preset: 'sockets',
  material: 'Cu',
  insulation: 'PVC',
  cableType: 'NYM',
  method: 'B2',
  phases: 1,
  U: '',
  loadMode: 'current',
  power: '3.5',
  current: '16',
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
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const st = { ...DEFAULT_STATE, ...parsed };
    if (!parsed.preset) st.preset = 'custom'; // stav uložený staršou verziou
    return st;
  } catch { return { ...DEFAULT_STATE }; }
}
function saveState(s) {
  try { localStorage.setItem(CALC_KEY, JSON.stringify(s)); } catch {}
}

let S = loadState();
let lastResult = null;

export function setInputs(inputs) {
  S = { ...S, ...inputs };
  if (!inputs.preset) S.preset = 'custom';
  saveState(S);
}

export const title = 'Kábel a istenie';

const isGround = () => S.method === 'D1' || S.method === 'D2';
const simpleDevice = () => (['B', 'C'].includes(S.device) ? S.device : 'B');
const simplePhases = () => (Number(S.phases) === 3 ? 3 : 1);
const comma = (x) => String(x).replace('.', ',');

export function render(root, ctx) {
  const detail = store.isDetail();
  root.innerHTML = `
    <div class="mode-strip">
      ${MODES.map((m) => `<button type="button" class="mode-btn ${S.mode === m.v ? 'on' : ''}" data-mode="${m.v}">
        <span>${esc(m.t)}</span></button>`).join('')}
    </div>
    <p class="mode-sub">${esc(MODES.find((m) => m.v === S.mode).sub)}</p>
    <form id="calc-form" autocomplete="off">${detail ? formDetail() : formSimple()}</form>
    <div id="calc-results"></div>
    <p class="mode-toggle">
      ${detail
        ? '<button type="button" class="link-btn" data-detail="0">← Späť na jednoduchý režim</button>'
        : '<button type="button" class="link-btn" data-detail="1">Potrebujem viac nastavení → podrobný režim</button>'}
    </p>
  `;
  bind(root, ctx);
  recompute(root, ctx);
}

/* ═══════════════════ JEDNODUCHÝ FORMULÁR ═══════════════════ */

function formSimple() {
  const mode = S.mode;
  const custom = S.preset === 'custom';

  const what = mode === 'A' ? `
    <div class="q">
      <span class="q-label">Čo zapájaš?</span>
      <div class="tiles tiles-4">
        ${PRESETS.map((p) => `<button type="button" class="tile ${S.preset === p.id ? 'on' : ''}" data-preset="${p.id}">
          <b>${esc(p.t)}</b><span>${esc(p.s)}</span></button>`).join('')}
      </div>
    </div>
    ${custom ? `<div class="grid">
      ${segmented({ name: 'phases', label: 'Koľko fáz?', value: simplePhases(), options: [
        { v: 1, t: '1 fáza · 230 V' }, { v: 3, t: '3 fázy · 400 V' },
      ] })}
      ${segmented({ name: 'loadMode', label: 'Poznám', value: S.loadMode, options: [
        { v: 'power', t: 'výkon (kW)' }, { v: 'current', t: 'prúd (A)' },
      ] })}
      ${S.loadMode === 'power'
        ? fieldNum({ name: 'power', label: 'Výkon spotrebiča', value: S.power, unit: 'kW' })
        : fieldNum({ name: 'current', label: 'Prúd spotrebiča', value: S.current, unit: 'A' })}
    </div>` : ''}` : '';

  const phasesQ = mode !== 'A' ? segmented({ name: 'phases', label: 'Koľko fáz?', value: simplePhases(), options: [
    { v: 1, t: '1 fáza · 230 V' }, { v: 3, t: '3 fázy · 400 V' },
  ] }) : '';

  const sectionQ = mode === 'B' || mode === 'C' ? fieldSelect({ name: 'S', label: 'Aký hrubý je kábel?', value: S.S,
    options: CROSS_SECTIONS.map((x) => ({ v: x, t: `${comma(x)} mm²` })) }) : '';

  const ratings = COMMON_RATINGS.includes(Number(S.In)) ? COMMON_RATINGS : [...COMMON_RATINGS, Number(S.In)].filter(Boolean).sort((a, b) => a - b);
  const ratingQ = mode === 'C' ? fieldSelect({ name: 'In', label: 'Aký je istič?', value: S.In,
    options: ratings.map((x) => ({ v: x, t: `${x} A` })) }) : '';

  const lengthQ = mode === 'A' ? fieldNum({ name: 'L', label: 'Aký dlhý bude kábel?', value: S.L, unit: 'm',
    hint: 'Od rozvádzača po posledný spotrebič.' }) : '';

  const inPlaces = PLACES.some((p) => p.m === S.method);
  const placeQ = `<div class="q">
    <span class="q-label">Kde bude kábel?</span>
    <div class="tiles tiles-2">
      ${PLACES.map((p) => `<button type="button" class="tile place ${S.method === p.m ? 'on' : ''}" data-place="${p.m}">
        ${methodIcon(p.m)}<b>${esc(p.t)}</b><span>${esc(p.s)}</span></button>`).join('')}
    </div>
    ${inPlaces ? '' : `<p class="field-hint">Teraz je vybrané uloženie ${esc(S.method)} z podrobného režimu.</p>`}
  </div>`;

  const circ = S.circuits === '' ? '1' : String(S.circuits);
  const tempOpts = [{ v: '', t: 'Bežná (do 30 °C)' }, { v: '40', t: 'Teplo (do 40 °C)' }, { v: '50', t: 'Horúco (do 50 °C)' }];
  if (S.ambient !== '' && !tempOpts.some((o) => o.v === String(S.ambient))) tempOpts.push({ v: S.ambient, t: `${S.ambient} °C` });

  const more = details('Ďalšie možnosti', `<div class="grid">
    ${segmented({ name: 'material', label: 'Z čoho je kábel?', value: S.material, options: [
      { v: 'Cu', t: 'Meď' }, { v: 'Al', t: 'Hliník' },
    ] })}
    <div>${segmented({ name: 'device', label: 'Typ ističa', value: simpleDevice(), options: [
      { v: 'B', t: 'B — bežný' }, { v: 'C', t: 'C — na nárazy' },
    ] })}<span class="field-hint">B stačí skoro vždy. C daj tam, kde pri zapnutí vyhadzuje B (veľa LED zdrojov, motorček).</span></div>
    ${fieldSelect({ name: 'circuits', label: 'Koľko káblov ide tesne pri sebe?', value: circ,
      options: [1, 2, 3, 4, 5, 6].map((n) => ({ v: n, t: n === 1 ? '1 — ide sám' : `${n} káble spolu` })),
      hint: 'Káble vo zväzku sa navzájom ohrievajú a unesú menej.' })}
    ${isGround() ? '' : fieldSelect({ name: 'ambient', label: 'Aká je tam teplota?', value: S.ambient, options: tempOpts,
      hint: 'Napr. povala v lete alebo kotolňa = teplo.' })}
  </div>`);

  return `
    ${what}
    <div class="grid">
      ${phasesQ}
      ${sectionQ}
      ${ratingQ}
      ${lengthQ}
    </div>
    ${placeQ}
    ${more}
  `;
}

/* ═══════════════════ PODROBNÝ FORMULÁR ═══════════════════ */

function formDetail() {
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
      options: CROSS_SECTIONS.map((x) => ({ v: x, t: `${comma(x)} mm²` })) }) : ''}

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
    ${fieldNum({ name: 'ambient', label: isGround() ? 'Teplota zeme' : 'Teplota okolia',
      de: isGround() ? 'Erdtemperatur' : 'Umgebungstemperatur',
      value: S.ambient, unit: '°C', placeholder: isGround() ? '20' : '30',
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
        hint: `Nezadané = ${dropHint()} podľa krajiny a typu obvodu` })}
      ${fieldNum({ name: 'xPerM', label: 'Reaktancia X′', de: 'Reaktanz', value: S.xPerM, unit: 'Ω/m', placeholder: '0',
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

function dropHint() {
  const v = DATASETS.voltageDropLimits.data[store.getCountry()]?.[S.circuitPurpose];
  return v ? `${v} %` : 'hodnota z dát';
}

/* ═══════════════════ UDALOSTI ═══════════════════ */

/** Keď používateľ zmení niečo, čo predvoľba nastavila, už to nie je tá predvoľba. */
function syncPreset() {
  const p = PRESETS.find((x) => x.id === S.preset);
  if (!p?.set) return;
  if (!Object.entries(p.set).every(([k, v]) => String(S[k]) === String(v))) S.preset = 'custom';
}

function bind(root, ctx) {
  const rerender = () => { syncPreset(); saveState(S); render(root, ctx); };

  root.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => { S.mode = b.dataset.mode; rerender(); });
  });
  root.querySelectorAll('[data-method]').forEach((b) => {
    b.addEventListener('click', () => { S.method = b.dataset.method; rerender(); });
  });
  root.querySelectorAll('[data-place]').forEach((b) => {
    b.addEventListener('click', () => { S.method = b.dataset.place; rerender(); });
  });
  root.querySelectorAll('[data-preset]').forEach((b) => {
    b.addEventListener('click', () => {
      const p = PRESETS.find((x) => x.id === b.dataset.preset);
      S.preset = p.id;
      if (p.set) Object.assign(S, p.set);
      rerender();
    });
  });
  root.querySelectorAll('[data-seg]').forEach((b) => {
    b.addEventListener('click', () => { S[b.dataset.seg] = b.dataset.val; rerender(); });
  });
  root.querySelectorAll('[data-detail]').forEach((b) => {
    b.addEventListener('click', () => {
      store.setDetail(b.dataset.detail === '1');
      render(root, ctx);
      window.scrollTo(0, 0);
    });
  });
  root.querySelectorAll('[data-input]').forEach((inp) => {
    const handler = () => {
      S[inp.name] = inp.value;
      syncPreset();
      saveState(S);
      if (['device', 'cableType', 'circuitPurpose', 'netType'].includes(inp.name)) render(root, ctx);
      else recompute(root, ctx);
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });

  root.onclick = (e) => {
    const a = e.target.closest('[data-action]');
    if (!a || !lastResult) return;
    const meta = { job: S.job, country: store.getCountry(), inputs: inputSummary() };
    if (a.dataset.action === 'share-text') {
      shareText(resultToText(lastResult, meta), lastResult.title);
    } else if (a.dataset.action === 'share-pdf') {
      printResult({ title: lastResult.title, job: S.job, country: store.getCountry(), text: resultToText(lastResult, meta) });
    } else if (a.dataset.action === 'save-calc') {
      const name = prompt('Názov (napr. zákazka alebo miestnosť):', S.job || '');
      if (name === null) return;
      S.job = name || S.job;
      store.saveCalc({ name: name || 'Bez názvu', job: S.job, module: 'calculator', inputs: { ...S }, headline: lastResult.headline, country: store.getCountry() });
      toast('Výpočet uložený.');
    }
  };
}

function inputSummary() {
  const out = {
    'Úloha': MODES.find((m) => m.v === S.mode).t,
    'Sieť': String(S.phases) === 'custom' ? `${S.U} V` : (Number(S.phases) === 3 ? '3f 400 V' : '1f 230 V'),
    'Materiál': S.material,
    'Izolácia': store.isDetail() ? S.insulation : 'PVC',
    'Uloženie': `${S.method} — ${DATASETS.installMethods.data[S.method]?.sk || ''}`,
    'Istenie': (store.isDetail() ? S.device : simpleDevice()) + (S.In && S.mode === 'C' ? ` ${S.In} A` : ''),
  };
  if (S.mode === 'A') out[S.loadMode === 'power' ? 'Výkon' : 'Prúd záťaže'] = S.loadMode === 'power' ? `${S.power} kW` : `${S.current} A`;
  if (S.S && (S.mode === 'B' || S.mode === 'C')) out['Prierez'] = `${S.S} mm²`;
  if (S.L && S.mode === 'A') out['Dĺžka'] = `${S.L} m`;
  if (S.ambient) out['Teplota'] = `${S.ambient} °C`;
  if (S.circuits) out['Súbežné obvody'] = S.circuits;
  if (store.isDetail()) {
    out['Typ kábla'] = S.cableType;
    out['Typ siete'] = S.netType;
    if (S.cos) out['cos φ'] = S.cos;
    if (S.diversity) out['Súčasnosť'] = S.diversity;
    if (S.Ze) out['Ze'] = `${S.Ze} Ω`;
    if (S.Zs) out['Nameraná Zs'] = `${S.Zs} Ω`;
    if (S.limitPercent) out['Povolený úbytok'] = `${S.limitPercent} %`;
  }
  return out;
}

/* ═══════════════════ VÝPOČET ═══════════════════ */

function buildInputs() {
  const country = store.getCountry();

  /* jednoduchý režim počíta LEN s tým, čo je na obrazovke — nič skryté z podrobného */
  if (!store.isDetail()) {
    return {
      phases: simplePhases(),
      U: '',
      material: S.material,
      insulation: 'PVC',
      method: S.method,
      device: simpleDevice(),
      loadMode: S.loadMode,
      power: S.loadMode === 'power' ? S.power : '',
      current: S.mode === 'A' && S.loadMode === 'current' ? S.current : '',
      L: S.mode === 'A' ? S.L : '',
      S: S.S,
      In: S.In,
      ambient: isGround() ? '' : S.ambient,
      circuits: S.circuits,
      netType: 'TN-C-S',
      circuitPurpose: S.mode === 'A' && S.preset === 'lights' ? 'lighting' : 'power',
      country,
    };
  }

  const phases = String(S.phases) === 'custom' ? (Number(S.U) > 300 ? 3 : 1) : Number(S.phases);
  return {
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
    country,
  };
}

function recompute(root, ctx) {
  const box = root.querySelector('#calc-results');
  if (!box) return;
  const detail = store.isDetail();
  const inputs = buildInputs();
  let r;
  try {
    r = S.mode === 'A' ? modeA(inputs, ctx.lookup)
      : S.mode === 'B' ? modeB(inputs, ctx.lookup)
        : S.mode === 'C' ? modeC(inputs, ctx.lookup)
          : modeD(inputs, ctx.lookup);
  } catch (e) {
    box.innerHTML = `<div class="banner bad"><strong>Neočakávaná chyba výpočtu:</strong> ${esc(e.message)}</div>`;
    console.error(e);
    return;
  }

  if (!detail) {
    /* aj to, čo jednoduchý režim nastavuje sám, musí byť pri výsledku vidieť */
    r.defaults.push({ what: 'izolácia', value: 'PVC', why: 'jednoduchý režim' });
    r.defaults.push({ what: 'sieť', value: 'TN (bežná domová)', why: 'jednoduchý režim' });
  }
  lastResult = r;

  let extra = '';
  if (detail) {
    if (S.mode === 'A' && r.chosen) extra = heroDetailA(r);
    if (S.mode === 'C') extra = heroLengths(r, true);
    if (S.mode === 'D') extra = quickTable(r, true);
    if (S.mode === 'A' && r.tried?.length) extra += tried(r);
  } else {
    if (S.mode === 'A' && r.chosen) extra = answerA(r, inputs);
    if (S.mode === 'B' && r.In) extra = answerB(r);
    if (S.mode === 'C' && r.maxLength !== undefined) extra = heroLengths(r, false);
    if (S.mode === 'D') extra = quickTable(r, false);
  }

  box.innerHTML = extra + renderResult(r);
  if (r.headline) store.pushRecent({ module: 'calculator', inputs: { ...S }, headline: `${MODES.find((m) => m.v === S.mode).t} ${r.headline}` });
}

/* ───────── jednoduché odpovede ───────── */

function cableName(sec, phases, Spe) {
  const n = phases === 3 ? 5 : 3;
  if (!Spe || Spe === sec) return `${n}×${comma(sec)} mm²`;
  return `${n - 1}×${comma(sec)} + PE ${comma(Spe)} mm²`;
}

function alNote() {
  return S.material === 'Al'
    ? '<p class="answer-warn">Hliník: len do svoriek určených na hliník a dotiahnuť momentom od výrobcu. Nikdy nespájaj priamo s meďou.</p>'
    : '';
}

function answerA(r, inputs) {
  const c = r.chosen;
  return `<div class="answer">
    <div class="answer-title">Použi</div>
    <div class="answer-row"><span class="answer-k">Kábel</span>
      <span class="answer-v">${esc(cableName(c.S, inputs.phases, c.Spe))}</span>
      <span class="answer-s">${S.material === 'Al' ? 'hliník' : 'meď'}</span></div>
    <div class="answer-row"><span class="answer-k">Istič</span>
      <span class="answer-v">${esc(c.device)}${esc(c.In)}</span>
      <span class="answer-s">${esc(c.In)} A</span></div>
    ${alNote()}
  </div>`;
}

function answerB(r) {
  return `<div class="answer">
    <div class="answer-title">Na tento kábel najviac</div>
    <div class="answer-row"><span class="answer-k">Istič</span>
      <span class="answer-v">${esc(simpleDevice())}${esc(r.In)}</span>
      <span class="answer-s">kábel unesie ${fmt(r.iz, 0)} A</span></div>
    ${alNote()}
  </div>`;
}

/* ───────── podrobné bloky ───────── */

function heroDetailA(r) {
  const c = r.chosen;
  return `<div class="hero">
    <div class="hero-main">
      <div class="hero-big">${esc(S.material)} ${esc(comma(c.S))} mm²</div>
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

function heroLengths(r, detail) {
  const row = (key, label, v, note) => {
    const isMin = r.limitedKey === key;
    return `<div class="len-row ${isMin ? 'limiting' : ''}">
      <div class="len-label">${esc(label)}${isMin ? '<span class="pill">toto rozhoduje</span>' : ''}</div>
      <div class="len-val">${v === undefined || !Number.isFinite(v) ? '—' : `${fmt(Math.max(0, v), detail ? 1 : 0)} m`}</div>
      ${note && detail ? `<div class="len-note">${esc(note)}</div>` : ''}
    </div>`;
  };
  const short = r.byShort || {};
  const max = r.maxLength !== undefined ? `${fmt(Math.max(0, r.maxLength), detail ? 1 : 0)} m` : '—';

  if (!detail) {
    return `<div class="answer">
      <div class="answer-title">Najďalej môžeš ísť</div>
      <div class="answer-row"><span class="answer-k">Dĺžka</span><span class="answer-v">${max}</span></div>
      <div class="lens">
        ${row('drop', 'aby nekleslo napätie', r.byDrop?.L)}
        ${row('disconnect', 'aby istič pri poruche vypol', r.byDisconnect?.L)}
        ${short.impossible ? row('short', 'aby kábel vydržal skrat', 0) : ''}
      </div>
      ${alNote()}
    </div>`;
  }

  return `<div class="hero">
    <div class="hero-big">${max}</div>
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

function quickTable(r, detail) {
  if (!r.rows?.length) return '';
  const dev = detail ? S.device : simpleDevice();
  const len = (v) => (v !== undefined && Number.isFinite(v) ? fmt(Math.max(0, v), 0) : '—');

  if (!detail) {
    const rows = r.rows.filter((x) => x.S <= 50);
    return `<div class="answer">
      <div class="table-wrap">
        <table class="tbl big">
          <thead><tr><th>Kábel</th><th>Unesie</th><th>Istič</th><th>Najďalej</th></tr></thead>
          <tbody>
          ${rows.map((x) => `<tr>
            <td><b>${comma(x.S)}</b> mm²</td>
            <td>${fmt(x.iz, 0)} A</td>
            <td><b>${x.In ? `${dev}${x.In}` : '—'}</b></td>
            <td>${x.lengths?.max > 0.5 ? `${len(x.lengths.max)} m` : 'nevyjde'}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="muted small">Dĺžka platí pre najväčší istič v riadku pri plnom zaťažení. Pri menšom odbere môžeš ísť ďalej.
        „Nevyjde“ znamená, že taký veľký istič by v bežnej sieti pri poruche nevypol včas — treba poistky alebo zmerať sieť.</p>
    </div>`;
  }

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
          <td><b>${comma(x.S)}</b></td>
          <td>${fmt(x.izTable, 1)}</td>
          <td>${fmt(x.iz, 1)}</td>
          <td>${x.In ? `${dev}${x.In}` : '—'}</td>
          <td>${len(x.lengths?.drop)}</td>
          <td>${len(x.lengths?.disconnect)}</td>
          <td><b>${len(x.lengths?.max)}</b></td>
          <td class="small">${esc(x.lengths?.limitedBy || '—')}</td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="muted small">Dĺžky sú v metroch, počítané pre maximálne istenie v riadku a plný menovitý prúd. Pri menšom prúde záťaže sú dĺžky väčšie.</p>
  </div>`;
}

function tried(r) {
  const rows = r.tried.filter((x) => x.reasons.length);
  if (!rows.length) return '';
  return details(`Prečo neprešli menšie prierezy (${rows.length})`, `
    <ul class="tried">
      ${rows.map((x) => `<li><b>${comma(x.S)} mm²</b> — ${esc(x.reasons.join('; '))}</li>`).join('')}
    </ul>`);
}
