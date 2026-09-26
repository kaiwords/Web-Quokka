/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#2E1D13',
          brown: '#422B1C',
          brownLight: '#5A3B27',
          sage: '#3A5A40',
          sageLight: '#8B9E7D',
          sagePale: '#E3EBE5',
          gold: '#B8863B',
          cream: '#FAF8F5',
          cream2: '#F4F0EA',
          border: '#E2DED7',
          charcoal: '#241A13',
          muted: '#6B635C',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(46, 29, 19, 0.06)',
        lift: '0 20px 40px rgba(46, 29, 19, 0.14)',
        card: '0 1px 2px rgba(46, 29, 19, 0.04), 0 12px 28px rgba(46, 29, 19, 0.08)',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
}
