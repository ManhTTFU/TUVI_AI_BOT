import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6B1D5E',
          purpleDark: '#3A0F32',
          gold: '#D4A843',
          goldLight: '#F1DFA8',
          cream: '#FDF8F0',
          ink: '#2C1729',
          mute: '#6B5B69',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -15px rgba(107, 29, 94, 0.25)',
        ring: '0 0 0 1px rgba(212, 168, 67, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
