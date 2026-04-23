import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0A0F1C',
        parchment: '#F5F0E8',
        basalt: '#2D4A3E',
        foam: '#C8D8C0',
        gold: '#B8966E',
        'gold-light': '#D4AF8A',
        'midnight-80': 'rgba(10, 15, 28, 0.8)',
        'midnight-60': 'rgba(10, 15, 28, 0.6)',
        'parchment-60': 'rgba(245, 240, 232, 0.6)',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'Georgia', 'serif'],
        dm: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.75rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.15' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '90rem',
        '9xl': '100rem',
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '16/9': '16 / 9',
        '3/4': '3 / 4',
        '21/9': '21 / 9',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-editorial': 'linear-gradient(135deg, #0A0F1C 0%, #2D4A3E 100%)',
      },
      animation: {
        'scroll-indicator': 'scrollIndicator 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'count-up': 'countUp 2s ease-out forwards',
      },
      keyframes: {
        scrollIndicator: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { transform: 'translateY(8px)', opacity: '0.5' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(10, 15, 28, 0.12)',
        'card-hover': '0 16px 48px rgba(10, 15, 28, 0.24)',
        'gold': '0 0 30px rgba(184, 150, 110, 0.3)',
        'editorial': '0 8px 32px rgba(10, 15, 28, 0.16)',
      },
      screens: {
        'xs': '375px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}

export default config
