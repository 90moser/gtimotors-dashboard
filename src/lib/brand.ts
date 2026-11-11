// Single source of truth for RSMotors brand identity.
// Update here to white-label the app for a different business.

export const BRAND = {
  name:      'RSMotors',
  subtitle:  'Lavado y Engrase',
  logoPath:  '/rsmotors-logo.png',

  // Hex values — reference only; real tokens live in CSS vars (src/index.css)
  colors: {
    black:   '#050505',
    surface: '#0E1116',
    surface2:'#161A21',
    yellow:  '#FFD400',   // primary — buttons, active, highlights
    blue:    '#1E90FF',   // accent — links, focus
    aqua:    '#4FC3F7',   // detail — hovers, success
    silver:  '#C9CED6',   // secondary text
    white:   '#FFFFFF',   // primary text
    danger:  '#CC2929',   // errors / destructive only
  },
} as const;
