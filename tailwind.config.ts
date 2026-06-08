import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0D0F1A',
          mid: '#1A1D2E',
          accent: '#6C63FF',
        },
        accent: '#6C63FF',
        'text-primary': '#F0F0F5',
        'text-secondary': '#9998B0',
        'text-muted': '#5C5B72',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
