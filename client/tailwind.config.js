/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'Segoe UI', 'Tahoma', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
      }
    },
  },
  plugins: [],
}
