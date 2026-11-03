/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        steam: {
          '0%': { opacity: '0', transform: 'translateY(4px) scaleY(0.6)' },
          '40%': { opacity: '0.8' },
          '100%': { opacity: '0', transform: 'translateY(-16px) scaleY(1.2)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pop-in': 'pop-in 0.2s ease-out both',
        steam: 'steam 2.4s ease-in-out infinite',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
        secondary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: '#FFE4D3',
          200: '#FFC4A3',
          300: '#FF9B66',
          400: '#FF7A38',
          500: '#FF5A1F',
          600: '#E8470C',
          700: '#BD3609',
          800: '#8F2A08',
          900: '#5E1C05',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#16A34A',
          700: '#15803D',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          700: '#B45309',
        },
        error: {
          50: 'rgb(var(--error-50) / <alpha-value>)',
          100: '#FEE2E2',
          500: '#DC2626',
          700: 'rgb(var(--error-700) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
