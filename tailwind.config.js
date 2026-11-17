/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { 500: '#1e3a8a', 700: '#1e40af', 900: '#172554' },
        safe: '#22c55e',
        lost: '#ef4444',
      }
    },
  },
  plugins: [],
}