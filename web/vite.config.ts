import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Preload the two main text font files so the first paint uses the real font. */
function preloadMainFonts(): Plugin {
  return {
    name: 'pillplan:preload-main-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const files = Object.keys(context.bundle ?? {}).filter((file) =>
          /atkinson-hyperlegible-next-latin-(400|700)-normal.*\.woff2$/.test(file),
        );
        return {
          html,
          tags: files.map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${file}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head' as const,
          })),
        };
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadMainFonts()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    manifest: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
