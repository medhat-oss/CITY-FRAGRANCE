/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Instrument Sans', 'sans-serif'],
        body: ['var(--font-body)', 'Jost', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#16234D',
          light: '#2A3B73',
        },
        brandDark: {
          bg: '#09142E',
          card: '#11224D',
          border: '#1d3573',
        },
        sale: {
          DEFAULT: '#DC2626',
        },
        surface: {
          DEFAULT: '#ffffff',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          light: '#57534e',
          lighter: '#999999',
        },
      },
      maxWidth: {
        container: '1400px',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
        'slow-zoom': 'slowZoom 25s ease-in-out infinite alternate',
        'waft': 'waft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slowZoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.15)' },
        },
        waft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
