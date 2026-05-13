/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1c1c1e",
          50: "#f2f2f7",
          200: "#ebebf5",
          300: "#8e8e93",
          600: "#3a3a3c",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.72)",
          dark: "rgba(28, 28, 30, 0.85)",
          card: "rgba(255, 255, 255, 0.4)",
          "card-dark": "rgba(255, 255, 255, 0.05)",
        },
      },
      fontFamily: {
        system: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
