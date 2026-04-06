/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          bg: '#F8F9FA',
          primary: '#2A9D8F',
          text: '#2D3436',
        },
      },
      boxShadow: {
        card: '0 10px 30px rgba(42, 157, 143, 0.08)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        heading: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
