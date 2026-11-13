/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Sophisticated Emerald & Deep Slate palette (bespoke real estate / finance feel)
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // Main brand primary
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'soft': '0 2px 6px -1px rgba(0, 0, 0, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 6px 16px -2px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -3px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
    },
  },
  plugins: [],
}

