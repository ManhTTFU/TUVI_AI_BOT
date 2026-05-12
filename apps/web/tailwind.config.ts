import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // legacy aliases (purple/purpleDark/ink) remapped to unified palette
          // so any orphan component dùng brand-purple vẫn render đúng brand
          purple: '#5a3a1a',        // đồng cổ
          purpleDark: '#0f0a08',    // mực tàu
          ink: '#0f0a08',           // mực tàu
          mute: '#4a3a30',          // mực xám
          gold: '#c89146',          // vàng đồng
          goldLight: '#e9d4b6',     // cream gradient stop
          cream: '#fbf3e2',         // cream nền
          mountain: '#4a6c7a',      // xanh núi (accent)
          vermilion: '#c8361d',     // chu sa (cảnh báo)
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -15px rgba(90, 58, 26, 0.25)',
        ring: '0 0 0 1px rgba(200, 145, 70, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
