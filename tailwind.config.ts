// NOTE: Tailwind v4 is installed. This file is kept for reference but is not
// read by v4. Content scanning is handled automatically by @tailwindcss/postcss.
// See app/globals.css for the v4 entrypoint (@import "tailwindcss").
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
