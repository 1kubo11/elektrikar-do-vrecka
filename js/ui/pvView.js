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
  { v: 'string', t: 'Koľko panelov?' },
  { v: 'dc', t: 'Kábel od panelov' },
  { v: 'ac', t: 'Kábel od striedača' },
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
  root.onclick = (e) => {
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
  };
  recompute(root, ctx);
}

const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];

function fields() {
  if (S.tab === 'string') {
    return `<p class="mode-sub">Koľko panelov môžem zapojiť za sebou, aby v mraze nezničili striedač?</p>
    <div class="grid">
      ${fieldNum({ name: 'uocStc', label: 'Napätie panelu naprázdno (Uoc)', de: 'Leerlaufspannung', value: S.uocStc, unit: 'V', hint: 'Zo štítku alebo datasheetu panelu.' })}
      ${fieldNum({ name: 'iscStc', label: 'Skratový prúd panelu (Isc)', de: 'Kurzschlussstrom', value: S.iscStc, unit: 'A' })}
      ${fieldNum({ name: 'invMaxV', label: 'Najvyššie napätie striedača', value: S.invMaxV, unit: 'V', hint: 'V datasheete ako „max. DC voltage“.' })}
      ${fieldNum({ name: 'modules', label: 'Koľko panelov chcem v rade', value: S.modules })}
    </div>
    ${details('Presnejšie údaje (nepovinné)', `<div class="grid">
      ${fieldNum({ name: 'tempCoeff', label: 'Teplotný súčiniteľ Uoc', value: S.tempCoeff, unit: '%/K', placeholder: '−0,30', hint: 'Z datasheetu panelu. Keď nevyplníš, počítam s bežnou hodnotou.' })}
      ${fieldNum({ name: 'minTemp', label: 'Najnižšia teplota v zime', value: S.minTemp, unit: '°C', placeholder: store.getCountry() === 'DE' ? '−10' : '−15' })}
      ${fieldNum({ name: 'vmpStc', label: 'Pracovné napätie panelu (Vmp)', de: 'MPP-Spannung', value: S.vmpStc, unit: 'V' })}
      ${fieldNum({ name: 'mppMin', label: 'Od akého napätia striedač pracuje', value: S.mppMin, unit: 'V', hint: 'Dolná hranica MPP.' })}
      ${fieldNum({ name: 'invMaxA', label: 'Najvyšší prúd vstupu striedača', value: S.invMaxA, unit: 'A' })}
    </div>`)}`;
  }
  if (S.tab === 'dc') {
    return `<p class="mode-sub">Koľko napätia sa stratí v kábli medzi panelmi a striedačom?</p>
    <div class="grid">
      ${fieldNum({ name: 'dcCurrent', label: 'Prúd z panelov (Impp)', value: S.dcCurrent, unit: 'A' })}
      ${fieldNum({ name: 'dcU', label: 'Napätie radu panelov (Umpp)', value: S.dcU, unit: 'V' })}
      ${fieldNum({ name: 'dcL', label: 'Dĺžka kábla (jedným smerom)', value: S.dcL, unit: 'm' })}
      ${fieldSelect({ name: 'dcS', label: 'Hrúbka kábla', value: S.dcS, options: SECTIONS.map((x) => ({ v: x, t: `${String(x).replace('.', ',')} mm²` })) })}
    </div>`;
  }
  return `<p class="mode-sub">Koľko napätia sa stratí v kábli medzi striedačom a rozvádzačom?</p>
  <div class="grid">
    ${segmented({ name: 'acPhases', label: 'Striedač je', value: S.acPhases, options: [{ v: 1, t: '1-fázový' }, { v: 3, t: '3-fázový' }] })}
    ${fieldNum({ name: 'acPower', label: 'Výkon striedača', value: S.acPower, unit: 'kW' })}
    ${fieldNum({ name: 'acL', label: 'Dĺžka kábla k rozvádzaču', value: S.acL, unit: 'm' })}
    ${fieldSelect({ name: 'acS', label: 'Hrúbka kábla', value: S.acS, options: SECTIONS.map((x) => ({ v: x, t: `${String(x).replace('.', ',')} mm²` })) })}
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
      hero = `<div class="answer">
        <div class="answer-title">Do jedného radu</div>
        ${r.maxModules ? `<div class="answer-row"><span class="answer-k">Najviac</span>
          <span class="answer-v">${r.maxModules} panelov</span></div>` : ''}
        ${r.stringVoltage ? `<div class="answer-row"><span class="answer-k">Tvoj rad</span>
          <span class="answer-v">${fmt(r.stringVoltage, 0)} V</span><span class="answer-s">v mraze ${r.minTemp} °C</span></div>` : ''}
        <p class="answer-note">V mraze má každý panel ${fmt(r.uocCold, 1)} V namiesto ${String(S.uocStc).replace('.', ',')} V.
          Kábel a poistky počítaj na ${fmt(r.iscDesign, 1)} A.</p>
      </div>`;
    }
  } else if (S.tab === 'dc') {
    r = pvDcCable({ current: S.dcCurrent, L: S.dcL, S: S.dcS, U: S.dcU, material: 'Cu' }, ctx.lookup);
    if (r.percent !== undefined) {
      hero = `<div class="answer">
        <div class="answer-title">V kábli sa stratí</div>
        <div class="answer-row"><span class="answer-k">Úbytok</span>
          <span class="answer-v">${fmt(r.percent, 1)} %</span><span class="answer-s">${fmt(r.value, 1)} V</span></div>
        <p class="answer-note">Na strane panelov použi len solárny kábel (H1Z2Z2-K), nie bežný NYM.</p>
      </div>`;
    }
  } else {
    r = pvAcCable({ power: S.acPower, phases: Number(S.acPhases), L: S.acL, S: S.acS, cos: '', material: 'Cu', country: c }, ctx.lookup);
    if (r.percent !== undefined) {
      hero = `<div class="answer">
        <div class="answer-title">Striedač ${String(S.acPower).replace('.', ',')} kW</div>
        <div class="answer-row"><span class="answer-k">Prúd</span>
          <span class="answer-v">${fmt(r.I, 1)} A</span></div>
        <div class="answer-row"><span class="answer-k">Úbytok</span>
          <span class="answer-v">${fmt(r.percent, 1)} %</span><span class="answer-s">${fmt(r.value, 1)} V</span></div>
      </div>`;
    }
  }
  last = r;
  box.innerHTML = hero + renderResult(r);
}
