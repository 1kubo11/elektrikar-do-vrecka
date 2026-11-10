/** Wallboxy. */

import { esc, fieldNum, fieldSelect, segmented, details, toast } from './dom.js';
import { renderResult, resultToText } from './result.js';
import { wallbox } from '../calc/wallbox.js';
import { fmt } from '../calc/core.js';
import { DATASETS } from '../data/norms.js';
import * as store from '../store.js';
import { shareText, printResult } from '../share.js';

const KEY = 'edv.wb.v1';
const DEF = {
  powerClass: '11', L: '20', material: 'Cu', insulation: 'PVC', method: 'B2',
  device: 'B', ambient: '', circuits: '', netType: 'TN-C-S', Ze: '', job: '',
};
let S = load();
let last = null;

function load() { try { const r = localStorage.getItem(KEY); return r ? { ...DEF, ...JSON.parse(r) } : { ...DEF }; } catch { return { ...DEF }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

export const title = 'Wallbox';

const PLACES = [
  { v: 'B2', t: 'Pod omietkou alebo v trubke' },
  { v: 'A2', t: 'V zateplenej stene' },
  { v: 'C', t: 'Na povrchu' },
  { v: 'D2', t: 'V zemi' },
];

function placeOptions() {
  if (store.isDetail()) {
    return ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2', 'E', 'F'].map((m) => ({ v: m, t: `${m} — ${DATASETS.installMethods.data[m].sk}` }));
  }
  return PLACES.some((p) => p.v === S.method) ? PLACES : [...PLACES, { v: S.method, t: `Uloženie ${S.method}` }];
}

export function render(root, ctx) {
  const detail = store.isDetail();
  root.innerHTML = `
    <form autocomplete="off">
      <div class="grid">
        ${segmented({ name: 'powerClass', label: 'Aký silný je wallbox?', de: 'Ladeleistung', value: S.powerClass, options: [
          { v: '3.7', t: '3,7 kW' }, { v: '7.4', t: '7,4 kW' }, { v: '11', t: '11 kW' }, { v: '22', t: '22 kW' },
        ] })}
        ${fieldNum({ name: 'L', label: 'Aký dlhý bude kábel?', de: 'Leitungslänge', value: S.L, unit: 'm', hint: 'Od rozvádzača po wallbox.' })}
        ${fieldSelect({ name: 'method', label: 'Kde bude kábel?', value: S.method, options: placeOptions() })}
      </div>
      ${details('Ďalšie možnosti', `<div class="grid">
        ${segmented({ name: 'material', label: 'Z čoho je kábel?', value: S.material, options: [{ v: 'Cu', t: 'Meď' }, { v: 'Al', t: 'Hliník' }] })}
        ${segmented({ name: 'device', label: 'Typ ističa', value: ['B', 'C'].includes(S.device) || detail ? S.device : 'B', options: detail
          ? [{ v: 'B', t: 'B' }, { v: 'C', t: 'C' }, { v: 'gG', t: 'gG' }]
          : [{ v: 'B', t: 'B — bežný' }, { v: 'C', t: 'C' }] })}
        ${fieldSelect({ name: 'circuits', label: 'Koľko káblov ide tesne pri sebe?', value: S.circuits === '' ? '1' : S.circuits,
          options: [1, 2, 3, 4, 5, 6].map((n) => ({ v: n, t: n === 1 ? '1 — ide sám' : `${n} káble spolu` })) })}
        ${fieldNum({ name: 'ambient', label: 'Teplota okolia', value: S.ambient, unit: '°C', placeholder: '30' })}
        ${detail ? `
          ${segmented({ name: 'insulation', label: 'Izolácia', value: S.insulation, options: [{ v: 'PVC', t: 'PVC' }, { v: 'XLPE', t: 'XLPE' }] })}
          ${fieldSelect({ name: 'netType', label: 'Typ siete', value: S.netType, options: ['TN-C', 'TN-S', 'TN-C-S', 'TT', 'IT'].map((x) => ({ v: x, t: x })) })}
          ${fieldNum({ name: 'Ze', label: 'Ze na začiatku', value: S.Ze, unit: 'Ω', placeholder: '0,35' })}` : ''}
      </div>`)}
    </form>
    <div id="wb-results"></div>
  `;
  root.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => { S[b.dataset.seg] = b.dataset.val; save(); render(root, ctx); }));
  root.querySelectorAll('[data-input]').forEach((i) => {
    const f = () => { S[i.name] = i.value; save(); recompute(root, ctx); };
    i.addEventListener('input', f); i.addEventListener('change', f);
  });
  root.onclick = (e) => {
    const a = e.target.closest('[data-action]');
    if (!a || !last) return;
    const meta = { job: S.job, country: store.getCountry(), inputs: { 'Výkon': `${S.powerClass} kW`, 'Dĺžka': `${S.L} m`, 'Uloženie': S.method } };
    if (a.dataset.action === 'share-text') shareText(resultToText(last, meta), last.title);
    if (a.dataset.action === 'share-pdf') printResult({ title: last.title, job: S.job, country: store.getCountry(), text: resultToText(last, meta) });
    if (a.dataset.action === 'save-calc') {
      const name = prompt('Názov výpočtu:', `Wallbox ${S.powerClass} kW`);
      if (name === null) return;
      store.saveCalc({ name, job: S.job, module: 'wallbox', inputs: { ...S }, headline: last.headline, country: store.getCountry() });
      toast('Uložené.');
    }
  };
  recompute(root, ctx);
}

function recompute(root, ctx) {
  const box = root.querySelector('#wb-results');
  const detail = store.isDetail();
  /* jednoduchý režim počíta len s tým, čo je na obrazovke */
  const inputs = detail ? { ...S } : {
    ...S, insulation: 'PVC', netType: 'TN-C-S', Ze: '',
    device: ['B', 'C'].includes(S.device) ? S.device : 'B',
  };
  const r = wallbox({ ...inputs, country: store.getCountry() }, ctx.lookup);
  if (!detail) {
    r.defaults.push({ what: 'izolácia', value: 'PVC', why: 'jednoduchý režim' });
    r.defaults.push({ what: 'sieť', value: 'TN (bežná domová)', why: 'jednoduchý režim' });
  }
  last = r;
  const de = store.getCountry() === 'DE';
  let hero = '';
  if (r.design) {
    const n = r.phases === 3 ? 5 : 3;
    const sec = String(r.design.S).replace('.', ',');
    hero = `<div class="answer">
      <div class="answer-title">Použi</div>
      <div class="answer-row"><span class="answer-k">Kábel</span>
        <span class="answer-v">${n}×${sec} mm²</span><span class="answer-s">${S.material === 'Al' ? 'hliník' : 'meď'}</span></div>
      <div class="answer-row"><span class="answer-k">Istič</span>
        <span class="answer-v">${esc(r.design.device)}${r.design.In}</span><span class="answer-s">${r.phases === 3 ? '3-pólový' : '1-pólový'}</span></div>
      <div class="answer-row"><span class="answer-k">Chránič</span>
        <span class="answer-v">typ A</span><span class="answer-s">30 mA</span></div>
      <p class="answer-note">Chránič typ A stačí len vtedy, keď má wallbox vlastnú DC ochranu 6 mA (pozri návod). Ak ju nemá, treba <b>typ B</b>.
        Wallbox daj na vlastný obvod, nič iné naň nepripájaj.</p>
    </div>`;
  }
  const rules = r.reporting ? details(`Čo treba ohlásiť — ${de ? 'Nemecko' : 'Slovensko'}`, `
      <ul>${r.reporting.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="small muted">Pravidlá sa menia. Pred montážou si ich over u prevádzkovateľa siete.</p>`) : '';
  box.innerHTML = hero + rules + renderResult(r);
}
