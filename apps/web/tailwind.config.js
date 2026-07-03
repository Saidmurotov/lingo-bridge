module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', '../../docs/**/*.md'],
  darkMode: 'class', // enable dark mode via class
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 80%, 55%)', // vibrant blue
        secondary: 'hsl(260, 70%, 60%)', // purple
        accent: 'hsl(45, 90%, 55%)', // golden
        background: 'hsl(210, 20%, 5%)', // dark background
        surface: 'hsl(210, 20%, 10%)', // card surface
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
