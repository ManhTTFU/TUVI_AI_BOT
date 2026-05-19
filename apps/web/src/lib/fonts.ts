import localFont from 'next/font/local';

export const sfProDisplay = localFont({
  src: [
    { path: '../fonts/SFProDisplay-Regular.woff', weight: '400', style: 'normal' },
    { path: '../fonts/SFProDisplay-Medium.woff', weight: '500', style: 'normal' },
    { path: '../fonts/SFProDisplay-Bold.woff', weight: '700', style: 'normal' },
    { path: '../fonts/SFProDisplay-SemiboldItalic.woff', weight: '600', style: 'italic' },
  ],
  variable: '--font-sf-pro',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"SF Pro Text"',
    '"Helvetica Neue"',
    '"Segoe UI"',
    'system-ui',
    'sans-serif',
  ],
});
