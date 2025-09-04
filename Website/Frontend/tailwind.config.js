/** @type {import('tailwindcss').Config} */
export const content = [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
]
export const darkMode = 'class'
export const theme = {
    extend: {
        // Custom animations
        keyframes: {
            slideUp: {
                '0%': {
                    opacity: '0',
                    transform: 'translateY(30px)',
                },
                '100%': {
                    opacity: '1',
                    transform: 'translateY(0)',
                },
            },
            fadeIn: {
                '0%': {
                    opacity: '0',
                },
                '100%': {
                    opacity: '1',
                },
            },
            float: {
                '0%, 100%': {
                    transform: 'translateY(0px)',
                },
                '50%': {
                    transform: 'translateY(-10px)',
                },
            },
        },
        animation: {
            'slide-up': 'slideUp 0.6s ease-out',
            'fade-in': 'fadeIn 0.5s ease-out',
            'float': 'float 3s ease-in-out infinite',
        },
        // Custom backdrop blur
        backdropBlur: {
            xs: '2px',
        },
        // Custom colors (optional - using default Tailwind colors)
        colors: {
            // You can add custom SWAGGO brand colors here if needed
            'swaggo-red': '#e74c3c',
            'swaggo-blue': '#3498db',
        },
        // Custom shadows
        boxShadow: {
            'glow-red': '0 0 20px rgba(231, 76, 60, 0.3)',
            'glow-blue': '0 0 20px rgba(52, 152, 219, 0.3)',
        },
    },
}
export const plugins = [
    // Add any additional Tailwind plugins here
    // require('@tailwindcss/forms'), // For better form styling (optional)
]

