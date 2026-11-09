/** Schematické obrázky spôsobov uloženia (inline SVG, bez externých súborov). */

const W = 'var(--ico-wall)';
const I = 'var(--ico-ins)';
const C = 'var(--ico-cable)';
const E = 'var(--ico-earth)';
const S = 'var(--ico-line)';

function wrap(inner) {
  return `<svg viewBox="0 0 64 44" class="mico" aria-hidden="true">${inner}</svg>`;
}

const hatch = `<defs><pattern id="hw" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
  <line x1="0" y1="0" x2="0" y2="6" stroke="${S}" stroke-width="1"/></pattern>
  <pattern id="he" width="5" height="5" patternUnits="userSpaceOnUse">
  <circle cx="2" cy="2" r="0.9" fill="${S}"/></pattern></defs>`;

export const METHOD_ICONS = {
  // jednotlivé vodiče v trubke v izolovanej stene
  A1: wrap(`${hatch}
    <rect x="2" y="2" width="60" height="40" fill="${I}" stroke="${S}"/>
    <rect x="2" y="2" width="60" height="40" fill="url(#hw)" opacity=".5"/>
    <circle cx="32" cy="22" r="12" fill="none" stroke="${S}" stroke-width="2"/>
    <circle cx="27" cy="19" r="3.4" fill="${C}"/><circle cx="37" cy="19" r="3.4" fill="${C}"/>
    <circle cx="32" cy="27" r="3.4" fill="${C}"/>`),
  // viacžilový kábel v trubke v izolovanej stene
  A2: wrap(`${hatch}
    <rect x="2" y="2" width="60" height="40" fill="${I}" stroke="${S}"/>
    <rect x="2" y="2" width="60" height="40" fill="url(#hw)" opacity=".5"/>
    <circle cx="32" cy="22" r="12" fill="none" stroke="${S}" stroke-width="2"/>
    <circle cx="32" cy="22" r="8.5" fill="${C}" stroke="${S}"/>
    <circle cx="29" cy="20" r="2.4" fill="${W}"/><circle cx="35" cy="20" r="2.4" fill="${W}"/>
    <circle cx="32" cy="26" r="2.4" fill="${W}"/>`),
  // jednotlivé vodiče v trubke na stene
  B1: wrap(`
    <rect x="2" y="2" width="18" height="40" fill="${W}" stroke="${S}"/>
    <circle cx="38" cy="22" r="12" fill="none" stroke="${S}" stroke-width="2"/>
    <circle cx="33" cy="19" r="3.4" fill="${C}"/><circle cx="43" cy="19" r="3.4" fill="${C}"/>
    <circle cx="38" cy="27" r="3.4" fill="${C}"/>
    <line x1="20" y1="22" x2="26" y2="22" stroke="${S}" stroke-width="2"/>`),
  // viacžilový kábel v trubke na stene
  B2: wrap(`
    <rect x="2" y="2" width="18" height="40" fill="${W}" stroke="${S}"/>
    <circle cx="38" cy="22" r="12" fill="none" stroke="${S}" stroke-width="2"/>
    <circle cx="38" cy="22" r="8.5" fill="${C}" stroke="${S}"/>
    <circle cx="35" cy="20" r="2.4" fill="${W}"/><circle cx="41" cy="20" r="2.4" fill="${W}"/>
    <circle cx="38" cy="26" r="2.4" fill="${W}"/>
    <line x1="20" y1="22" x2="26" y2="22" stroke="${S}" stroke-width="2"/>`),
  // kábel priamo na stene
  C: wrap(`
    <rect x="2" y="2" width="22" height="40" fill="${W}" stroke="${S}"/>
    <circle cx="36" cy="22" r="10" fill="${C}" stroke="${S}" stroke-width="1.5"/>
    <circle cx="33" cy="20" r="2.6" fill="${W}"/><circle cx="39" cy="20" r="2.6" fill="${W}"/>
    <circle cx="36" cy="26" r="2.6" fill="${W}"/>
    <path d="M24 14 h4 M24 30 h4" stroke="${S}" stroke-width="2"/>`),
  // kábel v chráničke v zemi
  D1: wrap(`${hatch}
    <rect x="2" y="2" width="60" height="8" fill="none" stroke="${S}" stroke-dasharray="3 3"/>
    <rect x="2" y="10" width="60" height="32" fill="${E}" stroke="${S}"/>
    <rect x="2" y="10" width="60" height="32" fill="url(#he)" opacity=".6"/>
    <circle cx="32" cy="26" r="11" fill="none" stroke="${S}" stroke-width="2"/>
    <circle cx="32" cy="26" r="7.5" fill="${C}" stroke="${S}"/>`),
  // kábel priamo v zemi
  D2: wrap(`${hatch}
    <rect x="2" y="2" width="60" height="8" fill="none" stroke="${S}" stroke-dasharray="3 3"/>
    <rect x="2" y="10" width="60" height="32" fill="${E}" stroke="${S}"/>
    <rect x="2" y="10" width="60" height="32" fill="url(#he)" opacity=".6"/>
    <circle cx="32" cy="26" r="9" fill="${C}" stroke="${S}" stroke-width="1.5"/>
    <circle cx="29" cy="24" r="2.4" fill="${E}"/><circle cx="35" cy="24" r="2.4" fill="${E}"/>
    <circle cx="32" cy="30" r="2.4" fill="${E}"/>`),
  // viacžilový kábel voľne vo vzduchu / dierovaný rošt
  E: wrap(`
    <path d="M6 32 h52" stroke="${S}" stroke-width="2"/>
    <path d="M6 32 v-6 M58 32 v-6" stroke="${S}" stroke-width="2"/>
    <circle cx="14" cy="32" r="1.2" fill="${S}"/><circle cx="22" cy="32" r="1.2" fill="${S}"/>
    <circle cx="42" cy="32" r="1.2" fill="${S}"/><circle cx="50" cy="32" r="1.2" fill="${S}"/>
    <circle cx="32" cy="22" r="10" fill="${C}" stroke="${S}" stroke-width="1.5"/>
    <circle cx="29" cy="20" r="2.6" fill="${W}"/><circle cx="35" cy="20" r="2.6" fill="${W}"/>
    <circle cx="32" cy="26" r="2.6" fill="${W}"/>`),
  // jednožilové káble voľne vo vzduchu, dotýkajúce sa
  F: wrap(`
    <path d="M6 34 h52" stroke="${S}" stroke-width="2"/>
    <path d="M6 34 v-6 M58 34 v-6" stroke="${S}" stroke-width="2"/>
    <circle cx="20" cy="22" r="7.5" fill="${C}" stroke="${S}" stroke-width="1.5"/>
    <circle cx="35" cy="22" r="7.5" fill="${C}" stroke="${S}" stroke-width="1.5"/>
    <circle cx="50" cy="22" r="7.5" fill="${C}" stroke="${S}" stroke-width="1.5"/>`),
};

export function methodIcon(m) {
  return METHOD_ICONS[m] || '<svg viewBox="0 0 64 44" class="mico"><text x="32" y="28" text-anchor="middle" font-size="14">?</text></svg>';
}
