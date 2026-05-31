/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Admin colours (CSS variables) ──────────────── */
        ms: {
          bg:           'rgb(var(--ms-bg) / <alpha-value>)',
          surface:      'rgb(var(--ms-surface) / <alpha-value>)',
          border:       'rgb(var(--ms-border) / <alpha-value>)',
          blue:         'rgb(var(--ms-primary) / <alpha-value>)',
          'blue-dark':  'rgb(var(--ms-primary-dark) / <alpha-value>)',
          'blue-light': 'rgb(var(--ms-primary) / 0.12)',
          navy:         'rgb(var(--ms-navy) / <alpha-value>)',
          text:         'rgb(var(--ms-text) / <alpha-value>)',
          sub:          'rgb(var(--ms-text) / 0.55)',
          dim:          'rgb(var(--ms-text) / 0.35)',
          green:        'rgb(var(--ms-green) / <alpha-value>)',
          'green-bg':   'rgb(var(--ms-green) / 0.12)',
          orange:       'rgb(var(--ms-orange) / <alpha-value>)',
          'orange-bg':  'rgb(var(--ms-orange) / 0.12)',
          red:          'rgb(var(--ms-red) / <alpha-value>)',
          'red-bg':     'rgb(var(--ms-red) / 0.12)',
          sidebar:      'rgb(var(--ms-sidebar) / <alpha-value>)',
          'sidebar-active': 'rgb(var(--ms-primary) / 0.1)',
        },
        /* ── Landing + Admin themed colours (CSS variables) ─ */
        background: 'rgb(var(--bg) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        card:       { DEFAULT: 'rgb(var(--card) / <alpha-value>)', foreground: 'rgb(var(--fg) / <alpha-value>)' },
        primary:    { DEFAULT: 'rgb(var(--primary) / <alpha-value>)', foreground: 'rgb(var(--primary-fg) / <alpha-value>)' },
        secondary:  { DEFAULT: 'rgb(var(--secondary) / <alpha-value>)', foreground: 'rgb(var(--fg) / <alpha-value>)' },
        muted:      { DEFAULT: 'rgb(var(--muted) / <alpha-value>)', foreground: 'rgb(var(--muted-fg) / <alpha-value>)' },
        border:     'rgb(var(--border) / <alpha-value>)',
        input:      'rgb(var(--border) / <alpha-value>)',
        ring:       'rgb(var(--primary) / <alpha-value>)',
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
