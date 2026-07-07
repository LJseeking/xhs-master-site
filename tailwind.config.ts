import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#f7f5ef",
        sage: "#64786a",
        coral: "#d96c56",
        teal: "#2b7a78",
        plum: "#5f4b66"
      },
      boxShadow: {
        panel: "0 16px 45px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
