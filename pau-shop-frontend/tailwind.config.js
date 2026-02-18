/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",   // purple
        neutralBg: "#F3F4F6",
        neutralDark: "#1F2937"
      }
    }
  },
  plugins: [],
}
