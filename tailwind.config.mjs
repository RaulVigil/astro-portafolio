/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Keep 'class' strategy so it doesn't default to 'media' (OS settings). Since we never add the class, it stays light.
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {},
    },
    plugins: [],
}
