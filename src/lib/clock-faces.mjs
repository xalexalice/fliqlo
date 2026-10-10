// HTML/SVG adaptations of the approved MIT projects. See THIRD_PARTY_NOTICES.md.
export const analogFaces = ['station', 'neumorphic', 'roman', 'chronograph'];
export const addedFaces = [...analogFaces, 'aura', 'rolling', 'bubble', 'nixie'];

function ticks(radius, count = 60, cx = 120, cy = 120) {
  return Array.from({ length: count }, (_, i) => `<line x1="${cx}" y1="${cy - radius}" x2="${cx}" y2="${cy - radius + (i % 5 ? 3 : 8)}" transform="rotate(${i * 360 / count} ${cx} ${cy})" class="face-tick ${i % 5 ? '' : 'face-major'}"/>`).join('');
}
function numerals(roman) {
  const labels = roman ? ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'] : ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const radius = roman ? 82 : 91;
  return labels.map((label, i) => `<text x="${120 + Math.sin(i * Math.PI / 6) * radius}" y="${120 - Math.cos(i * Math.PI / 6) * radius}" text-anchor="middle" dominant-baseline="central" class="face-number">${label}</text>`).join('');
}
function hands(id) {
  if (id === 'station') return '<g data-hand="hour" transform="rotate(305 120 120)"><rect x="114" y="55" width="12" height="82"/></g><g data-hand="minute" transform="rotate(60 120 120)"><rect x="115" y="26" width="10" height="116"/></g><g data-hand="second" transform="rotate(180 120 120)"><line x1="120" y1="140" x2="120" y2="61"/><circle cx="120" cy="61" r="8"/></g>';
  return `<line data-hand="hour" transform="rotate(305 120 120)" x1="120" y1="120" x2="120" y2="${id === 'neumorphic' ? 74 : 78}" class="face-hour"/><line data-hand="minute" transform="rotate(60 120 120)" x1="120" y1="120" x2="120" y2="${id === 'neumorphic' ? 43 : 45}" class="face-minute"/><line data-hand="second" transform="rotate(180 120 120)" x1="120" y1="${id === 'neumorphic' ? 120 : 135}" x2="120" y2="28" class="face-second"/><circle cx="120" cy="120" r="2.5" class="face-cap"/>`;
}
function subdial(cx, cy, label, hand) {
  return `<circle cx="${cx}" cy="${cy}" r="29" class="subdial-edge"/>${ticks(29, 12, cx, cy)}<text x="${cx}" y="${cy + 15}" text-anchor="middle" class="subdial-label">${label}</text><line data-sub-hand="${hand}" data-cx="${cx}" data-cy="${cy}" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 21}" class="subdial-hand"/>`;
}
export function clockFaceMarkup(id) {
  if (analogFaces.includes(id)) {
    let dial;
    if (id === 'station') dial = `<circle cx="120" cy="120" r="107" class="face-edge"/>${ticks(102)}`;
    else if (id === 'neumorphic') dial = '<defs><linearGradient id="neumo-face" x2="1" y2="1"><stop stop-color="#d4dfe6"/><stop offset="1" stop-color="#f4f9fa"/></linearGradient></defs><circle cx="120" cy="120" r="107" fill="url(#neumo-face)"/>';
    else if (id === 'roman') dial = `<defs><linearGradient id="roman-case" x2="1" y2="1"><stop stop-color="#e9e2d3"/><stop offset="1" stop-color="#cdbf9f"/></linearGradient><radialGradient id="roman-dial" cy="35%"><stop stop-color="#faf7f0"/><stop offset="1" stop-color="#e9e2d3"/></radialGradient></defs><rect width="240" height="240" rx="22" fill="url(#roman-case)"/><circle cx="120" cy="120" r="100" fill="url(#roman-dial)" class="face-edge"/>${ticks(94)}${numerals(true)}`;
    else dial = `<defs><radialGradient id="chrono-dial" cy="35%"><stop stop-color="#1b212b"/><stop offset="1" stop-color="#0c0f14"/></radialGradient></defs><circle cx="120" cy="120" r="117" fill="url(#chrono-dial)" class="face-edge"/>${ticks(111)}${numerals(false)}<text x="120" y="68" text-anchor="middle" class="face-brand">STILL</text>${subdial(63, 120, 'S', 'second')}${subdial(177, 120, '24', 'hours')}${subdial(120, 177, '31', 'date')}`;
    return `<svg class="face-analog face-${id}" viewBox="0 0 240 240" aria-hidden="true">${dial}${hands(id)}</svg>`;
  }
  if (id === 'aura') return '<div class="face-aura"><span class="aura-weekday" data-face-weekday data-preview-weekday>FRIDAY</span><div class="aura-time"><span data-face-time>10:10:30</span><span data-face-period></span></div><span class="aura-date" data-face-date data-preview-date>Friday, October 9</span><span class="aura-divider"></span></div>';
  if (id === 'rolling') return `<div class="face-rolling">${[...'10:10:30'].map((digit, i) => digit === ':' ? '<span class="rolling-colon">:</span>' : `<span class="rolling-digit" data-digit="${i}" data-value="${digit}"><span class="rolling-strip"><span>${digit}</span></span></span>`).join('')}</div>`;
  if (id === 'bubble') return `<div class="face-bubble">${[0, 1].map((group) => `${group ? '<span class="bubble-colon">:</span>' : ''}<span class="bubble-pair">${[0, 1].map(i => `<span data-bubble-digit="${group * 2 + i}">${i ? '0' : '1'}</span>`).join('')}</span>`).join('')}</div><span class="bubble-seconds" data-bubble-seconds>30</span>`;
  return '';
}
