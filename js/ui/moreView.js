/** „Viac“ — ostatné kalkulačky, uložené veci a nastavenia. */

import { esc } from './dom.js';
import * as store from '../store.js';

export const title = 'Viac';

const TILES = [
  { href: '#/motory', ico: 'M', t: 'Motory', s: 'prúd, rozbeh, stýkač' },
  { href: '#/fv', ico: '☀', t: 'Fotovoltika', s: 'reťazec, káble' },
  { href: '#/wallbox', ico: '🔌', t: 'Wallbox', s: 'kábel, istič, chránič' },
  { href: '#/ulozene', ico: '★', t: 'Uložené', s: 'výpočty a obľúbené' },
];

export function render(root) {
  const detail = store.isDetail();
  const theme = store.getTheme();

  root.innerHTML = `
    <h3>Ďalšie kalkulačky</h3>
    <div class="tiles tiles-2">
      ${TILES.map((t) => `<a class="tile link" href="${t.href}">
        <span class="tile-ico">${t.ico}</span><b>${esc(t.t)}</b><span>${esc(t.s)}</span></a>`).join('')}
    </div>

    <h3>Nastavenia</h3>
    <div class="setting">
      <div>
        <b>Podrobný režim</b>
        <p class="small muted">Všetky vstupy, vzorce a normy. Pre projekt a revíziu. Bežne ho netreba.</p>
      </div>
      <label class="switch"><input type="checkbox" id="set-detail" ${detail ? 'checked' : ''}><span>${detail ? 'Zapnutý' : 'Vypnutý'}</span></label>
    </div>
    <div class="setting col">
      <b>Vzhľad</b>
      <div class="seg">
        ${[['auto', 'Podľa telefónu'], ['dark', 'Tmavý'], ['light', 'Svetlý']].map(([v, t]) =>
          `<button type="button" class="seg-btn ${theme === v ? 'on' : ''}" data-theme-set="${v}">${t}</button>`).join('')}
      </div>
    </div>

    <h3>Normy</h3>
    <a class="tile link wide" href="#/normy">
      <b>Normy v aplikácii</b>
      <span>Ktoré vydania noriem platia v Nemecku a na Slovensku, čo z nich je porovnané so zdrojom a čo nie.</span>
    </a>
    <a class="tile link wide" href="#/data" style="margin-top:8px">
      <b>Tabuľky a hodnoty</b>
      <span>Všetky čísla, s ktorými aplikácia počíta. Dajú sa skontrolovať, opraviť a preniesť do iného telefónu.</span>
    </a>
  `;

  root.querySelector('#set-detail').onchange = (e) => { store.setDetail(e.target.checked); render(root); };
  root.querySelectorAll('[data-theme-set]').forEach((b) => {
    b.onclick = () => { store.setTheme(b.dataset.themeSet); render(root); };
  });
}
