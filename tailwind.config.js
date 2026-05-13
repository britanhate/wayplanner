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
      fontSize: {
        display: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        title: ["20px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "20px", fontWeight: "500" }],
        small: ["13px", { lineHeight: "18px", fontWeight: "400" }],
      },
      borderRadius: {
        "apple-sm": "10px",
        apple: "12px",
        "apple-lg": "16px",
        "apple-xl": "20px",
        "apple-2xl": "24px",
      },
      boxShadow: {
        "apple-sm": "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
        apple: "0 2px 8px rgba(0, 0, 0, 0.12)",
        "apple-lg": "0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06)",
        "apple-xl": "0 20px 40px rgba(0, 0, 0, 0.15)",
      },
      backdropBlur: {
        apple: "20px",
        "apple-xl": "40px",
      },
      spacing: {
        glass: "8px",
        panel: "16px",
        section: "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
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
