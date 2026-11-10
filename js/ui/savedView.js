/** Uložené výpočty, posledné a obľúbené. */

import { esc, toast } from './dom.js';
import * as store from '../store.js';
import * as calculator from './calculator.js';
import { DATASETS } from '../data/norms.js';

export const title = 'Uložené a obľúbené';

const MODULE_ROUTE = { calculator: '#/kalkulacka', motor: '#/motory', pv: '#/fv', wallbox: '#/wallbox' };
const MODULE_NAME = { calculator: 'Kábel a istenie', motor: 'Motor', pv: 'Fotovoltika', wallbox: 'Wallbox' };

export function render(root) {
  const saved = store.getSaved();
  const recent = store.getRecent();
  const favs = store.getFavourites();

  root.innerHTML = `
    <h3>Uložené výpočty (${saved.length})</h3>
    ${saved.length ? `<ul class="saved">${saved.map(item).join('')}</ul>`
      : '<p class="muted">Nič uložené. Vo výpočte stlač „Uložiť výpočet“ a dáš mu názov zákazky.</p>'}

    <h3>Posledné výpočty (${recent.length})</h3>
    ${recent.length ? `<ul class="saved">${recent.map((x) => `<li class="saved-item">
        <div><b>${esc(MODULE_NAME[x.module] || x.module)}</b><br>
        <span class="small">${esc(x.headline || '')}</span><br>
        <span class="small muted">${esc(new Date(x.at).toLocaleString('sk-SK'))}</span></div>
        <div class="saved-btns">
          ${x.module === 'calculator' ? `<button type="button" class="btn small" data-open="${esc(x.id)}" data-kind="recent">Otvoriť</button>` : ''}
        </div>
      </li>`).join('')}</ul>` : '<p class="muted">Zatiaľ nič.</p>'}

    <h3>Obľúbené (${favs.length})</h3>
    ${favs.length ? `<ul class="saved">${favs.map((f) => `<li class="saved-item">
        <div><span class="pill">${esc(f.type)}</span> ${esc(f.label || f.id)}</div>
        <div class="saved-btns">
          <button type="button" class="btn small" data-unfav="${esc(f.type)}|${esc(f.id)}">Odobrať</button>
        </div>
      </li>`).join('')}</ul>` : '<p class="muted">Obľúbené pridávaš hviezdičkou v slovníku.</p>'}
  `;

  root.onclick = (e) => {
    const open = e.target.closest('[data-open]');
    if (open) {
      const kind = open.dataset.kind;
      const list = kind === 'recent' ? store.getRecent() : store.getSaved();
      const it = list.find((x) => x.id === open.dataset.open);
      if (!it) return;
      if (it.module === 'calculator') {
        calculator.setInputs(it.inputs);
        location.hash = '#/kalkulacka';
      } else {
        location.hash = MODULE_ROUTE[it.module] || '#/kalkulacka';
        toast('Modul otvorený. Vstupy tohto modulu sa ukladajú samostatne.');
      }
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      if (!confirm('Zmazať tento uložený výpočet?')) return;
      store.deleteCalc(del.dataset.del);
      render(root);
      return;
    }
    const uf = e.target.closest('[data-unfav]');
    if (uf) {
      const [type, id] = uf.dataset.unfav.split('|');
      store.toggleFavourite({ type, id });
      render(root);
    }
  };
}

function item(x) {
  return `<li class="saved-item">
    <div>
      <b>${esc(x.name)}</b>
      ${x.job ? `<br><span class="small">${esc(x.job)}</span>` : ''}
      <br><span class="small">${esc(MODULE_NAME[x.module] || x.module)} · ${esc(x.country === 'SK' ? 'STN' : 'VDE')} · ${esc(x.headline || '')}</span>
      <br><span class="small muted">${esc(new Date(x.at).toLocaleString('sk-SK'))}</span>
    </div>
    <div class="saved-btns">
      <button type="button" class="btn small" data-open="${esc(x.id)}" data-kind="saved">Otvoriť</button>
      <button type="button" class="btn small danger" data-del="${esc(x.id)}">Zmazať</button>
    </div>
  </li>`;
}
