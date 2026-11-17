/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta gótica: slate cálido para que text-slate-* lea como hueso/ceniza
        slate: { 100: '#ECE6D8', 200: '#E0D9CA', 300: '#C9C1B2', 400: '#A39C90', 500: '#857E73', 600: '#5F5950', 700: '#4A4540', 800: '#2A2622', 900: '#1F1C19', 950: '#0F0D0B' },
        chess: {
          bg: '#0F0D0B',           // Fondo oscuro cálido profesional (estilo torneo internacional)
          surface: '#1F1C19',      // Paneles y superficies elevadas
          card: '#1A1815',         // Tarjetas y modales
          hover: '#302e2b',        // Estados hover sobrios
          border: '#4A4540',       // Bordes sutiles y elegantes
          borderLight: '#4a4742',  // Bordes activos
          primary: '#ECE6D8',      // Hueso: acciones principales (texto oscuro encima)
          primaryHover: '#C2A061', // Oro al pasar el cursor
          gold: '#C2A061',         // Oro envejecido/latón para Elo, trofeos y rangos
          goldHover: '#d4b06b',
          squareLight: '#f0d9b5',  // Casilla clara clásica (madera cálida / marfil)
          squareDark: '#b58863',   // Casilla oscura clásica (nogal torneo)
          fideLight: '#eeeed2',    // Alternativa esmeralda FIDE clara
          fideDark: '#769656',     // Alternativa esmeralda FIDE oscura
          squareSelected: 'rgba(247, 247, 105, 0.65)',
          squareLastMove: 'rgba(187, 203, 43, 0.55)',
          squareCheck: 'rgba(220, 38, 38, 0.75)',
        }
      },
      fontFamily: {
        sans: ['"EB Garamond"', 'Georgia', 'serif'],
        gothic: ['UnifrakturMaguntia', 'serif'],
        mono: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'chess': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'board': '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
