import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  // Absolute, runtime-resolved paths so glob matching works regardless of
  // where the project is checked out (including paths containing spaces).
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        // PRD §15.1 design tokens — all via CSS custom properties
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        canvas: 'var(--canvas)',
        'canvas-alt': 'var(--canvas-alt)',
        'border-dark': 'var(--border-dark)',
        'border-light': 'var(--border-light)',
        interactive: 'var(--interactive)',
        'interactive-hover': 'var(--interactive-hover)',
        'interactive-pressed': 'var(--interactive-pressed)',
        'interactive-muted': 'var(--interactive-muted)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-body': 'var(--text-body)',
        'text-muted': 'var(--text-muted)',
        // PRD §15.2 node state colors
        'node-deployable': 'var(--node-deployable)',
        'node-reserved': 'var(--node-reserved)',
        'node-partial': 'var(--node-partial)',
        'node-full-mem': 'var(--node-full-mem)',
        'node-full-cpu': 'var(--node-full-cpu)',
        'node-full-net': 'var(--node-full-net)',
        'node-ofr': 'var(--node-ofr)',
        'node-isolated': 'var(--node-isolated)',
        'node-overhead': 'var(--node-overhead)',
        // Category badges (PRD §7)
        'cat-mm': '#1D4ED8',
        'cat-hm': '#166534',
        'cat-vhm': '#6B21A8',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
