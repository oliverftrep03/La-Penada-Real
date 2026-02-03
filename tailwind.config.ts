import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "var(--primary)",
                secondary: "var(--secondary)",
                accent: "var(--accent)",
            },
            fontFamily: {
                urban: ["var(--font-urban)", "sans-serif"],
                graffiti: ["var(--font-graffiti)", "cursive"],
            },
            animation: {
                "sticker-hover": "sticker-hover 0.2s ease-in-out forwards",
            },
            keyframes: {
                "sticker-hover": {
                    "0%": { transform: "rotate(0deg) scale(1)" },
                    "50%": { transform: "rotate(-2deg) scale(1.05)" },
                    "100%": { transform: "rotate(2deg) scale(1.1)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
