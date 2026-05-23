/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ms: {
          bg:      '#f5f5f5',
          surface: '#ffffff',
          border:  '#e0e0e0',
          blue:    '#0078d4',
          'blue-dark': '#005a9e',
          'blue-light': '#deecf9',
          navy:    '#243a5e',
          text:    '#1b1b1b',
          sub:     '#616161',
          dim:     '#767676',
          green:   '#107c10',
          'green-bg': '#dff6dd',
          orange:  '#d83b01',
          'orange-bg': '#fed9cc',
          red:     '#a80000',
          'red-bg':'#fde7e9',
          sidebar: '#f3f2f1',
          'sidebar-active': '#edebe9',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'ms': '0 1.6px 3.6px rgba(0,0,0,.13), 0 .3px .9px rgba(0,0,0,.11)',
        'ms-md': '0 3.2px 7.2px rgba(0,0,0,.13), 0 .6px 1.8px rgba(0,0,0,.11)',
        'ms-lg': '0 6.4px 14.4px rgba(0,0,0,.13), 0 1.2px 3.6px rgba(0,0,0,.11)',
      },
    },
  },
  plugins: [],
};
