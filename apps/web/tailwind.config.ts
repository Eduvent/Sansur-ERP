import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F1410',
          900: '#0F1410',
          700: '#2A2F2A',
          500: '#5C625C',
          300: '#9CA29C',
        },
        paper: {
          DEFAULT: '#F6F2E7',
          50: '#FBF8F0',
          100: '#F6F2E7',
          200: '#EDE6D2',
          300: '#DDD3B6',
        },
        cobalt: {
          DEFAULT: '#1F3A52',
          50: '#E8EEF3',
          400: '#3B5A78',
          600: '#19304A',
        },
        ember: {
          DEFAULT: '#C84A1F',
          50: '#FBEBE3',
          400: '#D55F36',
          600: '#A53A12',
        },
        moss: {
          DEFAULT: '#5A6B4E',
          50: '#EEF1EA',
          400: '#71855F',
          600: '#42513A',
        },
        brand: {
          DEFAULT: '#C84A1F',
          dark: '#A53A12',
          light: '#FBEBE3',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      boxShadow: {
        paper: '0 1px 0 rgba(15, 20, 16, 0.06), 0 8px 24px -16px rgba(15, 20, 16, 0.18)',
        inset: 'inset 0 0 0 1px rgba(15, 20, 16, 0.08)',
      },
      keyframes: {
        spinSlow: {
          to: { transform: 'rotate(360deg)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
      },
      animation: {
        'spin-slow': 'spinSlow 7s linear infinite',
        'rise-in': 'riseIn 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        ticker: 'ticker 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
