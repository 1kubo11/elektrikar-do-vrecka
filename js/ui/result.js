/** Render výsledku výpočtu — farba, kontroly, rozbaľovací postup, referencie. */

import { esc, details } from './dom.js';
import { grade, fmt } from '../calc/core.js';

const COLOR_ICON = { green: '✓', orange: '!', red: '✕' };

export function renderResult(r, { title, shareId } = {}) {
  if (!r) return '';
  const g = grade(r);

  return `<section class="result res-${g.color}" data-result-id="${esc(shareId || '')}">
    <header class="res-head">
      <span class="res-badge">${COLOR_ICON[g.color]}</span>
      <div class="res-head-text">
        <h2>${esc(title || r.title || '')}</h2>
        <p class="res-label">${esc(g.label)}</p>
      </div>
    </header>

    ${r.headline ? `<p class="res-headline">${esc(r.headline)}</p>` : ''}
    <p class="res-reason">${esc(g.reason)}</p>

    ${renderChecks(r)}
    ${renderMissing(r)}
    ${renderDefaults(r)}
    ${renderSteps(r)}
    ${renderRefs(r)}
    ${renderNotes(r)}
    ${renderFixes(r)}

    <div class="res-actions">
      <button type="button" class="btn" data-action="share-text">Zdieľať text</button>
      <button type="button" class="btn" data-action="share-pdf">PDF / tlač</button>
      <button type="button" class="btn" data-action="save-calc">Uložiť výpočet</button>
    </div>
  </section>`;
}

function renderChecks(r) {
  if (!r.checks?.length) return '';
  return `<ul class="checks">
    ${r.checks.map((c) => {
      const cls = c.ok === true ? 'ok' : c.ok === false ? 'bad' : 'unk';
      const ico = c.ok === true ? '✓' : c.ok === false ? '✕' : '?';
      return `<li class="chk ${cls}"><span class="chk-ico">${ico}</span>
        <span><strong>${esc(c.label)}</strong>${c.detail ? `<br><span class="chk-detail">${esc(c.detail)}</span>` : ''}</span></li>`;
    }).join('')}
  </ul>`;
}

function renderMissing(r) {
  if (!r.missing?.length) return '';
  return `<div class="banner warn">
    <strong>Chýbajúce údaje — aplikácia nič nepredpokladá potichu:</strong>
    <ul>${r.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
  </div>`;
}

function renderDefaults(r) {
  if (!r.defaults?.length) return '';
  return `<div class="banner info">
    <strong>Predvolené údaje, ktoré som dosadil:</strong>
    <ul>${r.defaults.map((d) => `<li><b>${esc(d.what)} = ${esc(d.value)}</b> — ${esc(d.why)}</li>`).join('')}</ul>
  </div>`;
}

function renderSteps(r) {
  if (!r.steps?.length) return '';
  const body = `<ol class="steps">
    ${r.steps.map((s) => `<li>
      <div class="step-label">${esc(s.label)}</div>
      <div class="step-formula"><code>${esc(s.formula)}</code></div>
      ${s.substituted && s.substituted !== '—' ? `<div class="step-sub">dosadené: <code>${esc(s.substituted)}</code></div>` : ''}
      <div class="step-res">= <strong>${esc(s.result)}</strong></div>
      ${s.source ? `<div class="step-src">${esc(s.source)}</div>` : ''}
    </li>`).join('')}
  </ol>`;
  return details('Postup výpočtu — vzorce a dosadené hodnoty', body);
}

function renderRefs(r) {
  if (!r.refs?.length) return '';
  const unver = r.refs.filter((x) => !x.verified).length;
  const body = `<ul class="refs">
    ${r.refs.map((x) => `<li class="ref ${x.verified ? 'v' : 'nv'}">
      <span class="ref-state">${x.verified ? 'Overené' : 'NEOVERENÉ'}</span>
      <div>
        <strong>${esc(x.datasetId)}</strong>${x.path ? ` <code>${esc(x.path)}</code>` : ''}
        ${x.overridden ? '<span class="pill">ručne upravené</span>' : ''}
        <br><span class="ref-std">${esc(x.standard)} · vydanie ${esc(x.edition)} · ${esc(x.table)} · ${esc(x.country === 'BOTH' ? 'DE + SK' : x.country)}</span>
        ${x.note ? `<br><span class="ref-note">${esc(x.note)}</span>` : ''}
      </div>
    </li>`).join('')}
  </ul>
  <p class="muted">Hodnoty skontroluješ a označíš ako overené v <a href="#/data">Overenie dát</a>.</p>`;
  return details(`Použité tabuľky a normy (${r.refs.length}${unver ? `, z toho ${unver} neoverených` : ''})`, body);
}

function renderNotes(r) {
  if (!r.notes?.length) return '';
  return details(`Upozornenia a poznámky (${r.notes.length})`,
    `<ul class="notes">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`);
}

function renderFixes(r) {
  if (!r.fixes?.length) return '';
  const body = `<ul class="fixes">
    ${r.fixes.map((f) => {
      const cls = f.ok === true ? 'ok' : f.ok === false ? 'bad' : 'unk';
      return `<li class="fix ${cls}">
        <div class="fix-label">${esc(f.label)}</div>
        <div class="fix-res">${esc(f.result)}</div>
        ${f.detail ? `<div class="fix-detail">${esc(f.detail)}</div>` : ''}
      </li>`;
    }).join('')}
  </ul>`;
  const open = r.status === 'fail';
  return details(`Čo zmeniť — ${r.fixes.length} možností s prepočtom`, body, open);
}

/** Textová podoba výsledku na zdieľanie. */
export function resultToText(r, meta = {}) {
  const g = grade(r);
  const lines = [];
  lines.push('ELEKTRIKÁR DO VRECKA — výsledok výpočtu');
  lines.push('');
  if (meta.job) lines.push(`Zákazka: ${meta.job}`);
  lines.push(`Dátum: ${new Date().toLocaleString('sk-SK')}`);
  lines.push(`Norma / krajina: ${meta.country === 'SK' ? 'Slovensko (STN)' : 'Nemecko (VDE/DIN)'}`);
  lines.push('');
  lines.push(`${r.title || ''}`);
  lines.push(`STAV: ${g.label.toUpperCase()} (${g.color})`);
  if (r.headline) lines.push(r.headline);
  lines.push(g.reason);
  lines.push('');

  if (meta.inputs) {
    lines.push('VSTUPY');
    for (const [k, v] of Object.entries(meta.inputs)) {
      if (v === '' || v === undefined || v === null) continue;
      lines.push(`  ${k}: ${v}`);
    }
    lines.push('');
  }

  if (r.checks?.length) {
    lines.push('KONTROLY');
    r.checks.forEach((c) => lines.push(`  [${c.ok === true ? 'OK' : c.ok === false ? 'NEVYHOVUJE' : '?'}] ${c.label}${c.detail ? ` — ${c.detail}` : ''}`));
    lines.push('');
  }
  if (r.defaults?.length) {
    lines.push('PREDVOLENÉ ÚDAJE');
    r.defaults.forEach((d) => lines.push(`  ${d.what} = ${d.value} (${d.why})`));
    lines.push('');
  }
  if (r.missing?.length) {
    lines.push('CHÝBAJÚCE ÚDAJE');
    r.missing.forEach((m) => lines.push(`  ${m}`));
    lines.push('');
  }
  if (r.steps?.length) {
    lines.push('POSTUP');
    r.steps.forEach((s) => {
      lines.push(`  ${s.label}`);
      lines.push(`    ${s.formula}`);
      if (s.substituted && s.substituted !== '—') lines.push(`    dosadené: ${s.substituted}`);
      lines.push(`    = ${s.result}`);
      if (s.source) lines.push(`    zdroj: ${s.source}`);
    });
    lines.push('');
  }
  if (r.refs?.length) {
    lines.push('POUŽITÉ TABUĽKY');
    r.refs.forEach((x) => lines.push(`  [${x.verified ? 'overené' : 'NEOVERENÉ'}] ${x.datasetId}${x.path ? ` (${x.path})` : ''} — ${x.standard}, ${x.table}`));
    lines.push('');
  }
  if (r.notes?.length) {
    lines.push('UPOZORNENIA');
    r.notes.forEach((n) => lines.push(`  - ${n}`));
    lines.push('');
  }
  lines.push('—');
  lines.push('Aplikácia je pomôcka. Nenahrádza normu, projekt, meranie ani zodpovednosť odborníka.');
  return lines.join('\n');
}
