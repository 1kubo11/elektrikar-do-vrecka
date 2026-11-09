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

export const title = 'Wallboxy';

export function render(root, ctx) {
  root.innerHTML = `
    <form autocomplete="off">
      <div class="grid">
        ${segmented({ name: 'powerClass', label: 'Výkon wallboxu', de: 'Ladeleistung', value: S.powerClass, options: [
          { v: '3.7', t: '3,7 kW' }, { v: '7.4', t: '7,4 kW' }, { v: '11', t: '11 kW' }, { v: '22', t: '22 kW' },
        ] })}
        ${fieldNum({ name: 'L', label: 'Dĺžka prívodu', de: 'Leitungslänge', value: S.L, unit: 'm' })}
        ${segmented({ name: 'material', label: 'Materiál', value: S.material, options: [{ v: 'Cu', t: 'Cu' }, { v: 'Al', t: 'Al' }] })}
        ${segmented({ name: 'insulation', label: 'Izolácia', value: S.insulation, options: [{ v: 'PVC', t: 'PVC' }, { v: 'XLPE', t: 'XLPE' }] })}
        ${fieldSelect({ name: 'method', label: 'Spôsob uloženia', value: S.method, options: ['A1', 'A2', 'B1', 'B2', 'C', 'D1', 'D2', 'E', 'F'].map((m) => ({ v: m, t: `${m} — ${DATASETS.installMethods.data[m].sk}` })) })}
        ${fieldSelect({ name: 'device', label: 'Typ istenia', value: S.device, options: [
          { v: 'B', t: 'Istič B' }, { v: 'C', t: 'Istič C' }, { v: 'gG', t: 'Poistka gG' },
        ] })}
        ${fieldNum({ name: 'ambient', label: 'Teplota okolia', value: S.ambient, unit: '°C', placeholder: '30' })}
        ${fieldNum({ name: 'circuits', label: 'Počet súbežných obvodov', value: S.circuits, placeholder: '1' })}
        ${fieldSelect({ name: 'netType', label: 'Typ siete', value: S.netType, options: ['TN-C', 'TN-S', 'TN-C-S', 'TT', 'IT'].map((x) => ({ v: x, t: x })) })}
        ${fieldNum({ name: 'Ze', label: 'Ze na začiatku', value: S.Ze, unit: 'Ω', placeholder: '0,35' })}
      </div>
    </form>
    <div id="wb-results"></div>
  `;
  root.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => { S[b.dataset.seg] = b.dataset.val; save(); render(root, ctx); }));
  root.querySelectorAll('[data-input]').forEach((i) => {
    const f = () => { S[i.name] = i.value; save(); recompute(root, ctx); };
    i.addEventListener('input', f); i.addEventListener('change', f);
  });
  root.addEventListener('click', (e) => {
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
  });
  recompute(root, ctx);
}

function recompute(root, ctx) {
  const box = root.querySelector('#wb-results');
  const r = wallbox({ ...S, powerClass: S.powerClass, country: store.getCountry() }, ctx.lookup);
  last = r;
  let hero = '';
  if (r.design) {
    hero = `<div class="hero">
      <div class="hero-main">
        <div class="hero-big">${esc(S.material)} ${String(r.design.S).replace('.', ',')} mm²</div>
        <div class="hero-big">${esc(r.design.device)}${r.design.In} A</div>
      </div>
      <dl class="hero-kv">
        <div><dt>Nabíjací prúd</dt><dd>${r.current} A, ${r.phases}f</dd></div>
        <div><dt>Iz po korekciách</dt><dd>${fmt(r.design.iz, 1)} A</dd></div>
        <div><dt>Úbytok napätia</dt><dd>${fmt(r.design.dropPercent, 2)} %</dd></div>
        <div><dt>PE</dt><dd>${fmt(r.design.Spe, 1)} mm²</dd></div>
      </dl>
    </div>`;
  }
  const rules = r.reporting ? `<div class="banner info">
      <strong>Ochrana:</strong> ${esc(r.rcd || '')}
      <br><br><strong>Ohlasovacie povinnosti — ${store.getCountry() === 'DE' ? 'Nemecko' : 'Slovensko'} (NEOVERENÉ, stav k 11/2026):</strong>
      <ul>${r.reporting.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="small">Toto sa mení najčastejšie z celej aplikácie. Pred montážou si over aktuálne TAB a podmienky distribútora.</p>
    </div>` : '';
  box.innerHTML = hero + rules + renderResult(r);
}
