/** Zdieľanie výsledku ako text alebo PDF (cez tlač). */

import { toast } from './ui/dom.js';

export async function shareText(text, title = 'Výpočet') {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
  } catch { /* používateľ zrušil — skúsime clipboard */ }
  try {
    await navigator.clipboard.writeText(text);
    toast('Skopírované do schránky.');
  } catch {
    // posledná možnosť: otvor okno s textom na manuálne skopírovanie
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<pre style="white-space:pre-wrap;font:14px/1.5 monospace;padding:16px">${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`);
      w.document.close();
    } else {
      toast('Zdieľanie sa nepodarilo.');
    }
  }
}

/** Otvorí tlačový náhľad — v telefóne sa dá uložiť ako PDF. */
export function printResult({ title, job, country, html, text }) {
  const w = window.open('', '_blank');
  if (!w) { toast('Prehliadač zablokoval nové okno.'); return; }
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  w.document.write(`<!doctype html><html lang="sk"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body{font:12pt/1.5 -apple-system,system-ui,sans-serif;margin:18mm 14mm;color:#111}
  h1{font-size:16pt;margin:0 0 2mm}
  .meta{font-size:10pt;color:#555;margin:0 0 6mm;border-bottom:1px solid #ccc;padding-bottom:3mm}
  pre{white-space:pre-wrap;font:10pt/1.45 ui-monospace,monospace}
  .disc{margin-top:8mm;padding:3mm;border:1px solid #c00;color:#900;font-size:9.5pt}
  @media print{ .noprint{display:none} }
</style></head><body>
<h1>${esc(title)}</h1>
<div class="meta">
  ${job ? `Zákazka: <strong>${esc(job)}</strong><br>` : ''}
  Norma: <strong>${country === 'SK' ? 'Slovensko (STN)' : 'Nemecko (VDE/DIN)'}</strong><br>
  Dátum: ${esc(new Date().toLocaleString('sk-SK'))}
</div>
${html || `<pre>${esc(text)}</pre>`}
<div class="disc">Aplikácia „Elektrikár do vrecka“ je pomôcka. Nenahrádza normu, projekt, meranie ani zodpovednosť odborníka. Výsledky opierajúce sa o neoverené tabuľkové hodnoty sú v dokumente označené.</div>
<p class="noprint"><button onclick="window.print()">Tlačiť / uložiť ako PDF</button></p>
</body></html>`);
  w.document.close();
  setTimeout(() => { try { w.focus(); } catch {} }, 120);
}
