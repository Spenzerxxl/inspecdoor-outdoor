/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      // 🔧 TABLET-OPTIMIERUNGEN
      spacing: {
        'touch-44': '44px',  // Apple Guidelines: Min. 44px Touch-Targets
        'touch-48': '48px',  // Android Guidelines: Min. 48px
        'finger-gap': '8px', // Spacing zwischen Touch-Targets
      },
      fontSize: {
        'touch-sm': ['16px', '24px'],  // Tablet-lesbare Schriftgröße
        'touch-base': ['18px', '28px'],
        'touch-lg': ['20px', '32px'],
      },
      screens: {
        'tablet-p': '768px',   // Tablet Portrait
        'tablet-l': '1024px',  // Tablet Landscape
        'touch': { 'raw': '(pointer: coarse)' }, // Touch-Geräte
      }
    },
  },
  plugins: [],
}
