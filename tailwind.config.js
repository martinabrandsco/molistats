/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'masters-green': '#0F5132',
        'masters-yellow': '#FFD700',
        'masters-light-green': '#1A5F3A',
        'masters-dark-green': '#0A3D1F',
        'masters-cream': '#F5F5DC',
        'masters-gold': '#DAA520',
      },
      fontFamily: {
        'serif': ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
} 