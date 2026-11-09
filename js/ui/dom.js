/** Malé DOM pomôcky — bez knižníc. */

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ───────── polia formulára (vracajú HTML) ───────── */

export function fieldNum({ name, label, de, value, unit, placeholder, hint, step = 'any', min }) {
  return `<label class="field">
    <span class="field-label">${esc(label)}${de ? `<em class="de">${esc(de)}</em>` : ''}</span>
    <span class="field-input">
      <input type="text" inputmode="decimal" name="${esc(name)}" value="${esc(value ?? '')}"
        placeholder="${esc(placeholder ?? '')}" data-input autocomplete="off" />
      ${unit ? `<span class="unit">${esc(unit)}</span>` : ''}
    </span>
    ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}
  </label>`;
}

export function fieldSelect({ name, label, de, value, options, hint }) {
  return `<label class="field">
    <span class="field-label">${esc(label)}${de ? `<em class="de">${esc(de)}</em>` : ''}</span>
    <span class="field-input">
      <select name="${esc(name)}" data-input>
        ${options.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(value) ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}
      </select>
    </span>
    ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}
  </label>`;
}

export function segmented({ name, label, value, options, de }) {
  return `<div class="field">
    <span class="field-label">${esc(label)}${de ? `<em class="de">${esc(de)}</em>` : ''}</span>
    <div class="seg" role="group">
      ${options.map((o) => `<button type="button" class="seg-btn ${String(o.v) === String(value) ? 'on' : ''}"
        data-seg="${esc(name)}" data-val="${esc(o.v)}">${esc(o.t)}</button>`).join('')}
    </div>
  </div>`;
}

export function details(summary, body, open = false) {
  return `<details class="box" ${open ? 'open' : ''}><summary>${summary}</summary><div class="box-body">${body}</div></details>`;
}

/** Zvýrazní hľadaný text. */
export function mark(text, q) {
  const t = esc(text);
  if (!q) return t;
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return t;
  return `${t.slice(0, i)}<mark>${t.slice(i, i + q.length)}</mark>${t.slice(i + q.length)}`;
}

/** Jednoduché „toast“ hlásenie. */
export function toast(msg) {
  let box = document.getElementById('toast');
  if (!box) {
    box = h('<div id="toast" class="toast"></div>');
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.classList.add('show');
  clearTimeout(box._t);
  box._t = setTimeout(() => box.classList.remove('show'), 2600);
}
