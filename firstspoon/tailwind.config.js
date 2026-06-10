/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
          50: '#F5F3FF',
          100: '#EDE9FE',
        }
      }
    },
  },
  plugins: [],
}
