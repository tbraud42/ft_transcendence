export default {
    darkMode: 'class',
    content: ['./src/**/*.{html,ts}'],
    theme: {
        extend: {
            animation: {
                fade: 'fade 0.3s ease-in-out',
            },
            keyframes: {
                fade: {
                    '0%': { opacity: 0 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0 },
                },
            },
        },
    },
    plugins: [],
}
