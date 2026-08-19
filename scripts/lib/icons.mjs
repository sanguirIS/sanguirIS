/**
 * Modern line icons (Lucide-style, 24x24 grid, stroke based).
 * Each entry is the inner markup of an icon drawn with `stroke="currentColor"`.
 */
const RAW = {
  commit: '<circle cx="12" cy="12" r="3.2"/><path d="M2.5 12h6.3M15.2 12h6.3"/>',
  star: '<path d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z"/>',
  users:
    '<path d="M16.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.1a3.6 3.6 0 0 0-3.6 3.6v1.8"/><circle cx="9.5" cy="7.6" r="3.6"/><path d="M21.5 20.5v-1.8a3.6 3.6 0 0 0-2.7-3.5M15.6 4.2a3.6 3.6 0 0 1 0 6.9"/>',
  repo: '<path d="M4.5 18.6A2.1 2.1 0 0 1 6.6 16.5H19.5"/><path d="M6.6 2.5H19.5v19H6.6a2.1 2.1 0 0 1-2.1-2.1V4.6a2.1 2.1 0 0 1 2.1-2.1z"/>',
  calendar:
    '<rect x="3" y="4.8" width="18" height="16.2" rx="2.6"/><path d="M3 9.8h18M8.2 2.8v3.6M15.8 2.8v3.6"/>',
  flame:
    '<path d="M12 2.7c.6 2.6 2.1 4.4 4 6 1.8 1.5 2.8 3.3 2.8 5.4a6.8 6.8 0 1 1-13.6 0c0-1.2.4-2.3 1.1-3.2a2.6 2.6 0 0 0 2.6 2.5 2.5 2.5 0 0 0 2.5-2.5c0-1.4-.6-2-1-3-1-2.1-.2-3.9 1.6-5.2z"/>',
  pulse: '<path d="M21.5 12h-4.2l-2.9 8.4L8.7 3.6 5.9 12H2.5"/>',
  code: '<path d="M15.8 18.2L21 12l-5.2-6.2M8.2 5.8L3 12l5.2 6.2"/>',
  clock: '<circle cx="12" cy="12" r="9.2"/><path d="M12 6.6V12l3.6 2.1"/>',
  layers:
    '<path d="M12 2.6l9.2 4.9-9.2 4.9-9.2-4.9z"/><path d="M2.8 12.6l9.2 4.9 9.2-4.9M2.8 17.2l9.2 4.9 9.2-4.9"/>',
  eye: '<path d="M1.8 12S5.6 4.9 12 4.9 22.2 12 22.2 12 18.4 19.1 12 19.1 1.8 12 1.8 12z"/><circle cx="12" cy="12" r="3.1"/>',
  branch:
    '<path d="M6.4 3.4v11.2"/><circle cx="6.4" cy="18.2" r="2.7"/><circle cx="6.4" cy="4.4" r="2.7"/><circle cx="17.6" cy="7.4" r="2.7"/><path d="M17.6 10.1c0 4.1-3.3 5.1-6.5 5.6-2.2.4-4.7.9-4.7 3"/>',
  terminal: '<path d="M4.6 17.6l5.6-5.6-5.6-5.6M12.4 18.4h7"/>',
  zap: '<path d="M13.4 2.4L4 14.1h7.2l-.6 7.5L20 9.9h-7.2z"/>',
  sparkle:
    '<path d="M12 2.8l2 5.6 5.6 2-5.6 2-2 5.6-2-5.6-5.6-2 5.6-2z"/><path d="M18.8 15.6l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  globe:
    '<circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8a15 15 0 0 1 0 18.4 15 15 0 0 1 0-18.4z"/>',
  issue: '<circle cx="12" cy="12" r="9.2"/><path d="M12 7.6v5M12 16.2h.01"/>',
  pr: '<circle cx="6.4" cy="5.4" r="2.7"/><circle cx="6.4" cy="18.6" r="2.7"/><path d="M6.4 8.1v7.8"/><circle cx="17.6" cy="18.6" r="2.7"/><path d="M17.6 15.9V10a4 4 0 0 0-4-4h-2.4"/><path d="M13.4 3.6l-2.4 2.4 2.4 2.4"/>',
  review: '<path d="M20.4 14.2a2 2 0 0 1-2 2H8.2L4 20.4V5.6a2 2 0 0 1 2-2h12.4a2 2 0 0 1 2 2z"/><path d="M8.6 9.6h7M8.6 12.8h4.4"/>',
  folder: '<path d="M21 18.6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5.4a2 2 0 0 1 2-2h4.4l2.4 3h7.2a2 2 0 0 1 2 2z"/>',
  edit: '<path d="M11.4 4.6H5a2 2 0 0 0-2 2v12.4a2 2 0 0 0 2 2h12.4a2 2 0 0 0 2-2v-6.4"/><path d="M17.9 3.1a2.1 2.1 0 0 1 3 3L12.4 14.6l-4 1 1-4z"/>',
  location: '<path d="M20 10.4c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10.2" r="2.9"/>',
  heart: '<path d="M20.3 5.7a5 5 0 0 0-7.1 0L12 6.9l-1.2-1.2a5 5 0 1 0-7.1 7.1l8.3 8.3 8.3-8.3a5 5 0 0 0 0-7.1z"/>',
};

/**
 * @param {keyof typeof RAW} name
 * @param {{x:number,y:number,size?:number,color?:string,width?:number,opacity?:number}} opts
 */
export function icon(name, { x, y, size = 16, color = '#8b949e', width = 1.7, opacity = 1 }) {
  const body = RAW[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const scale = size / 24;
  return (
    `<g transform="translate(${round(x)} ${round(y)}) scale(${round(scale, 4)})" ` +
    `fill="none" stroke="${color}" stroke-width="${round(width / scale, 2)}" ` +
    `stroke-linecap="round" stroke-linejoin="round"${opacity !== 1 ? ` opacity="${opacity}"` : ''}>` +
    `${body}</g>`
  );
}

export function hasIcon(name) {
  return Boolean(RAW[name]);
}

function round(n, p = 2) {
  return Number.parseFloat(Number(n).toFixed(p));
}
