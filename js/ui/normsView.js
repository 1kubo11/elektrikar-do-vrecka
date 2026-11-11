/** Normy v aplikácii — ktoré vydania platia a čo z nich je porovnané so zdrojom. */

import { esc, details } from './dom.js';
import { STANDARDS, DATASETS, SOURCES, CHECKED } from '../data/norms.js';
import * as store from '../store.js';

export const title = 'Normy v aplikácii';

function isVerified(id, ov) {
  const o = ov[`${id}.__verified`];
  return o === undefined ? DATASETS[id].verified : !!o;
}

export function render(root) {
  const ov = store.getOverrides();
  const ids = Object.keys(DATASETS);
  const good = ids.filter((id) => isVerified(id, ov));
  const weak = ids.filter((id) => !isVerified(id, ov));
  const country = store.getCountry();
  const when = new Date(`${CHECKED}T12:00:00`).toLocaleDateString('sk-SK');

  const list = (c) => STANDARDS.filter((s) => s.country === c).map((s) => `<li class="norm ${s.found ? 'ok' : 'unk'}">
      <div class="norm-head">
        <b>${esc(s.id)}</b>
        <span class="norm-ed">${esc(s.edition)}</span>
      </div>
      <p>${esc(s.topic)}</p>
      ${s.note ? `<p class="small muted">${esc(s.note)}</p>` : ''}
      ${s.url ? `<p class="small"><a href="${esc(s.url)}" target="_blank" rel="noopener">Záznam o norme</a></p>` : ''}
    </li>`).join('');

  const de = `<h3>Nemecko</h3><ul class="norms">${list('DE')}</ul>`;
  const sk = `<h3>Slovensko</h3><ul class="norms">${list('SK')}</ul>`;

  root.innerHTML = `
    <p class="soft-note">
      Stav k <b>${esc(when)}</b>. Samotné texty noriem sú platené a v aplikácii nie sú.
      Vydania som dohľadal vo verejných záznamoch a hodnoty porovnal s verejnými zdrojmi,
      ktoré normy citujú. Kde sa to nepodarilo, je to tu napísané.
    </p>

    ${country === 'SK' ? sk + de : de + sk}

    <h3>Čo je porovnané so zdrojom (${good.length})</h3>
    <ul class="norm-ds">
      ${good.map((id) => `<li class="ok"><span class="chk-ico">✓</span>${esc(DATASETS[id].title || id)}</li>`).join('')}
    </ul>

    <h3>Čo sa porovnať nepodarilo (${weak.length})</h3>
    <p class="small muted">Keď výpočet siahne na niektorú z týchto hodnôt, výsledok bude „orientačný“ a aplikácia napíše, o ktorú ide.</p>
    <ul class="norm-ds">
      ${weak.map((id) => `<li class="unk"><span class="chk-ico">?</span><span>${esc(DATASETS[id].title || id)}
        <br><span class="small muted">${esc(DATASETS[id].note)}</span></span></li>`).join('')}
    </ul>

    ${details('Zdroje, s ktorými som hodnoty porovnával', `<ul class="notes">
      ${Object.values(SOURCES).filter((s) => s.url).map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('')}
    </ul>`)}

    <p class="mode-toggle"><a class="link-btn" href="#/data">Pozrieť a upraviť jednotlivé hodnoty</a></p>
  `;
}
