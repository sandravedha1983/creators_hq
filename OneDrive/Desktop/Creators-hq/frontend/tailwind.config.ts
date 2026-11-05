/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#A78BFA",
                "primary-light": "#C4B5FD",
                secondary: "#F0A6CA",
                accent: "#F472B6",
                dark: "#050407",
                "dark-navy": "#121016",
                "deep-blue": "#19151F",
                "heaven-text": "#F8FAFC",
                "heaven-muted": "#C4B8CC",
                "heaven-dark": "#E2E8F0", // Lighter for visibility in dark theme
                "heaven-bg": "#050407",
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
                '4xl': '3.25rem',
            },
            boxShadow: {
                'premium': '0 10px 40px -15px rgba(0, 0, 0, 0.5)',
                'soft-glow': '0 0 20px rgba(167, 139, 250, 0.2)',
                'soft-blue': '0 0 20px rgba(240, 166, 202, 0.1)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            },
        },
    },
    plugins: [],
}
