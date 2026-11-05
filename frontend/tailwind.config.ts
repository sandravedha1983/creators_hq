/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#8B5CF6",
                "primary-light": "#A78BFA",
                secondary: "#38BDF8",
                accent: "#F472B6",
                dark: "#0B0F1A",
                "dark-navy": "#111827",
                "deep-blue": "#0F172A",
                "heaven-text": "#F8FAFC",
                "heaven-muted": "#94A3B8",
                "heaven-dark": "#E2E8F0", // Lighter for visibility in dark theme
                "heaven-bg": "#050810", // Dark background
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
                '4xl': '3.25rem',
            },
            boxShadow: {
                'premium': '0 10px 40px -15px rgba(0, 0, 0, 0.5)',
                'soft-glow': '0 0 20px rgba(139, 92, 246, 0.2)',
                'soft-blue': '0 0 20px rgba(56, 189, 248, 0.1)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            },
            backgroundImage: {
                'heavenly-gradient': 'linear-gradient(135deg, #0B0F1A 0%, #111827 50%, #0F172A 100%)',
                'button-gradient': 'linear-gradient(135deg, #8B5CF6, #38BDF8)',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
                'light-heavenly': 'linear-gradient(135deg, #0B0F1A 0%, #111827 50%, #1E293B 100%)',
            }
        },
    },
    plugins: [],
}
