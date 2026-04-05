/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: '#0a0e27', // Main background
          secondary: '#1a1f3a', // Secondary background (lighter)
          card: '#0f1425', // Card background
        },
        primary: {
          DEFAULT: '#22d3ee', // cyan-400 (Brighter for dark mode)
          hover: '#06b6d4',   // cyan-500
          dim: 'rgba(34, 211, 238, 0.1)', // cyan-400/10
        },
        secondary: {
          DEFAULT: '#a855f7', // purple-500
          hover: '#9333ea',   // purple-600
        },
        surface: {
          DEFAULT: '#1e293b', // slate-800
          hover: '#334155',   // slate-700
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(to bottom right, #0a0e27, #0f1535, #1a2040)',
      }
    },
  },
  plugins: [],
}
