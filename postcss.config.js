import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// v2.17.34 — Explicit config path so Tailwind's auto-discovery doesn't
// fail when the project lives at a path with spaces (some checkout
// Documents). Without this, Tailwind walks up looking for the config
// from process.cwd() and skips it when cwd resolution is unexpected.
export default {
  plugins: {
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
