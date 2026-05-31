/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Admin (dark / gold theme) ──────────────────── */
        ms: {
          bg:           '#0c0c0c',
          surface:      '#111111',
          border:       '#222222',
          blue:         '#c8a86a',
          'blue-dark':  '#a89058',
          'blue-light': 'rgba(200,168,106,0.12)',
          navy:         '#080808',
          text:         '#f0ece4',
          sub:          'rgba(240,236,228,0.55)',
          dim:          'rgba(240,236,228,0.35)',
          green:        '#4ade80',
          'green-bg':   'rgba(74,222,128,0.1)',
          orange:       '#fb923c',
          'orange-bg':  'rgba(251,146,60,0.1)',
          red:          '#f87171',
          'red-bg':     'rgba(248,113,113,0.12)',
          sidebar:      '#0e0e0e',
          'sidebar-active': 'rgba(200,168,106,0.1)',
        },
        /* ── Landing page colours ──────────────────────── */
        background: '#0c0c0c',
        foreground:  '#f0ece4',
        card:        { DEFAULT: '#111111', foreground: '#f0ece4' },
        primary:     { DEFAULT: '#c8a86a', foreground: '#0c0c0c' },
        secondary:   { DEFAULT: '#1a1a1a', foreground: '#f0ece4' },
        muted:       { DEFAULT: '#1a1a1a', foreground: 'rgba(240,236,228,0.45)' },
        border:      'rgba(200,168,106,0.18)',
        input:       'rgba(200,168,106,0.18)',
        ring:        '#c8a86a',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'ms':    '0 1.6px 3.6px rgba(0,0,0,.13), 0 .3px .9px rgba(0,0,0,.11)',
        'ms-md': '0 3.2px 7.2px rgba(0,0,0,.13), 0 .6px 1.8px rgba(0,0,0,.11)',
        'ms-lg': '0 6.4px 14.4px rgba(0,0,0,.13), 0 1.2px 3.6px rgba(0,0,0,.11)',
        'gold':  '0 0 40px rgba(200,168,106,0.18)',
        'gold-lg':'0 0 80px rgba(200,168,106,0.25)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 20px rgba(200,168,106,0.15), 0 0 60px rgba(200,168,106,0.05)' },
          '50%':     { boxShadow: '0 0 40px rgba(200,168,106,0.3),  0 0 100px rgba(200,168,106,0.1)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
