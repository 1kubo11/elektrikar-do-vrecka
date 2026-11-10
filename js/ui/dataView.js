/** Overenie dát — kontrola, oprava a označenie normových hodnôt. */

import { esc, toast, details } from './dom.js';
import { DATASETS, DATA_VERSION } from '../data/norms.js';
import * as store from '../store.js';

export const title = 'Overenie dát';

export function render(root, ctx) {
  const ov = store.getOverrides();
  const ids = Object.keys(DATASETS);
  const verifiedCount = ids.filter((id) => isVerified(id, ov)).length;
  const editedCount = Object.keys(ov).filter((k) => !k.endsWith('.__verified')).length;

  root.innerHTML = `
    <div class="banner warn">
      <strong>Toto je najdôležitejšia obrazovka aplikácie.</strong>
      Normové tabuľky v aplikácii som nemal z overiteľného zdroja, takže sú označené
      ako <b>NEOVERENÉ</b>. Sú to štartovacie hodnoty na kontrolu, nie citát normy.
      Prejdi ich proti platnej norme, oprav, čo nesedí, a potom označ dataset ako
      <b>Overené</b>. Kým to neurobíš, výsledok opretý o takú hodnotu nebude zelený.
    </div>

    <div class="stats">
      <div><b>${verifiedCount}</b> / ${ids.length}<span>datasetov označených ako overené</span></div>
      <div><b>${editedCount}</b><span>ručne upravených hodnôt</span></div>
      <div><b>${esc(DATA_VERSION)}</b><span>verzia dát</span></div>
    </div>

    <div class="row-btns">
      <button type="button" class="btn" data-export>Exportovať dáta</button>
      <button type="button" class="btn" data-import>Importovať dáta</button>
      <button type="button" class="btn danger" data-reset>Vrátiť všetko na pôvodné</button>
    </div>
    <textarea id="io-box" class="io-box" placeholder="Sem vlož JSON export a stlač Importovať." hidden></textarea>

    <div id="ds-list">
      ${ids.map((id) => card(id, ov)).join('')}
    </div>
  `;

  root.querySelector('[data-export]').addEventListener('click', () => {
    const box = root.querySelector('#io-box');
    box.hidden = false;
    box.value = store.exportData();
    box.select();
    navigator.clipboard?.writeText(box.value).then(() => toast('Export skopírovaný do schránky.')).catch(() => toast('Export je v poli nižšie.'));
  });

  root.querySelector('[data-import]').addEventListener('click', () => {
    const box = root.querySelector('#io-box');
    if (box.hidden || !box.value.trim()) {
      box.hidden = false;
      box.placeholder = 'Vlož sem JSON export a stlač Importovať znova.';
      box.focus();
      return;
    }
    try {
      const res = store.importData(box.value);
      toast(`Importované: ${res.overrides} úprav, ${res.saved} výpočtov, ${res.favourites} obľúbených.`);
      render(root, ctx);
    } catch (e) {
      toast(`Import sa nepodaril: ${e.message}`);
    }
  });

  root.querySelector('[data-reset]').addEventListener('click', () => {
    if (!confirm('Naozaj vrátiť všetky normové hodnoty na pôvodné a zrušiť označenia „Overené“?')) return;
    store.clearOverrides();
    toast('Vrátené na pôvodné.');
    render(root, ctx);
  });

  root.onchange = (e) => {
    const t = e.target.closest('[data-verify]');
    if (t) {
      store.setDatasetVerified(t.dataset.verify, t.checked);
      // aktualizuj na mieste, aby sa nestratila pozícia a otvorené boxy
      const card = t.closest('.ds');
      card.classList.toggle('ok', t.checked);
      card.classList.toggle('nv', !t.checked);
      t.nextElementSibling.textContent = t.checked ? 'Overené' : 'Neoverené';
      const ov2 = store.getOverrides();
      const done = Object.keys(DATASETS).filter((id) => isVerified(id, ov2)).length;
      const stat = root.querySelector('.stats b');
      if (stat) stat.textContent = String(done);
      toast(t.checked ? 'Označené ako overené.' : 'Označené ako neoverené.');
      return;
    }
    const v = e.target.closest('[data-path]');
    if (v) {
      const raw = v.value.trim().replace(',', '.');
      if (raw === '') {
        store.setOverride(v.dataset.path, undefined);
        v.classList.remove('edited');
      } else {
        const n = Number(raw);
        if (!Number.isFinite(n)) { toast('Zadaj číslo.'); return; }
        store.setOverride(v.dataset.path, n);
        v.classList.add('edited');
      }
    }
  };

  root.querySelectorAll('[data-filter]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const wrap = inp.closest('.box-body');
      const needle = inp.value.toLowerCase();
      wrap.querySelectorAll('.leaf').forEach((row) => {
        row.hidden = needle && !row.dataset.key.toLowerCase().includes(needle);
      });
    });
  });
}

function isVerified(id, ov) {
  const o = ov[`${id}.__verified`];
  return o === undefined ? DATASETS[id].verified : !!o;
}

function card(id, ov) {
  const ds = DATASETS[id];
  const ver = isVerified(id, ov);
  const leaves = flatten(ds.data).map(([path, value]) => ({ key: path.join('.'), path: `${id}.${path.join('.')}`, value }))
    .filter((x) => typeof x.value === 'number');
  const edited = leaves.filter((x) => Object.prototype.hasOwnProperty.call(ov, x.path)).length;

  return `<article class="ds ${ver ? 'ok' : 'nv'}">
    <header>
      <div>
        <h3>${esc(id)}</h3>
        <p class="ds-meta">${esc(ds.standard)} · vydanie ${esc(ds.edition)} · ${esc(ds.table)} · ${esc(ds.country === 'BOTH' ? 'DE + SK' : ds.country)}</p>
      </div>
      <label class="switch">
        <input type="checkbox" data-verify="${esc(id)}" ${ver ? 'checked' : ''}>
        <span>${ver ? 'Overené' : 'Neoverené'}</span>
      </label>
    </header>
    <p class="ds-note">${esc(ds.note)}</p>
    ${edited ? `<p class="pill">${edited} ručne upravených hodnôt</p>` : ''}
    ${leaves.length ? details(`Hodnoty (${leaves.length})`, `
      ${leaves.length > 25 ? `<input type="search" data-filter placeholder="Filtruj cestu, napr. B2.Cu.3" class="filter">` : ''}
      <div class="leaves">
        ${leaves.map((l) => `<div class="leaf" data-key="${esc(l.key)}">
          <code>${esc(l.key)}</code>
          <input type="text" inputmode="decimal" data-path="${esc(l.path)}"
            value="${esc(ov[l.path] !== undefined ? ov[l.path] : l.value)}"
            class="${ov[l.path] !== undefined ? 'edited' : ''}">
        </div>`).join('')}
      </div>
      <p class="muted small">Vymazanie poľa vráti pôvodnú hodnotu.</p>
    `) : `<p class="muted small">Textové hodnoty sa neupravujú — zmeň ich v <code>js/data/norms.js</code>.</p>`}
  </article>`;
}

function flatten(obj, prefix = []) {
  const out = [];
  if (obj === null || typeof obj !== 'object') return [[prefix, obj]];
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, [...prefix, k]));
    else out.push([[...prefix, k], v]);
  }
  return out;
}
