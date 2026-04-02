import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ScaleSynq brand palette (dark navy + teal/cyan)
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4", // primary cyan
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        accent: {
          cyan: "#22d3ee",
          teal: "#14b8a6",
          blue: "#0ea5e9",
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
        },
        surface: {
          50: "#f8fafc",
          100: "#071526",  // main bg
          200: "#081a2d",  // sidebar bg
          300: "#0b2036",  // card bg
          400: "#0f2842",  // card hover
          500: "#153353",  // border
          600: "#1a3d64",  // elevated
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #22d3ee 0%, #06b6d4 45%, #0ea5e9 100%)",
        "gradient-card": "linear-gradient(145deg, #0b2036 0%, #081a2d 100%)",
        "gradient-glow": "radial-gradient(ellipse at top, rgba(34,211,238,0.14) 0%, transparent 60%)",
      },
      boxShadow: {
        "glow-brand": "0 0 20px rgba(34,211,238,0.28)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.28)",
        "card": "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
