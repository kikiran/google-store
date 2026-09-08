/** @type {import('tailwindcss').Config} */
export default {
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#E8F0FE',
          100: '#D0E1FC',
          200: '#A1C3F9',
          300: '#72A5F5',
          400: '#4387F2',
          500: '#2962FF',
          600: '#1A56DB',
          700: '#1247B3',
          800: '#0B398A',
          900: '#062B62',
          950: '#031A3D',
        },
        accent: {
          50: '#E6F7F5',
          100: '#CCEFE9',
          200: '#99DFD3',
          300: '#66CFBD',
          400: '#33C0A7',
          500: '#0ABF96',
          600: '#089B7A',
          700: '#06775E',
          800: '#045342',
          900: '#022F26',
          950: '#011A16',
        },
        ink: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
          950: '#111315',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
