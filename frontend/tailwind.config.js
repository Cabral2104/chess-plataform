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
        chess: {
          bg: '#0a0d18',
          surface: '#141830',
          card: '#10142a',
          hover: '#1b2040',
          border: '#232a4a',
          borderLight: '#38406a',
          primary: '#2bb5a0',
          primaryHover: '#45d4be',
          gold: '#f4b942',
          goldHover: '#ffd06b',
          violet: '#8b7cf6',
          squareLight: '#e4efe9',
          squareDark: '#2bb5a0',
          squareSelected: 'rgba(247, 201, 72, 0.65)',
          squareLastMove: 'rgba(247, 209, 84, 0.55)',
          squareCheck: 'rgba(239, 68, 68, 0.75)',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Bricolage Grotesque', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'chess': '0 8px 30px -6px rgba(3, 5, 18, 0.7)',
        'board': '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 60px -20px rgba(43, 181, 160, 0.35)',
        'glow': '0 0 24px -4px rgba(43, 181, 160, 0.55)',
        'glow-gold': '0 0 24px -4px rgba(244, 185, 66, 0.5)',
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
