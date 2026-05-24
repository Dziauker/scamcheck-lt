/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0d1117',
          900: '#0d1b2a',
          800: '#1a2d42',
        },
        brand: '#1d4ed8',
        paper: '#f0efe9',
        risk: {
          low:     '#059669',
          'low-bg':    '#d1fae5',
          'low-border':'#6ee7b7',
          'low-text':  '#065f46',
          mid:     '#d97706',
          'mid-bg':    '#fef3c7',
          'mid-border':'#fcd34d',
          'mid-text':  '#92400e',
          high:    '#ea580c',
          'high-bg':   '#ffedd5',
          'high-border':'#fb923c',
          'high-text': '#9a3412',
          crit:    '#dc2626',
          'crit-bg':   '#fee2e2',
          'crit-border':'#f87171',
          'crit-text': '#991b1b',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.35s ease-out',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(220, 38, 38, 0)' },
        },
      },
    },
  },
  plugins: [],
}
