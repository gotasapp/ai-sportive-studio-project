import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['-apple-system', '"Atyp Text"', 'sans-serif'],
        'system': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        'display': ['"Atyp Display"', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Tons de cinza minimalistas
        'gray-light': '#ADADAD',
        'gray-medium': '#707070', 
        'gray-dark': '#333333',
        
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // Cores para gráficos minimalistas
        chart: {
          '1': '#510019', // Chart primary - vermelho escuro
          '2': '#ADADAD', // Chart secondary - cinza claro
          '3': '#707070', // Chart tertiary - cinza médio
          '4': '#333333', // Chart quaternary - cinza escuro
          '5': '#A20131', // Chart quinternary - vermelho principal
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      animation: {
        'scanline': 'scanline 3s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      backgroundImage: {
        'cyber-gradient': 'var(--cyber-gradient)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }: any) {
      addUtilities({
        '.heading-style': {
          fontFamily: '"Atyp Display", sans-serif',
          fontWeight: '500',
          fontSize: '0.875rem', // Reduzido de 14px para 14px mas com line-height menor
          lineHeight: '1.5rem', // Reduzido de 40px para 24px
          color: '#FDFDFD', // Mudado para branco para ser mais minimalista
          fontStyle: 'normal',
        },
        '.text-responsive': {
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          '@media (min-width: 768px)': {
            fontSize: '1rem',
            lineHeight: '1.5rem',
          },
        },
      });
    }
  ],
};

export default config; 