import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0EA5E9',
          dark: '#0369A1',
          light: '#E0F2FE',
        },
      },
    },
  },
  plugins: [],
};
export default config;
