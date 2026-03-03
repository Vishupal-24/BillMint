// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       // 1. This matches your Google Font import
//       fontFamily: {
//         sans: ['"Plus Jakarta Sans"', 'sans-serif'],
//       },
//       // 2. These match the hex codes you defined in the HTML script tag
//       colors: {
//         primary: '#10B981',      // Emerald-500
//         primaryDark: '#059669',  // Emerald-600
//         secondary: '#0F172A',    // Slate-900 (Navy)
//         lightbg: '#F8FAFC',      // Slate-50
//         neutral: '#475569',      // Slate-600
//       }
//     },
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // 1. Your Custom Fonts
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      // 2. Your Custom Colors
      colors: {
        primary: '#10B981',      // Emerald-500
        primaryDark: '#059669',  // Emerald-600
        secondary: '#0F172A',    // Slate-900 (Navy)
        lightbg: '#F8FAFC',      // Slate-50
        neutral: '#475569',      // Slate-600
        // Premium Dark Mode Color System (Linear/Vercel/GitHub Dark inspired)
        dark: {
          // Background layers (darkest to lightest)
          bg: '#09090b',              // Primary background (near-black with blue tint)
          'bg-elevated': '#0c0c0e',   // Slightly elevated
          card: '#141416',            // Card/panel background
          surface: '#1a1a1e',         // Interactive surface
          'surface-hover': '#222226', // Surface hover state
          
          // Borders & Dividers
          border: '#27272a',          // Primary border
          'border-subtle': '#1f1f23', // Subtle dividers
          'border-hover': '#3f3f46',  // Border on hover
          
          // Text colors (high contrast for readability)
          text: {
            primary: '#fafafa',       // Primary text (near-white)
            secondary: '#a1a1aa',     // Secondary text
            muted: '#71717a',         // Muted/disabled text
            placeholder: '#52525b',   // Placeholder text
          },
          
          // Interactive states
          hover: '#27272a',           // General hover
          active: '#2d2d32',          // Active/pressed state
          focus: '#10b981',           // Focus ring color
          
          // Accent colors
          accent: '#10b981',          // Primary accent (emerald)
          'accent-hover': '#0d9668',  // Accent hover
          'accent-muted': '#10b98120',// Accent with opacity
          
          // Semantic colors for dark mode
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          info: '#3b82f6',
        }
      },
      // 3. New Animations (For Infinite Scroll & Blobs & Theme)
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        scroll: 'scroll 30s linear infinite',
        blob: "blob 7s infinite",
        shimmer: 'shimmer 2s infinite',
        glow: 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      // Dark mode transitions
      transitionProperty: {
        'theme': 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      },
    },
  },
  plugins: [],
}