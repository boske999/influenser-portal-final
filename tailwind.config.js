/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        inputBg: "rgba(255, 255, 255, 0.04)",
        textPrimary: "#FFFFFF",
        textSecondary: "#D1D1D1",
        textTertiary: "#999999",
        buttonText: "#100E0D",
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
} 