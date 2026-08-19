/**
 * Visual language for the metrics card.
 * "aurora" = dark GitHub canvas + pink -> violet -> cyan accents (matches the README banner).
 */
export const theme = {
  width: 900,
  pad: 26,
  gap: 14,
  radius: 18,
  panelRadius: 14,

  bg: '#0d1117',
  bgSoft: '#111823',
  panel: 'rgba(22,27,34,0.72)',
  panelStroke: 'rgba(240,246,252,0.09)',
  stroke: '#21262d',

  text: '#e6edf3',
  textDim: '#9aa7b4',
  textFaint: '#6e7b8b',

  pink: '#f75c7e',
  violet: '#a855f7',
  cyan: '#22d3ee',
  green: '#3fb950',
  blue: '#1f6feb',

  // Contribution heat ramp (violet -> pink neon)
  heat: ['#161b22', '#4b2a86', '#7c3aed', '#b45bf5', '#f75c7e'],

  fontSans:
    "'Inter','Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji',sans-serif",
  fontMono:
    "'JetBrains Mono','SFMono-Regular','Cascadia Code',Consolas,'Liberation Mono',Menlo,monospace",
};

export const contentWidth = theme.width - theme.pad * 2;
