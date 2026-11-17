/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        // Tema gótico. slate cálido: text-slate-* lee como hueso y ceniza
        slate: { 100: '#ECE6D8', 200: '#E0D9CA', 300: '#C9C1B2', 400: '#A39C90', 500: '#857E73', 600: '#5F5950', 700: '#4A4540', 800: '#2A2622', 900: '#1F1C19', 950: '#0F0D0B' },
        chess: {
          bg: '#0F0D0B',           // hollín
          surface: '#1F1C19',      // piedra
          card: '#1A1815',
          hover: '#2A2622',
          border: '#4A4540',       // plomo
          borderLight: '#6B655D',
          primary: '#ECE6D8',      // hueso (texto oscuro encima)
          primaryHover: '#C2A061',
          gold: '#C2A061',         // oro viejo
          goldHover: '#ECE6D8',
          violet: '#8E877C',
          squareLight: '#D8D0BF',
          squareDark: '#3A3530',
          squareSelected: 'rgba(194, 160, 97, 0.55)',
          squareLastMove: 'rgba(194, 160, 97, 0.42)',
          squareCheck: 'rgba(184, 74, 62, 0.75)',
        }
      },
      fontFamily: {
        sans: ['"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"EB Garamond"', 'Georgia', 'serif'],
        display: ['UnifrakturMaguntia', 'serif'],
        gothic: ['UnifrakturMaguntia', 'serif'],
      },
      boxShadow: {
        'chess': 'none',
        'board': 'none',
        'glow': '0 0 0 1px rgba(194, 160, 97, 0.6)',
        'glow-gold': '0 0 0 1px rgba(194, 160, 97, 0.8)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
