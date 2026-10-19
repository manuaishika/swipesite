/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#215E61',
          dark: '#233D4D',
          light: '#2d7a7e',
          50: '#f0f9f9',
          100: '#d4eeef',
          200: '#aadde0',
          300: '#7cc4c8',
          400: '#4fa5aa',
          500: '#215E61',
          600: '#1a4c4e',
          700: '#14393b',
          800: '#0e2628',
          900: '#081315',
        },
        accent: {
          DEFAULT: '#233D4D',
          light: '#2f5161',
          dark: '#1a2e39',
        },
      },
      animation: {
        'slide-left': 'slide-left 30s linear infinite',
        'fade-in': 'fade-in 0.5s ease-in',
      },
      keyframes: {
        'slide-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
