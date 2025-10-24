/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "brand-green": "#16a34a", // or whatever green you want
        brand: {
          primary: "#0C4E26",
          secondary: "#A91D1C",
          white: "#FFFFFF",
          light: "#ECECEC",
          gray: "#D9D9D9",
        },
      },
      boxShadow: { card: "0 2px 10px rgba(0,0,0,0.08)" },
    },
  },
  plugins: [],
};
