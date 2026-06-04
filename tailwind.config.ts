import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#FAF0F1",
          ink: "#161316",
          muted: "#6E6269",
          line: "#E8DDE1",
          accent: "#B5212F"
        }
      },
      fontFamily: {
        sans: ["var(--font-lato)", "Lato", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 36px rgba(36, 24, 30, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
