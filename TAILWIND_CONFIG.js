// tailwind.config.js
// Add this file to the project root for custom color tokens

export default {
  theme: {
    extend: {
      colors: {
        // Light mode base
        bg: {
          primary: '#F8F9FA',
          secondary: '#FFFFFF',
        },
        // Dark mode base (override via CSS variables in index.css)
        // Custom tints
        'blue-primary': '#3B82F6',
        'teal-primary': '#14B8A6',
        'purple-primary': '#8B5CF6',
      },
      // Shadow enhancements for cards
      boxShadow: {
        'card-hover': '0 10px 20px rgba(0, 0, 0, 0.1)',
        'card-dark': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'fab': '0 8px 24px rgba(59, 130, 246, 0.4)',
      },
      // Animation utilities
      animation: {
        'checkbox-pulse': 'pulse 0.3s ease-out',
        'fab-pulse': 'pulse 2s ease-in-out infinite',
      },
      transitionDuration: {
        '180': '180ms',
        '250': '250ms',
      },
      borderRadius: {
        'card': '12px',
        'xl-card': '16px',
      },
    },
  },
  plugins: [],
}
