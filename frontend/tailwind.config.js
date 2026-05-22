/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:     '#0a0a0f',
        surface: '#13131e',
        s2:      '#1a1a28',
        s3:      '#21213a',
        accent:  '#7c5cfc',
        teal:    '#00d4aa',
        warn:    '#ff7a45',
        danger:  '#ff4757',
        muted:   '#9898b0',
        dim:     '#5a5a72',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
