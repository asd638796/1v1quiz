/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0' },
          '14.28%': { opacity: '1' },   // Fade in over 1s
          '85.71%': { opacity: '1' },   // Stay visible for 5s
          '100%': { opacity: '0' },     // Fade out over 1s
        },
      },
      animation: {
        fadeInOut: 'fadeInOut 7s forwards',
      },
    },
  },
  plugins: [],
}
