/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      colors: {
        primary: {
          DEFAULT: '#14B8B8', // Soft Teal
          light: '#ECF6F8',   // Light Teal
          dark: '#0E8A8A',    // Darker Teal for hover
        },
        background: {
          DEFAULT: '#F7FBFD', // Off-white with light blue tint
          card: '#FFFFFF',
        },
        text: {
          main: '#0F172A',  // Soft charcoal
          muted: '#475569', // Muted dark gray
          light: '#94A3B8', // Light gray
        },
        status: {
          success: '#22C55E',
          'success-bg': '#ECFDF5',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          danger: '#EF4444',
          'danger-bg': '#FEF2F2',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(20, 184, 184, 0.08)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
};
