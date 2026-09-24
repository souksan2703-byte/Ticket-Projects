/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Google Sans Flex', 'Lato', 'Noto Sans Lao', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
