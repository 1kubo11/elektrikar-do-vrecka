/** Tabuľky a značenie. */

import { esc, details, toast } from './dom.js';
import { WIRE_COLORS, BREAKER_CHARS, IP_CODE, IK_CODE, BATHROOM_ZONES, SYMBOLS, TERMINALS, TORQUES, RCD_CURRENTS, REFERENCE_SOURCE } from '../data/reference.js';
import { CABLES, PLACE_GUIDE, CABLE_SOURCE } from '../data/cables.js';
import { DATASETS } from '../data/norms.js';
import * as store from '../store.js';

export const title = 'Tabuľky a značenie';

export function render(root) {
  root.innerHTML = `
    <div class="banner warn">
      <strong>Všetko v tejto časti je NEOVERENÉ a orientačné.</strong>
      ${esc(REFERENCE_SOURCE.note)}
    </div>

    ${details('Farby vodičov a staré značenia', colors(), true)}
    ${details('Typy káblov — DE ↔ SK a kde sa smú použiť', cables())}
    ${details('Výber podľa typu miesta', places())}
    ${details('Charakteristiky ističov a poistiek', breakers())}
    ${details('Prúdové chrániče — typy a citlivosti', rcds())}
    ${details('Krytie IP a IK', ipik())}
    ${details('Zóny v kúpeľni', zones())}
    ${details('Schematické značky', symbols())}
    ${details('Svorky stýkačov a relé', terminals())}
    ${details('Uťahovacie momenty', torques())}
    ${details('Typy sietí TN / TT / IT', nets())}
    ${details('Spôsoby uloženia A1 – F', methods())}
  `;
}

function colors() {
  const row = (c) => `<tr>
    <td><span class="swatch" style="background:${esc(c.hex || '#888')}"></span></td>
    <td><b>${esc(c.fn)}</b></td><td>${esc(c.sk || '')}</td>
    <td class="de">${esc(c.de || '')}</td><td>${esc(c.color)}</td>
    <td class="small">${esc(c.note || '')}</td></tr>`;
  return `
    <h4>Platné značenie</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${WIRE_COLORS.current.map(row).join('')}</tbody></table></div>
    <h4>Staré značenia — Nemecko</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${WIRE_COLORS.oldDE.map((c) => `<tr><td></td><td><b>${esc(c.fn)}</b></td><td colspan="3">${esc(c.color)}</td><td class="small">${esc(c.note)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Staré značenia — Slovensko</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${WIRE_COLORS.oldSK.map((c) => `<tr><td></td><td><b>${esc(c.fn)}</b></td><td colspan="3">${esc(c.color)}</td><td class="small">${esc(c.note)}</td></tr>`).join('')}</tbody></table></div>
    <div class="banner bad">${esc(WIRE_COLORS.warn)}</div>`;
}

function cables() {
  return `<div class="banner warn small">${esc(CABLE_SOURCE.note)}</div>
    ${CABLES.map((c) => `<article class="card">
      <h4>${esc(c.id)} <span class="pill">${esc(c.country === 'BOTH' ? 'DE + SK' : c.country)}</span></h4>
      <p class="de">${esc(c.de)}</p>
      <p><b>SK:</b> ${esc(c.sk)}</p>
      <p><b>Izolácia:</b> ${esc(c.insulation)} · <b>Napätie:</b> ${esc(c.volt)} · <b>Jadro:</b> ${esc(c.cores)}</p>
      <p><b>Kde áno:</b> ${esc(c.use)}</p>
      <p class="bad-text"><b>Kde nie:</b> ${esc(c.noUse)}</p>
      ${c.note ? `<p class="small muted">${esc(c.note)}</p>` : ''}
    </article>`).join('')}`;
}

function places() {
  return PLACE_GUIDE.map((p) => `<article class="card">
    <h4>${esc(p.sk)} <em class="de">${esc(p.de)}</em></h4>
    <p><b>Kábel:</b> ${esc(p.cables)}</p>
    <p><b>Ochrana:</b> ${esc(p.protection)}</p>
    <p><b>Krytie:</b> ${esc(p.ip)}</p>
    <p class="bad-text"><b>Pozor:</b> ${esc(p.warn)}</p>
  </article>`).join('');
}

function breakers() {
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Typ</th><th>Vypnutie</th><th>Kde</th><th>Pozor</th></tr></thead>
    <tbody>${BREAKER_CHARS.map((b) => `<tr>
      <td><b>${esc(b.id)}</b><br><span class="small">${esc(b.sk)}</span><br><span class="de small">${esc(b.de)}</span></td>
      <td>${esc(b.trip)}</td><td>${esc(b.use)}</td><td class="bad-text small">${esc(b.warn)}</td>
    </tr>`).join('')}</tbody></table></div>
    <p class="muted small">Pre výpočet odpojenia aplikácia používa hornú hranicu pásma (B = 5×In, C = 10×In, D = 20×In). Je to bezpečnejšie, ale konkrétny istič môže vypnúť skôr.</p>`;
}

function rcds() {
  const t = DATASETS.rcdTypes.data;
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Typ</th><th>Čo zachytí</th><th>Kde</th></tr></thead>
    <tbody>${Object.entries(t).map(([k, v]) => `<tr><td><b>${esc(k)}</b><br><span class="de small">${esc(v.de)}</span></td>
      <td>${esc(v.sk)}</td><td>${esc(v.use)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Citlivosti</h4>
    <div class="table-wrap"><table class="tbl"><tbody>
      ${RCD_CURRENTS.map((r) => `<tr><td><b>${esc(r.sk)}</b></td><td>${esc(r.use)}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function ipik() {
  return `<h4>IP — prvá číslica (telesá a prach)</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${IP_CODE.first.map((x) => `<tr><td><b>${esc(x.d)}</b></td><td>${esc(x.sk)}</td><td class="de">${esc(x.de)}</td></tr>`).join('')}</tbody></table></div>
    <h4>IP — druhá číslica (voda)</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${IP_CODE.second.map((x) => `<tr><td><b>${esc(x.d)}</b></td><td>${esc(x.sk)}</td><td class="de">${esc(x.de)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Bežné kombinácie</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${IP_CODE.common.map((x) => `<tr><td><b>${esc(x.code)}</b></td><td>${esc(x.use)}</td></tr>`).join('')}</tbody></table></div>
    <h4>IK — mechanická odolnosť</h4>
    <div class="table-wrap"><table class="tbl"><tbody>${IK_CODE.map((x) => `<tr><td><b>${esc(x.code)}</b></td><td>${esc(x.j)}</td><td>${esc(x.use)}</td></tr>`).join('')}</tbody></table></div>`;
}

function zones() {
  return `<div class="banner bad">${esc(BATHROOM_ZONES.warn)}</div>
    ${BATHROOM_ZONES.zones.map((z) => `<article class="card">
      <h4>${esc(z.sk)} <em class="de">${esc(z.de)}</em></h4>
      <p><b>Kde to je:</b> ${esc(z.geometry)}</p>
      <p><b>Čo tam smie:</b> ${esc(z.allowed)}</p>
      <p><b>Krytie:</b> ${esc(z.ip)}</p>
    </article>`).join('')}
    <h4>Platí vždy</h4>
    <ul>${BATHROOM_ZONES.general.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>`;
}

function symbols() {
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Značka</th><th>SK</th><th>DE</th><th>Popis</th></tr></thead>
    <tbody>${SYMBOLS.map((s) => `<tr><td><b>${esc(s.mark)}</b></td><td>${esc(s.sk)}</td>
      <td class="de">${esc(s.de)}</td><td class="small">${esc(s.note)}</td></tr>`).join('')}</tbody></table></div>`;
}

function terminals() {
  return TERMINALS.map((t) => `<article class="card">
    <h4>${esc(t.sk)} <em class="de">${esc(t.de)}</em></h4>
    <p class="marks">${esc(t.marks)}</p>
    <p class="small">${esc(t.note)}</p>
  </article>`).join('');
}

function torques() {
  return `<div class="banner bad">${esc(TORQUES.warn)}</div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>Veľkosť</th><th>Moment</th><th>Kde</th></tr></thead>
      <tbody>${TORQUES.rows.map((r) => `<tr><td>${esc(r.size)}</td><td><b>${esc(r.nm)}</b></td><td class="small">${esc(r.note)}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

function nets() {
  const t = DATASETS.netTypes.data;
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Sieť</th><th>Čo to znamená</th><th>Pozor</th></tr></thead>
    <tbody>${Object.entries(t).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v.sk)}</td>
      <td class="bad-text small">${esc(v.warn || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

function methods() {
  const t = DATASETS.installMethods.data;
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Kód</th><th>SK</th><th>DE</th><th>Na stavbe</th></tr></thead>
    <tbody>${Object.entries(t).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v.sk)}</td>
      <td class="de">${esc(v.de)}</td><td class="small">${esc(v.hint)}</td></tr>`).join('')}</tbody></table></div>`;
}
