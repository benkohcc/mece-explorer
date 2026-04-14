import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#141413',
          light: '#faf9f5',
          surface: '#fffefa',
          'surface-alt': '#f7f5ee',
          'surface-hover': '#f3f0e8',
          'mid-gray': '#b0aea5',
          'light-gray': '#e8e6dc',
          orange: '#d97757',
          'orange-hover': '#c4634a',
          'orange-light': '#fef2ee',
          blue: '#6a9bcc',
          green: '#788c5d',
          purple: '#b07cc6',
          gold: '#d4a259',
          teal: '#6aadad',
          border: '#e0ddd3',
          'border-strong': '#ccc9be',
          'text-primary': '#1a1a19',
          'text-secondary': '#5a584f',
          'text-muted': '#8a877d',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'Arial', 'sans-serif'],
        lora: ['var(--font-lora)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
