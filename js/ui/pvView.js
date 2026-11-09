/** Fotovoltika — reťazec, DC kábel, AC kábel. */

import { esc, fieldNum, fieldSelect, segmented, details, toast } from './dom.js';
import { renderResult, resultToText } from './result.js';
import { pvString, pvDcCable, pvAcCable } from '../calc/pv.js';
import { fmt } from '../calc/core.js';
import * as store from '../store.js';
import { shareText, printResult } from '../share.js';

const KEY = 'edv.pv.v1';
const DEF = {
  tab: 'string',
  uocStc: '41.5', iscStc: '13.9', vmpStc: '34.5', tempCoeff: '', minTemp: '',
  invMaxV: '1000', invMaxA: '', mppMin: '200', modules: '14',
  dcCurrent: '13', dcL: '25', dcS: '6', dcU: '480',
  acPower: '10', acPhases: 3, acL: '20', acS: '6', acCos: '',
  job: '',
};
let S = load();
let last = null;

function load() { try { const r = localStorage.getItem(KEY); return r ? { ...DEF, ...JSON.parse(r) } : { ...DEF }; } catch { return { ...DEF }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

export const title = 'Fotovoltika';

const TABS = [
  { v: 'string', t: 'Reťazec a striedač' },
  { v: 'dc', t: 'DC kábel' },
  { v: 'ac', t: 'AC kábel' },
];

export function render(root, ctx) {
  root.innerHTML = `
    <div class="mode-strip small">
      ${TABS.map((t) => `<button type="button" class="mode-btn ${S.tab === t.v ? 'on' : ''}" data-tab="${t.v}"><span>${esc(t.t)}</span></button>`).join('')}
    </div>
    <form autocomplete="off">${fields()}</form>
    <div id="pv-results"></div>
  `;
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { S.tab = b.dataset.tab; save(); render(root, ctx); }));
  root.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => { S[b.dataset.seg] = b.dataset.val; save(); render(root, ctx); }));
  root.querySelectorAll('[data-input]').forEach((i) => {
    const f = () => { S[i.name] = i.value; save(); recompute(root, ctx); };
    i.addEventListener('input', f); i.addEventListener('change', f);
  });
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if (!a || !last) return;
    const meta = { job: S.job, country: store.getCountry(), inputs: {} };
    if (a.dataset.action === 'share-text') shareText(resultToText(last, meta), last.title);
    if (a.dataset.action === 'share-pdf') printResult({ title: last.title, job: S.job, country: store.getCountry(), text: resultToText(last, meta) });
    if (a.dataset.action === 'save-calc') {
      const name = prompt('Názov výpočtu:', `FV — ${S.tab}`);
      if (name === null) return;
      store.saveCalc({ name, job: S.job, module: 'pv', inputs: { ...S }, headline: last.headline, country: store.getCountry() });
      toast('Uložené.');
    }
  });
  recompute(root, ctx);
}

const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];

function fields() {
  if (S.tab === 'string') {
    return `<div class="grid">
      ${fieldNum({ name: 'uocStc', label: 'Uoc panelu (STC)', de: 'Leerlaufspannung', value: S.uocStc, unit: 'V', hint: 'Z datasheetu panelu' })}
      ${fieldNum({ name: 'iscStc', label: 'Isc panelu (STC)', de: 'Kurzschlussstrom', value: S.iscStc, unit: 'A' })}
      ${fieldNum({ name: 'vmpStc', label: 'Vmp panelu (STC)', de: 'MPP-Spannung', value: S.vmpStc, unit: 'V' })}
      ${fieldNum({ name: 'tempCoeff', label: 'Teplotný súčiniteľ Uoc', value: S.tempCoeff, unit: '%/K', placeholder: '−0,30', hint: 'VŽDY z datasheetu. Nezadané = predvolená typická hodnota.' })}
      ${fieldNum({ name: 'minTemp', label: 'Najnižšia návrhová teplota', value: S.minTemp, unit: '°C', placeholder: store.getCountry() === 'DE' ? '−10' : '−15', hint: 'Nezadané = predvolená podľa krajiny (PREDPOKLAD)' })}
      ${fieldNum({ name: 'modules', label: 'Počet panelov v reťazci', value: S.modules })}
      ${fieldNum({ name: 'invMaxV', label: 'Max. DC napätie striedača', value: S.invMaxV, unit: 'V' })}
      ${fieldNum({ name: 'invMaxA', label: 'Max. prúd vstupu striedača', value: S.invMaxA, unit: 'A' })}
      ${fieldNum({ name: 'mppMin', label: 'Dolná hranica MPP', value: S.mppMin, unit: 'V' })}
    </div>`;
  }
  if (S.tab === 'dc') {
    return `<div class="grid">
      ${fieldNum({ name: 'dcCurrent', label: 'Prúd reťazca (Impp)', value: S.dcCurrent, unit: 'A' })}
      ${fieldNum({ name: 'dcU', label: 'Napätie reťazca (Umpp)', value: S.dcU, unit: 'V' })}
      ${fieldNum({ name: 'dcL', label: 'Dĺžka (jedna cesta)', value: S.dcL, unit: 'm' })}
      ${fieldSelect({ name: 'dcS', label: 'Prierez DC kábla', value: S.dcS, options: SECTIONS.map((x) => ({ v: x, t: `${String(x).replace('.', ',')} mm²` })) })}
    </div>`;
  }
  return `<div class="grid">
    ${segmented({ name: 'acPhases', label: 'Striedač', value: S.acPhases, options: [{ v: 1, t: '1f' }, { v: 3, t: '3f' }] })}
    ${fieldNum({ name: 'acPower', label: 'AC výkon striedača', value: S.acPower, unit: 'kW' })}
    ${fieldNum({ name: 'acL', label: 'Dĺžka k rozvádzaču', value: S.acL, unit: 'm' })}
    ${fieldSelect({ name: 'acS', label: 'Prierez', value: S.acS, options: SECTIONS.map((x) => ({ v: x, t: `${String(x).replace('.', ',')} mm²` })) })}
    ${fieldNum({ name: 'acCos', label: 'cos φ striedača', value: S.acCos, placeholder: '1,00' })}
  </div>`;
}

function recompute(root, ctx) {
  const box = root.querySelector('#pv-results');
  const c = store.getCountry();
  let r, hero = '';
  if (S.tab === 'string') {
    r = pvString({
      uocStc: S.uocStc, iscStc: S.iscStc, vmpStc: S.vmpStc, tempCoeff: S.tempCoeff,
      minTemp: S.minTemp, modules: S.modules, invMaxV: S.invMaxV, invMaxA: S.invMaxA,
      mppMin: S.mppMin, country: c,
    }, ctx.lookup);
    if (r.uocCold) {
      hero = `<div class="hero">
        <div class="hero-big">${fmt(r.uocCold, 1)} V / panel</div>
        <p class="hero-sub">pri ${r.minTemp} °C · návrhový prúd ${fmt(r.iscDesign, 2)} A</p>
        <dl class="hero-kv">
          ${r.maxModules ? `<div><dt>Max. panelov v reťazci</dt><dd>${r.maxModules}</dd></div>` : ''}
          ${r.stringVoltage ? `<div><dt>Napätie reťazca pri mraze</dt><dd>${fmt(r.stringVoltage, 0)} V</dd></div>` : ''}
          ${r.stringFuse ? `<div><dt>Poistka reťazca (gPV)</dt><dd>${r.stringFuse} A</dd></div>` : ''}
        </dl>
      </div>`;
    }
  } else if (S.tab === 'dc') {
    r = pvDcCable({ current: S.dcCurrent, L: S.dcL, S: S.dcS, U: S.dcU, material: 'Cu' }, ctx.lookup);
    hero = `<div class="hero"><div class="hero-big">${fmt(r.value, 2)} V</div>
      <p class="hero-sub">${fmt(r.percent, 2)} % úbytok na DC strane</p></div>`;
  } else {
    r = pvAcCable({ power: S.acPower, phases: Number(S.acPhases), L: S.acL, S: S.acS, cos: S.acCos, material: 'Cu', country: c }, ctx.lookup);
    hero = `<div class="hero"><div class="hero-big">${fmt(r.I, 2)} A</div>
      <p class="hero-sub">úbytok ${fmt(r.percent, 2)} % (${fmt(r.value, 2)} V)</p></div>`;
  }
  last = r;
  box.innerHTML = hero + renderResult(r);
}
