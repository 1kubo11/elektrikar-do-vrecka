/** Render výsledku výpočtu — farba, kontroly, rozbaľovací postup, referencie. */

import { esc, details } from './dom.js';
import { grade, fmt } from '../calc/core.js';
import * as store from '../store.js';

const COLOR_ICON = { green: '✓', orange: '!', red: '✕' };

/**
 * Predvolený údaj bežnou rečou. Čo sa nedá povedať jednoducho, vráti null
 * a zostane vypísané v podrobnostiach (nič sa nestráca).
 */
function plainDefault(d) {
  const w = d.what;
  if (w.startsWith('teplota okolia')) return `je tam do ${d.value}`;
  if (w.startsWith('teplota zeme')) return `zem má ${d.value}`;
  if (w.startsWith('počet súbežných')) return 'kábel ide sám';
  if (w.startsWith('povolený úbytok')) return `napätie smie klesnúť najviac o ${d.value}`;
  if (w.startsWith('Ze')) return 'sieť je bežná (odhad — nemeral si ju)';
  if (w === 'izolácia') return 'kábel má PVC izoláciu';
  if (w.startsWith('prúd pre úbytok')) return 'obvod pôjde naplno';
  if (w === 'cos φ' && /orientačn/.test(d.why)) return 'cos φ som odhadol';
  if (w.startsWith('účinnosť')) return 'účinnosť som odhadol';
  if (w.startsWith('násobok rozbehového')) return `pri štarte berie ${d.value}`;
  if (w.startsWith('teplotný súčiniteľ')) return 'panel je bežný kremíkový';
  if (w.startsWith('najnižšia návrhová')) return `v zime bude najmenej ${d.value}`;
  return null;
}

/**
 * JEDNODUCHÝ VÝSLEDOK — jedna jasná odpoveď, pár viet bežnou rečou
 * a všetko ostatné schované pod „Podrobnosti výpočtu“.
 */
function renderSimple(r) {
  const g = grade(r);
  const checks = (r.checks || []).filter((c) => c.plain !== false);
  const hasFailedCheck = checks.some((c) => c.ok === false);

  const label = g.kind === 'fail' ? (hasFailedCheck || r.fixes?.length ? 'Nevyhovuje' : 'Skontroluj zadanie')
    : g.kind === 'missing' ? 'Chýba údaj'
      : g.kind === 'unverified' ? 'Vyhovuje — orientačne'
        : g.kind === 'warn' ? 'Ešte skontroluj'
          : 'Vyhovuje';

  const checkList = checks.length ? `<ul class="checks plain">
    ${checks.map((c) => {
      const cls = c.ok === true ? 'ok' : c.ok === false ? 'bad' : 'unk';
      const ico = c.ok === true ? '✓' : c.ok === false ? '✕' : '?';
      return `<li class="chk ${cls}"><span class="chk-ico">${ico}</span><span>${esc(c.plain || c.label)}</span></li>`;
    }).join('')}
  </ul>` : '';

  /* pri chybe zadania (napr. chýba dĺžka) ukáž priamo správu */
  const message = g.kind === 'fail' && !hasFailedCheck && r.headline
    ? `<p class="res-headline">${esc(r.headline)}</p>` : '';

  const miss = r.missing?.length ? `<div class="soft-note warn">
    <b>Toto mi chýba, bez toho to neviem spočítať:</b>
    <ul>${r.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : '';

  /* čo s tým — len keď nevyhovuje, najprv riešenia, ktoré naozaj pomôžu */
  let fixes = '';
  if (g.kind === 'fail' && r.fixes?.length) {
    const sorted = [...r.fixes].sort((a, b) => (b.ok === true) - (a.ok === true)).slice(0, 3);
    fixes = `<div class="todo">
      <b>Čo s tým:</b>
      <ul>${sorted.map((f) => `<li><strong>${esc(f.label)}</strong>${f.ok === true ? ' — vyhovuje' : ''}<br>
        <span class="small muted">${esc(f.result)}</span></li>`).join('')}</ul>
    </div>`;
  }

  const unverified = g.kind === 'unverified' ? `<p class="soft-note">
    Tabuľky v aplikácii ešte nie sú skontrolované podľa normy, preto ber výsledok ako orientačný.
    <a href="#/data">Skontrolovať tabuľky</a></p>` : '';

  const plainDefs = (r.defaults || []).map(plainDefault).filter(Boolean);
  const hiddenDefs = (r.defaults || []).length - plainDefs.length;
  const defs = r.defaults?.length ? `<p class="used-with">
    <b>Počítal som s tým, že:</b> ${plainDefs.map(esc).join(' · ')}${
      hiddenDefs > 0 ? `${plainDefs.length ? ' · ' : ''}a ${hiddenDefs} ďalších bežných hodnôt (v podrobnostiach)` : ''}</p>` : '';

  const full = `
    ${r.headline ? `<p class="res-headline">${esc(r.headline)}</p>` : ''}
    <p class="res-reason">${esc(g.reason)}</p>
    ${renderChecks(r)}
    ${renderDefaults(r)}
    ${renderSteps(r)}
    ${renderRefs(r)}
    ${renderNotes(r)}
    ${renderFixes(r)}`;

  return `<section class="result simple res-${g.color}">
    <header class="res-head">
      <span class="res-badge">${COLOR_ICON[g.color]}</span>
      <div class="res-head-text"><p class="res-label">${esc(label)}</p></div>
    </header>
    ${message}
    ${checkList}
    ${miss}
    ${fixes}
    ${unverified}
    ${defs}
    ${details('Podrobnosti výpočtu', full)}
    <div class="res-actions">
      <button type="button" class="btn" data-action="save-calc">Uložiť</button>
      <button type="button" class="btn" data-action="share-text">Zdieľať</button>
      <button type="button" class="btn" data-action="share-pdf">PDF</button>
    </div>
  </section>`;
}

export function renderResult(r, { title, shareId } = {}) {
  if (!r) return '';
  if (!store.isDetail()) return renderSimple(r);
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
