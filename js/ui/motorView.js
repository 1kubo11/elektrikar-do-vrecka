/** Motory a prúdy. */

import { esc, fieldNum, fieldSelect, segmented, details, toast } from './dom.js';
import { renderResult, resultToText } from './result.js';
import { motor, conversions } from '../calc/motor.js';
import { fmt } from '../calc/core.js';
import * as store from '../store.js';
import { shareText, printResult } from '../share.js';

const KEY = 'edv.motor.v1';
const DEF = {
  phases: 3, power: '7.5', U: '', cos: '', efficiency: '', startMode: 'direct', startMultiple: '',
  L: '', S: '', material: 'Cu', targetCos: '', job: '',
};
let S = load();
let last = null;

function load() { try { const r = localStorage.getItem(KEY); return r ? { ...DEF, ...JSON.parse(r) } : { ...DEF }; } catch { return { ...DEF }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

export const title = 'Motory a prúdy';

export function render(root, ctx) {
  root.innerHTML = `
    <form autocomplete="off">
      <div class="grid">
        ${segmented({ name: 'phases', label: 'Sieť', value: S.phases, options: [{ v: 1, t: '1f 230 V' }, { v: 3, t: '3f 400 V' }] })}
        ${fieldNum({ name: 'power', label: 'Výkon na štítku', de: 'Nennleistung', value: S.power, unit: 'kW' })}
        ${fieldNum({ name: 'U', label: 'Napätie', de: 'Spannung', value: S.U, unit: 'V', placeholder: Number(S.phases) === 3 ? '400' : '230' })}
        ${fieldNum({ name: 'cos', label: 'cos φ zo štítku', value: S.cos, placeholder: 'z dát', hint: 'Nezadané = orientačná hodnota podľa výkonu (NEOVERENÉ)' })}
        ${fieldNum({ name: 'efficiency', label: 'Účinnosť η zo štítku', value: S.efficiency, placeholder: 'z dát', hint: 'Napr. 0,9. Nezadané = orientačná hodnota' })}
        ${fieldSelect({ name: 'startMode', label: 'Spôsob rozbehu', de: 'Anlaufart', value: S.startMode, options: [
          { v: 'direct', t: 'Priamy štart (DOL)' },
          { v: 'stardelta', t: 'Hviezda-trojuholník (Y/D)' },
          { v: 'softstart', t: 'Softštart' },
          { v: 'vfd', t: 'Frekvenčný menič' },
        ] })}
        ${fieldNum({ name: 'startMultiple', label: 'Násobok Ia/In zo štítku', value: S.startMultiple, placeholder: 'z dát' })}
        ${fieldNum({ name: 'targetCos', label: 'Cieľový cos φ (kompenzácia)', value: S.targetCos, placeholder: 'napr. 0,95' })}
      </div>
      ${details('Prívodný kábel — úbytok pri rozbehu', `<div class="grid">
        ${fieldNum({ name: 'L', label: 'Dĺžka prívodu', value: S.L, unit: 'm' })}
        ${fieldSelect({ name: 'S', label: 'Prierez', value: S.S, options: [{ v: '', t: '—' }, ...[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95].map((x) => ({ v: x, t: `${String(x).replace('.', ',')} mm²` }))] })}
        ${segmented({ name: 'material', label: 'Materiál', value: S.material, options: [{ v: 'Cu', t: 'Cu' }, { v: 'Al', t: 'Al' }] })}
      </div>`)}
    </form>
    <div id="motor-results"></div>
    ${details('Prepočty kW / kVA / A', `<div id="conv"></div>`)}
  `;
  root.querySelectorAll('[data-input]').forEach((i) => {
    const f = () => { S[i.name] = i.value; save(); recompute(root, ctx); };
    i.addEventListener('input', f); i.addEventListener('change', f);
  });
  root.querySelectorAll('[data-seg]').forEach((b) => {
    b.addEventListener('click', () => { S[b.dataset.seg] = b.dataset.val; save(); render(root, ctx); });
  });
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if (!a || !last) return;
    const meta = { job: S.job, country: store.getCountry(), inputs: summary() };
    if (a.dataset.action === 'share-text') shareText(resultToText(last, meta), last.title);
    if (a.dataset.action === 'share-pdf') printResult({ title: last.title, job: S.job, country: store.getCountry(), text: resultToText(last, meta) });
    if (a.dataset.action === 'save-calc') {
      const name = prompt('Názov výpočtu:', `Motor ${S.power} kW`);
      if (name === null) return;
      store.saveCalc({ name, job: S.job, module: 'motor', inputs: { ...S }, headline: last.headline, country: store.getCountry() });
      toast('Uložené.');
    }
  });
  recompute(root, ctx);
}

function summary() {
  return {
    'Výkon': `${S.power} kW`, 'Sieť': Number(S.phases) === 3 ? '3f' : '1f',
    'cos φ': S.cos || 'z dát', 'η': S.efficiency || 'z dát',
    'Rozbeh': S.startMode, 'Dĺžka': S.L ? `${S.L} m` : '—', 'Prierez': S.S ? `${S.S} mm²` : '—',
  };
}

function recompute(root, ctx) {
  const box = root.querySelector('#motor-results');
  const r = motor({ ...S, country: store.getCountry() }, ctx.lookup);
  last = r;
  let hero = '';
  if (r.In !== undefined) {
    hero = `<div class="hero">
      <div class="hero-main">
        <div class="hero-big">${fmt(r.In, 2)} A</div>
        ${r.startCurrent ? `<div class="hero-big small-big">rozbeh ${fmt(r.startCurrent, 0)} A</div>` : ''}
      </div>
      <dl class="hero-kv">
        <div><dt>Zdanlivý výkon</dt><dd>${fmt(r.kVA, 2)} kVA</dd></div>
        <div><dt>cos φ</dt><dd>${fmt(r.cos, 2)}</dd></div>
        <div><dt>Účinnosť</dt><dd>${fmt(r.efficiency, 3)}</dd></div>
        ${r.contactor ? `<div><dt>Stýkač AC-3</dt><dd>≈ ${r.contactor} A</dd></div>` : ''}
        ${r.compensation ? `<div><dt>Kompenzácia</dt><dd>${fmt(r.compensation, 2)} kvar</dd></div>` : ''}
        ${r.startDrop ? `<div><dt>Úbytok pri rozbehu</dt><dd>${fmt(r.startDrop.percent, 1)} %</dd></div>` : ''}
        <div><dt>Tepelná ochrana nastav na</dt><dd>${fmt(r.In, 2)} A (zo štítku!)</dd></div>
      </dl>
    </div>`;
  }
  box.innerHTML = hero + renderResult(r);

  const conv = root.querySelector('#conv');
  if (conv) {
    const c = conversions({ phases: Number(S.phases), U: Number(S.U) || (Number(S.phases) === 3 ? 400 : 230), cos: r.cos || 1 });
    const rows = [1, 2.2, 4, 5.5, 7.5, 11, 15, 22, 30];
    conv.innerHTML = `<p class="muted small">Pri ${Number(S.phases) === 3 ? '3f' : '1f'} ${Number(S.U) || (Number(S.phases) === 3 ? 400 : 230)} V a cos φ = ${fmt(r.cos || 1, 2)}.</p>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>kW</th><th>kVA</th><th>A</th></tr></thead><tbody>
      ${rows.map((kw) => `<tr><td>${String(kw).replace('.', ',')}</td><td>${fmt(c.kvaFromKw(kw), 2)}</td><td>${fmt(c.aFromKw(kw), 1)}</td></tr>`).join('')}
      </tbody></table></div>`;
  }
}
