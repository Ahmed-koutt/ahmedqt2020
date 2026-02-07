/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        agri: {
          green: "#16a34a",
          soft: "#f0fdf4",
          teal: "#0f766e",
          earth: "#92400e"
        }
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"]
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out"
      }
    }
  },
  plugins: []
};
