/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Refined, slightly desaturated accent — reads as "modern minimal"
          // rather than the loud stock #FF5722.
          orange: "#EA580C",
          "orange-hover": "#C2410C",
          "orange-light": "#FFF1E8",
          // Deep neutral ink instead of a purple-tinted navy — pairs cleanly
          // with plain white/slate surfaces.
          navy: "#0F172A",
          "navy-light": "#1E293B",
          bg: "#F8FAFC",
        },
        // Liquid Glass atmosphere scale — used for the fixed atmospheric
        // background and dark-glass chrome (Navbar/Footer/Modal backdrop).
        // Kept deliberately separate from `brand.navy`, which stays the
        // text-color token used everywhere else, so migrating pages one at
        // a time never requires touching text-color classes.
        ink: {
          950: "#05070C",
          900: "#0B0F1A",
          800: "#121826",
          700: "#1B2333",
        },
      },
      borderRadius: {
        card: "16px",
        glass: "24px",
        "glass-lg": "32px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        soft: "0 2px 10px -2px rgb(15 23 42 / 0.08)",
        panel: "0 12px 32px -12px rgb(15 23 42 / 0.18)",
        // Liquid Glass tiers — soft, directional, with a faint inset top
        // highlight so glass surfaces read as "lit from above" rather than
        // just blurred+translucent.
        "glass-sm": "0 1px 1px 0 rgb(255 255 255 / 0.5) inset, 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        glass: "0 1px 1px 0 rgb(255 255 255 / 0.6) inset, 0 8px 30px -10px rgb(15 23 42 / 0.18)",
        "glass-lg": "0 1px 1px 0 rgb(255 255 255 / 0.15) inset, 0 24px 64px -18px rgb(5 7 12 / 0.55)",
        // Reserved for primary CTAs / live-status indicators only — keeping
        // glow scarce is what makes it read as premium instead of gamey.
        "glow-brand": "0 0 0 1px rgb(234 88 12 / 0.35), 0 10px 28px -6px rgb(234 88 12 / 0.45)",
        "glow-emerald": "0 0 0 1px rgb(16 185 129 / 0.3), 0 8px 24px -6px rgb(16 185 129 / 0.35)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUpIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        softPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "scale-up": "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-short": "slideUpIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "soft-pulse": "softPulse 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
