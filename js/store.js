/**
 * Lokálne úložisko — nastavenia, uložené výpočty, obľúbené, úpravy dát.
 * Žiadny server, žiadne prihlasovanie. Všetko v zariadení.
 */

const KEY = 'edv.v1';

const DEFAULTS = {
  country: 'DE',
  theme: 'auto',
  lastRoute: '#/kalkulacka',
  settings: {
    detail: false,           // false = jednoduchý režim (predvolený), true = podrobný
    dropLimitOverride: {},   // { DE: {power: 3, ...}, SK: {...} }
    cFactor: '',             // prázdne = z dát
    defaultZe: '',
    xPerM: '',
  },
  dataOverrides: {},         // { 'datasetId.cesta': hodnota, 'datasetId.__verified': true }
  saved: [],                 // uložené výpočty
  favourites: [],            // { type:'glossary'|'calc'|'table', id, label }
  recent: [],                // posledných 20 výpočtov
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...parsed, settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Nepodarilo sa uložiť do zariadenia:', e);
  }
}

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((f) => f(state)); }

export function get() { return state; }

export function set(patch) {
  state = { ...state, ...patch };
  persist();
  emit();
}

export function setSetting(key, value) {
  state.settings = { ...state.settings, [key]: value };
  persist();
  emit();
}

/* ─────────── jednoduchý / podrobný režim ─────────── */
export function isDetail() { return !!state.settings.detail; }
export function setDetail(v) { setSetting('detail', !!v); }

/* ─────────── krajina / norma ─────────── */
export function getCountry() { return state.country; }
export function setCountry(c) { set({ country: c }); }

/* ─────────── téma ─────────── */
export function getTheme() { return state.theme; }
export function setTheme(t) { set({ theme: t }); applyTheme(); }

export function applyTheme() {
  const t = state.theme;
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
}

/* ─────────── úpravy normových dát ─────────── */
export function getOverrides() { return state.dataOverrides; }

export function setOverride(key, value) {
  if (value === undefined || value === null || value === '') delete state.dataOverrides[key];
  else state.dataOverrides[key] = value;
  persist();
  emit();
}

export function setDatasetVerified(datasetId, verified) {
  setOverride(`${datasetId}.__verified`, verified ? true : undefined);
}

export function clearOverrides() {
  state.dataOverrides = {};
  persist();
  emit();
}

export function exportData() {
  return JSON.stringify({
    app: 'elektrikar-do-vrecka',
    exportedAt: new Date().toISOString(),
    country: state.country,
    settings: state.settings,
    dataOverrides: state.dataOverrides,
    saved: state.saved,
    favourites: state.favourites,
  }, null, 2);
}

export function importData(json) {
  const p = JSON.parse(json);
  if (p.app !== 'elektrikar-do-vrecka') throw new Error('Toto nie je export z tejto aplikácie.');
  set({
    country: p.country || state.country,
    settings: { ...state.settings, ...(p.settings || {}) },
    dataOverrides: { ...(p.dataOverrides || {}) },
    saved: Array.isArray(p.saved) ? p.saved : state.saved,
    favourites: Array.isArray(p.favourites) ? p.favourites : state.favourites,
  });
  return {
    overrides: Object.keys(p.dataOverrides || {}).length,
    saved: (p.saved || []).length,
    favourites: (p.favourites || []).length,
  };
}

/* ─────────── uložené výpočty ─────────── */
export function saveCalc({ name, job, module: mod, inputs, headline, country }) {
  const item = {
    id: `c${Date.now()}`,
    name: name || 'Bez názvu',
    job: job || '',
    module: mod,
    inputs,
    headline,
    country,
    at: new Date().toISOString(),
  };
  state.saved = [item, ...state.saved];
  persist();
  emit();
  return item;
}

export function deleteCalc(id) {
  state.saved = state.saved.filter((x) => x.id !== id);
  persist();
  emit();
}

export function pushRecent({ module: mod, inputs, headline }) {
  const item = { id: `r${Date.now()}`, module: mod, inputs, headline, at: new Date().toISOString() };
  state.recent = [item, ...state.recent.filter((x) => x.headline !== headline)].slice(0, 20);
  persist();
  emit();
}

export function getRecent() { return state.recent; }
export function getSaved() { return state.saved; }

/* ─────────── obľúbené ─────────── */
export function toggleFavourite(fav) {
  const key = `${fav.type}:${fav.id}`;
  const exists = state.favourites.some((f) => `${f.type}:${f.id}` === key);
  state.favourites = exists
    ? state.favourites.filter((f) => `${f.type}:${f.id}` !== key)
    : [{ ...fav }, ...state.favourites];
  persist();
  emit();
  return !exists;
}

export function isFavourite(type, id) {
  return state.favourites.some((f) => f.type === type && String(f.id) === String(id));
}

export function getFavourites() { return state.favourites; }
