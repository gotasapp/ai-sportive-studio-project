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
        'jakarta': ['Plus Jakarta Sans', 'sans-serif'],
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'], // Preservar para o logo
        'sans': ['Plus Jakarta Sans', 'sans-serif'], // Fallback
      },
              fontSize: {
          // Caption e small text
          'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],       // 12px
          'xs': ['0.8125rem', { lineHeight: '1.125rem', letterSpacing: '0.01em' }],     // 13px
          
          // Body text
          'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.005em' }],      // 14px
          'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],             // 16px
          'body-lg': ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.005em' }], // 18px
          
          // Headings
          'lg': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],       // 20px - H4
          'xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],          // 24px - H3
          '2xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],     // 30px - H2
          '3xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],      // 36px - H1
          
          // Display headings
          '4xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.03em' }],         // 48px
          '5xl': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.035em' }],        // 60px
          '6xl': ['4.5rem', { lineHeight: '4.75rem', letterSpacing: '-0.04em' }],       // 72px
        },
              fontWeight: {
          'light': '300',
          'normal': '400',
          'medium': '500',
          'semibold': '600',
          'bold': '700',
          'extrabold': '800',
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
    require("tailwindcss-animate")
  ]
};

export default config; 