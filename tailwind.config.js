/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // VSCode Default Dark Modern 主题颜色
        // 这些颜色在暗色模式下使用
        'dark-bg-base': '#1E1E1E',
        'dark-bg-card': '#1E1E1E',
        'dark-bg-sidebar': '#252526',
        'dark-bg-hover': '#2A2D2D',
        'dark-bg-active': '#37373D',
        'dark-border-default': '#3C3C3C',
        'dark-border-subtle': '#2A2D2D',
        'dark-border-widget': '#454545',
        'dark-border-input': '#555555',
        'dark-text-primary': '#D4D4D4',
        'dark-text-secondary': '#9CDCFE',
        'dark-text-muted': '#858585',
      },
    },
  },
  plugins: [],
}
