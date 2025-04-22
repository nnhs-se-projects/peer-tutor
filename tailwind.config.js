/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs'],
  theme: {
    extend: {
      colors: {
        primary: {
          orange: '#FF6B35',
          blue: '#1A73E8',
          light: '#F8F9FA',
          dark: '#202124',
        },
      },
    },
  },
  plugins: [],
};
