/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        defence: {
          950: '#060911',
          900: '#0a0e1a',
          850: '#0e1526',
          800: '#141e33',
          700: '#1e2b48',
          600: '#2b3d63',
          gold: '#d4af37',
          'gold-light': '#fef08a',
          'gold-bright': '#fbbf24',
          'gold-dark': '#b45309',
          silver: '#e2e8f0',
          'silver-bright': '#f8fafc',
          'silver-dark': '#94a3b8',
          saffron: '#ff9933',
          navy: '#0f172a',
          ashokaNavy: '#000080',
          indiaGreen: '#138808',
          accent: '#f59e0b',
          cyan: '#06b6d4',
          radar: '#10b981',
          warning: '#f59e0b',
          critical: '#ef4444',
          quarantine: '#dc2626',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
