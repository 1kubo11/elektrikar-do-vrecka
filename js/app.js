/** Shell aplikácie — router, hlavička, globálne vyhľadávanie, offline. */

import { createLookup } from './data/norms.js';
import * as store from './store.js';
import { esc, toast } from './ui/dom.js';
import * as calculator from './ui/calculator.js';
import * as motorView from './ui/motorView.js';
import * as pvView from './ui/pvView.js';
import * as wallboxView from './ui/wallboxView.js';
import * as tablesView from './ui/tablesView.js';
import * as glossaryView from './ui/glossaryView.js';
import * as dataView from './ui/dataView.js';
import * as savedView from './ui/savedView.js';
import * as searchView from './ui/searchView.js';
import * as moreView from './ui/moreView.js';
import * as normsView from './ui/normsView.js';

/** parent = položka spodnej lišty, pod ktorú obrazovka patrí */
const ROUTES = {
  '#/kalkulacka': { view: calculator, parent: '#/kalkulacka' },
  '#/tabulky': { view: tablesView, parent: '#/tabulky' },
  '#/slovnik': { view: glossaryView, parent: '#/slovnik' },
  '#/viac': { view: moreView, parent: '#/viac' },
  '#/motory': { view: motorView, parent: '#/viac' },
  '#/fv': { view: pvView, parent: '#/viac' },
  '#/wallbox': { view: wallboxView, parent: '#/viac' },
  '#/ulozene': { view: savedView, parent: '#/viac' },
  '#/data': { view: dataView, parent: '#/viac' },
  '#/normy': { view: normsView, parent: '#/viac' },
  '#/hladanie': { view: searchView, parent: null },
};

const NAV = [
  { route: '#/kalkulacka', label: 'Kábel', icon: '⚡' },
  { route: '#/tabulky', label: 'Tabuľky', icon: '▦' },
  { route: '#/slovnik', label: 'Slovník', icon: 'DE' },
  { route: '#/viac', label: 'Viac', icon: '☰' },
];

let ctx = { lookup: createLookup(store.getOverrides()) };

function currentRoute() {
  const h = location.hash || store.get().lastRoute || '#/kalkulacka';
  return ROUTES[h] ? h : '#/kalkulacka';
}

function renderShell() {
  document.getElementById('app').innerHTML = `
    <header class="top">
      <button type="button" class="top-btn" id="btn-search" aria-label="Hľadať">🔍</button>
      <a class="brand-name" href="#/kalkulacka">Elektrikár</a>
      <div class="norm-pill" role="group" aria-label="Podľa ktorej normy sa počíta">
        <button type="button" data-country="DE">🇩🇪 VDE</button>
        <button type="button" data-country="SK">🇸🇰 STN</button>
      </div>
    </header>

    <p class="disclaimer">Pomôcka — nenahrádza normu, projekt ani meranie.</p>

    <div id="crumb"></div>
    <main id="view"></main>

    <nav class="bottom">
      ${NAV.map((n) => `<a href="${n.route}" class="nav-item" data-route="${n.route}">
        <span class="nav-ico">${n.icon}</span><span>${esc(n.label)}</span></a>`).join('')}
    </nav>

    <div class="search-overlay" id="search-overlay" hidden>
      <div class="so-head">
        <input type="search" id="so-input" placeholder="Hľadaj v celej aplikácii…" autocomplete="off">
        <button type="button" id="so-close" class="top-btn">✕</button>
      </div>
      <div id="so-res" class="so-res"></div>
    </div>
  `;

  document.querySelectorAll('[data-country]').forEach((b) => {
    b.addEventListener('click', () => {
      if (store.getCountry() === b.dataset.country) return;
      store.setCountry(b.dataset.country);
      paintCountry();
      renderView();
      toast(b.dataset.country === 'DE' ? 'Počítam podľa nemeckých noriem (VDE/DIN).' : 'Počítam podľa slovenských noriem (STN).');
    });
  });
  document.getElementById('btn-search').addEventListener('click', openSearch);
  document.getElementById('so-close').addEventListener('click', closeSearch);

  const soInput = document.getElementById('so-input');
  const soRes = document.getElementById('so-res');
  soInput.addEventListener('input', () => {
    soRes.innerHTML = searchView.renderResults(searchView.search(soInput.value), soInput.value);
  });
  soRes.addEventListener('click', (e) => { if (e.target.closest('[data-close-search]')) closeSearch(); });
  paintCountry();
}

function paintCountry() {
  const c = store.getCountry();
  document.querySelectorAll('[data-country]').forEach((b) => b.classList.toggle('on', b.dataset.country === c));
}

function openSearch() {
  document.getElementById('search-overlay').hidden = false;
  document.getElementById('so-input').focus();
}
function closeSearch() {
  const ov = document.getElementById('search-overlay');
  if (ov) ov.hidden = true;
}

function renderView() {
  const route = currentRoute();
  const { view, parent } = ROUTES[route];

  /* čerstvý element pri každom zobrazení — staré obsluhy udalostí nezostanú visieť */
  const old = document.getElementById('view');
  const el = document.createElement('main');
  el.id = 'view';
  old.replaceWith(el);

  document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('on', a.dataset.route === parent));
  document.getElementById('crumb').innerHTML = parent && parent !== route
    ? `<a class="crumb" href="${parent}">‹ Viac</a><span class="crumb-title">${esc(view.title)}</span>` : '';
  document.title = `${view.title} — Elektrikár do vrecka`;

  try {
    view.render(el, ctx);
  } catch (e) {
    el.innerHTML = `<div class="banner bad"><strong>Chyba pri zobrazení:</strong> ${esc(e.message)}</div>`;
    console.error(e);
  }
  store.set({ lastRoute: route });
  window.scrollTo(0, 0);
}

/* ───────── štart ───────── */

store.applyTheme();
renderShell();
if (!location.hash) location.hash = store.get().lastRoute || '#/kalkulacka';
renderView();

window.addEventListener('hashchange', () => { closeSearch(); renderView(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

store.onChange(() => {
  ctx = { ...ctx, lookup: createLookup(store.getOverrides()) };
});

/* offline */
/* na localhoste sa service worker neregistruje — pri vývoji by držal staré súbory */
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if ('serviceWorker' in navigator && !isLocal) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW:', e));
  });
}

window.addEventListener('offline', () => toast('Bez signálu — aplikácia funguje ďalej.'));
