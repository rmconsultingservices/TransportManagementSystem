/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#111726',
          800: '#161F33',
          700: '#1F2C47',
        },
        brand: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        accent: {
          cyan: '#06B6D4',
          emerald: '#10B981',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 35px -5px rgba(59, 130, 246, 0.35)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.25)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
