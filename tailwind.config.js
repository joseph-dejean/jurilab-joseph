/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          light: '#F56565', // Un rouge clair pour le mode sombre
          DEFAULT: '#9B2C2C', // Un rouge bordeaux profond pour le mode clair
          dark: '#742A2A',
        },
        // Nouvelle palette, plus sobre et professionnelle
        brand: {
          light: '#E0D6C8', // Un beige/crème très clair pour les fonds
          DEFAULT: '#BFA181', // L'accent principal: un bronze/or vieilli
          dark: '#5C4B3A',  // Une version foncée du bronze
        },
        navy: {
          light: '#3C4A6C',
          DEFAULT: '#1A2C4B', // Bleu nuit/marine profond pour le texte et les fonds sombres
          dark: '#0D1625',
        },
        // On garde une palette de gris neutre et efficace
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        'subtle-lg': '0 10px 20px 0 rgba(0, 0, 0, 0.05)',
        'subtle-xl': '0 20px 40px 0 rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(170deg, #0D1625 0%, #1A2C4B 100%)',
        'gradient-light': 'linear-gradient(170deg, #ffffff 0%, #f8fafc 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}

