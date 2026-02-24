/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. This matches your Google Font import
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      // 2. These match the hex codes you defined in the HTML script tag
      colors: {
        primary: '#10B981',      // Emerald-500
        primaryDark: '#059669',  // Emerald-600
        secondary: '#0F172A',    // Slate-900 (Navy)
        lightbg: '#F8FAFC',      // Slate-50
        neutral: '#475569',      // Slate-600
      }
    },
  },
  plugins: [],
}