export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        secondary: {
          50: "#f0fdf4",
          500: "#10b981",
          600: "#059669",
        },
      },
    },
  },
  plugins: [],
}
