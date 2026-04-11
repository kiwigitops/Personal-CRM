import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

import preset from "../../packages/config/tailwind-preset";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  plugins: [forms],
  presets: [preset],
  theme: {
    extend: {}
  }
};

export default config;

