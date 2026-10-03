/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#fafaf9",
        navy: {
          900: "#090d16",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155",
          500: "#475569",
        },
        academic: {
          accent: "#4f46e5",
          accentHover: "#4338ca",
          light: "#eef2ff",
          border: "#e2e8f0",
          paper: "#ffffff",
          parchment: "#fbfbfa",
        }
      },
      fontFamily: {
        serif: ["Merriweather", "Georgia", "Cambria", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        elevation: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
