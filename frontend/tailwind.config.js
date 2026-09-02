/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1F2E22',
          light: '#2D4232',
          dark: '#142017',
        },
        paper: {
          DEFAULT: '#F8F6F0',
          card: '#FFFFFF',
          subtle: '#F1EFE8',
        },
        gold: {
          DEFAULT: '#C98A2E',
          light: '#E8B466',
          dark: '#A56F20',
          subtle: '#FFF8EB',
        },
        sage: {
          DEFAULT: '#7A8B6F',
          light: '#9CB090',
          subtle: '#EDF3EB',
        },
        rust: {
          DEFAULT: '#B4483A',
          subtle: '#FDF2F0',
        },
        emerald: {
          DEFAULT: '#2E7D32',
          subtle: '#E8F5E9',
        },
      },
      fontFamily: {
        serif: ['Roboto Slab', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(201, 138, 46, 0.35)',
        card: '0 4px 20px -2px rgba(31, 46, 34, 0.08)',
        'card-hover': '0 12px 32px -4px rgba(31, 46, 34, 0.16)',
      },
    },
  },
  plugins: [],
};
