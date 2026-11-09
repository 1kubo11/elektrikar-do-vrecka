/** Slovník SK–DE. */

import { esc, mark, toast } from './dom.js';
import { WORDS, PHRASES, CATEGORIES } from '../data/glossary.js';
import * as store from '../store.js';

export const title = 'Slovník SK–DE';

let q = '';
let cat = 'all';
let onlyFav = false;

export function render(root) {
  root.innerHTML = `
    <div class="search-row">
      <input type="search" id="gl-q" placeholder="Hľadaj po slovensky alebo po nemecky…" value="${esc(q)}" autocomplete="off">
    </div>
    <div class="chips">
      <button type="button" class="chip ${cat === 'all' && !onlyFav ? 'on' : ''}" data-cat="all">Všetko</button>
      ${CATEGORIES.map((c) => `<button type="button" class="chip ${cat === c.id && !onlyFav ? 'on' : ''}" data-cat="${c.id}">${esc(c.sk)}</button>`).join('')}
      <button type="button" class="chip ${onlyFav ? 'on' : ''}" data-fav-filter>★ Obľúbené</button>
    </div>
    <div id="gl-list"></div>
  `;
  const input = root.querySelector('#gl-q');
  input.addEventListener('input', () => { q = input.value; list(root); });
  root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
    cat = b.dataset.cat; onlyFav = false; render(root); root.querySelector('#gl-q').focus();
  }));
  root.querySelector('[data-fav-filter]').addEventListener('click', () => { onlyFav = !onlyFav; render(root); });

  root.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fav]');
    if (f) {
      const on = store.toggleFavourite({ type: 'glossary', id: f.dataset.fav, label: f.dataset.label });
      f.textContent = on ? '★' : '☆';
      f.classList.toggle('on', on);
      return;
    }
    const s = e.target.closest('[data-say]');
    if (s) say(s.dataset.say);
  });
  list(root);
}

function matches(item, needle) {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return [item.sk, item.de, item.p, item.a].filter(Boolean).some((x) => String(x).toLowerCase().includes(n));
}

function list(root) {
  const box = root.querySelector('#gl-list');
  const words = WORDS.filter((w) => (cat === 'all' || w.cat === cat) && matches(w, q)
    && (!onlyFav || store.isFavourite('glossary', `w:${w.sk}`)));
  const phrases = PHRASES.filter((p) => (cat === 'all' || p.cat === cat) && matches(p, q)
    && (!onlyFav || store.isFavourite('glossary', `p:${p.sk}`)));

  if (!words.length && !phrases.length) {
    box.innerHTML = `<p class="muted">Nič som nenašel. Skús iné slovo — hľadá sa v oboch jazykoch aj vo výslovnosti.</p>`;
    return;
  }

  box.innerHTML = `
    ${phrases.length ? `<h3>Hotové vety (${phrases.length})</h3>
      <ul class="gl-list">${phrases.map((p) => entry({
        id: `p:${p.sk}`, sk: p.sk, de: p.de, p: p.p, a: '', isPhrase: true,
      })).join('')}</ul>` : ''}
    ${words.length ? `<h3>Slová (${words.length})</h3>
      <ul class="gl-list">${words.map((w) => entry({
        id: `w:${w.sk}`, sk: w.sk, de: w.de, p: w.p, a: w.a, pl: w.pl,
      })).join('')}</ul>` : ''}
  `;
}

function entry({ id, sk, de, p, a, pl, isPhrase }) {
  const fav = store.isFavourite('glossary', id);
  return `<li class="gl-item ${isPhrase ? 'phrase' : ''}">
    <div class="gl-text">
      <div class="gl-sk">${mark(sk, q)}</div>
      <div class="gl-de">${a && a !== '—' ? `<span class="art">${esc(a)}</span> ` : ''}${mark(de, q)}${pl ? ` <span class="small muted">(${esc(pl)})</span>` : ''}</div>
      <div class="gl-p">[${mark(p || '', q)}]</div>
    </div>
    <div class="gl-btns">
      <button type="button" class="icon-btn ${fav ? 'on' : ''}" data-fav="${esc(id)}" data-label="${esc(sk)} → ${esc(de)}" title="Obľúbené">${fav ? '★' : '☆'}</button>
      <button type="button" class="icon-btn" data-say="${esc(de)}" title="Prečítať nahlas">🔊</button>
    </div>
  </li>`;
}

function say(text) {
  if (!('speechSynthesis' in window)) { toast('Zariadenie nepodporuje čítanie nahlas.'); return; }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch {
    toast('Čítanie nahlas sa nepodarilo.');
  }
}
