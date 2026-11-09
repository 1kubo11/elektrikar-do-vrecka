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

const ROUTES = {
  '#/kalkulacka': { view: calculator, nav: 'Kábel', icon: '⚡' },
  '#/motory': { view: motorView, nav: 'Motor', icon: 'M' },
  '#/fv': { view: pvView, nav: 'FV', icon: '☀' },
  '#/wallbox': { view: wallboxView, nav: 'Wallbox', icon: '🔌' },
  '#/tabulky': { view: tablesView, nav: 'Tabuľky', icon: '▦' },
  '#/slovnik': { view: glossaryView, nav: 'Slovník', icon: 'DE' },
  '#/data': { view: dataView, nav: 'Dáta', icon: '✓' },
  '#/ulozene': { view: savedView, nav: 'Uložené', icon: '★' },
  '#/hladanie': { view: searchView, nav: null, icon: '🔍' },
};

const NAV_ORDER = ['#/kalkulacka', '#/motory', '#/fv', '#/wallbox', '#/tabulky', '#/slovnik', '#/data', '#/ulozene'];

let ctx = { lookup: createLookup(store.getOverrides()) };

function rebuildLookup() {
  ctx = { ...ctx, lookup: createLookup(store.getOverrides()) };
}

function currentRoute() {
  const h = location.hash || store.get().lastRoute || '#/kalkulacka';
  return ROUTES[h] ? h : '#/kalkulacka';
}

function renderShell() {
  const country = store.getCountry();
  document.getElementById('app').innerHTML = `
    <header class="top">
      <button type="button" class="top-btn" id="btn-search" aria-label="Hľadať">🔍</button>
      <div class="brand">
        <span class="brand-name">Elektrikár do vrecka</span>
        <span class="norm-badge ${country === 'SK' ? 'sk' : 'de'}" id="norm-badge">
          ${country === 'DE' ? 'Nemecko · VDE/DIN' : 'Slovensko · STN'}
        </span>
      </div>
      <button type="button" class="top-btn" id="btn-theme" aria-label="Tmavý/svetlý režim">◐</button>
    </header>

    <div class="norm-switch">
      <button type="button" class="ns-btn ${country === 'DE' ? 'on' : ''}" data-country="DE">🇩🇪 Nemecko — VDE / DIN</button>
      <button type="button" class="ns-btn ${country === 'SK' ? 'on' : ''}" data-country="SK">🇸🇰 Slovensko — STN</button>
    </div>

    <p class="disclaimer">
      Aplikácia je <b>pomôcka</b>. Nenahrádza normu, projekt, meranie ani zodpovednosť odborníka.
      Normové tabuľky sú <b>neoverené</b>, kým ich neskontroluješ v <a href="#/data">Overenie dát</a>.
    </p>

    <main id="view"></main>

    <nav class="bottom">
      ${NAV_ORDER.map((r) => `<a href="${r}" class="nav-item" data-route="${r}">
        <span class="nav-ico">${ROUTES[r].icon}</span><span>${esc(ROUTES[r].nav)}</span></a>`).join('')}
    </nav>

    <div class="search-overlay" id="search-overlay" hidden>
      <div class="so-head">
        <input type="search" id="so-input" placeholder="Hľadaj naprieč celou aplikáciou…" autocomplete="off">
        <button type="button" id="so-close" class="top-btn">✕</button>
      </div>
      <div id="so-res" class="so-res"></div>
    </div>
  `;

  document.querySelectorAll('[data-country]').forEach((b) => {
    b.addEventListener('click', () => { store.setCountry(b.dataset.country); renderShell(); renderView(); });
  });
  document.getElementById('btn-theme').addEventListener('click', cycleTheme);
  document.getElementById('btn-search').addEventListener('click', openSearch);
  document.getElementById('so-close').addEventListener('click', closeSearch);

  const soInput = document.getElementById('so-input');
  const soRes = document.getElementById('so-res');
  soInput.addEventListener('input', () => {
    soRes.innerHTML = searchView.renderResults(searchView.search(soInput.value), soInput.value);
  });
  soRes.addEventListener('click', (e) => { if (e.target.closest('[data-close-search]')) closeSearch(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });
}

function openSearch() {
  const ov = document.getElementById('search-overlay');
  ov.hidden = false;
  document.getElementById('so-input').focus();
}
function closeSearch() {
  const ov = document.getElementById('search-overlay');
  if (ov) ov.hidden = true;
}

function cycleTheme() {
  const order = ['auto', 'dark', 'light'];
  const next = order[(order.indexOf(store.getTheme()) + 1) % order.length];
  store.setTheme(next);
  toast(next === 'auto' ? 'Režim: podľa systému' : next === 'dark' ? 'Režim: tmavý' : 'Režim: svetlý');
}

function renderView() {
  const route = currentRoute();
  const { view } = ROUTES[route];
  const el = document.getElementById('view');
  el.innerHTML = '';
  document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('on', a.dataset.route === route));
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

store.onChange(() => {
  rebuildLookup();
  const badge = document.getElementById('norm-badge');
  if (badge) {
    const c = store.getCountry();
    badge.textContent = c === 'DE' ? 'Nemecko · VDE/DIN' : 'Slovensko · STN';
    badge.className = `norm-badge ${c === 'SK' ? 'sk' : 'de'}`;
  }
});

/* offline */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW:', e));
  });
}

window.addEventListener('online', () => toast('Pripojené. Aplikácia funguje aj offline.'));
window.addEventListener('offline', () => toast('Bez signálu — aplikácia funguje ďalej.'));
