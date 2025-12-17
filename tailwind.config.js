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
        // Primary: Refined Emerald - Sophisticated legal green
        primary: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb3',
          400: '#4ade88',
          500: '#22c563',
          600: '#16a34f',
          700: '#15803e',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Accent: Warm Gold - Luxury accent
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Surface: Warm Ivory/Cream tones
        surface: {
          50: '#fdfbf7',
          100: '#faf6ed',
          200: '#f5efe0',
          300: '#ebe2cc',
          400: '#d9cdb0',
          500: '#c7b794',
          600: '#a89770',
          700: '#8a7a5c',
          800: '#6d614a',
          900: '#584e3d',
        },
        // Deep: Rich forest/navy for text and dark elements
        deep: {
          50: '#f4f6f4',
          100: '#e3e8e4',
          200: '#c7d2ca',
          300: '#a0b3a5',
          400: '#768f7d',
          500: '#567260',
          600: '#435b4c',
          700: '#374a3f',
          800: '#2d3b33',
          900: '#1a2420',
          950: '#0d1511',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        'display-lg': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.12)',
        'glow': '0 0 40px rgba(34, 197, 99, 0.15)',
        'glow-accent': '0 0 40px rgba(234, 179, 8, 0.15)',
        'elevated': '0 20px 60px -15px rgba(0, 0, 0, 0.15)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.1)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l9.9-9.9h-2.828zM32 0l-3.486 3.485-1.414 1.414L32 0zM0 5.373l.828-.83 1.415 1.415L0 8.2V5.374zm0 5.656l.828-.829 5.657 5.657-1.414 1.414L0 11.03V11.03zm0 5.656l.828-.828 8.485 8.485-1.414 1.414L0 16.686V16.686zM0 28l.828-.828L13.657 40l-1.414 1.414L0 28zm0 5.657l.828-.828 14.142 14.142-1.414 1.414L0 33.657zm0 5.656l.828-.827 17.07 17.07-1.414 1.414L0 39.313zm0 5.657l.828-.828 19.799 19.8-1.415 1.413L0 44.97zm0 5.656l.828-.828L23.556 58.2h-2.83L0 50.626zm0 5.658l.828-.83 25.456 25.455-1.414 1.415L0 56.284V56.284zm4.343 3.97l1.414-1.414 23.385 23.386h-2.828L4.343 60.254zm5.657 0l1.414-1.414 19.8 19.8h-2.83L10 60.255zm5.656 0l1.415-1.414 16.97 16.97h-2.828l-15.557-15.556zm5.658 0l1.414-1.415 14.14 14.142h-2.827L21.314 60.254zm5.656 0l1.414-1.414 11.314 11.313h-2.828l-9.9-9.899zm5.657 0l1.414-1.414 8.485 8.485h-2.828l-7.071-7.07zm5.657 0l1.414-1.415L54.627 60H51.8L32.628 60.254zm5.656 0l1.414-1.414 2.83 2.83h-2.83l-1.414-1.416zM60 54.627l-.828.83-1.415-1.415L60 51.8v2.827zm0-5.656l-.828.829-4.243-4.243 1.414-1.414L60 48.97v.001zm0-5.657l-.828.828-7.07-7.07 1.413-1.415L60 43.314v.001zm0-5.657l-.828.828-9.9-9.9 1.415-1.413L60 37.657v.001zm0-5.657l-.828.828L46.344 26 47.76 24.586 60 32v.001zm0-5.657l-.828.829-15.557-15.557 1.414-1.414L60 26.344v-.001zm0-5.657l-.828.828L40.687 9.515l1.415-1.414L60 20.686v.001zm0-5.656l-.828.828L37.858 5.858l1.414-1.414L60 15.03V15.03zm0-5.657l-.828.83L34.03 2.03l1.414-1.415L60 9.373v.001zm0-5.657L59.172.83 37.858 22.142l-1.414-1.414L60 3.716V3.716zM0 0l28.284 28.284-1.414 1.415L0 2.827V0z\' fill=\'%2322c563\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
        'hero-pattern': 'linear-gradient(135deg, rgba(34, 197, 99, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(34, 197, 99, 0.08) 0%, transparent 50%)',
        'hero-dark': 'linear-gradient(135deg, rgba(34, 197, 99, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(34, 197, 99, 0.15) 0%, transparent 50%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-down': 'fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-left': 'fadeInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-right': 'fadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
