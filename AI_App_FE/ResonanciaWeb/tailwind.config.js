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
        display: ['"Playfair Display"', 'Cinzel', 'serif'],
      },
      colors: {
        cosmic: {
          50: '#f0e8ff',
          100: '#d8c5ff',
          200: '#b896ff',
          300: '#9966ff',
          400: '#7a3aff',
          500: '#6213ff',
          600: '#4e0ecc',
          700: '#3b0a99',
          800: '#280666',
          900: '#150333',
        },
        stardust: {
          pink: '#ff6eb4',
          purple: '#9d4edd',
          blue: '#4cc9f0',
          gold: '#ffd700',
        }
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #0a0015 0%, #1a0030 50%, #0d0020 100%)',
        'aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px rgba(157, 78, 221, 0.5)' },
          'to': { boxShadow: '0 0 30px rgba(157, 78, 221, 0.9), 0 0 60px rgba(255, 110, 180, 0.4)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
