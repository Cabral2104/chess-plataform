/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          bg: '#161512',           // Fondo oscuro cálido profesional (estilo torneo internacional)
          surface: '#262421',      // Paneles y superficies elevadas
          card: '#21201d',         // Tarjetas y modales
          hover: '#302e2b',        // Estados hover sobrios
          border: '#363431',       // Bordes sutiles y elegantes
          borderLight: '#4a4742',  // Bordes activos
          primary: '#81b64c',      // Verde clásico de ajedrez para acciones principales
          primaryHover: '#98c862', // Hover del verde ajedrez
          gold: '#c5a059',         // Oro envejecido/latón para Elo, trofeos y rangos
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
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'chess': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'board': '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
