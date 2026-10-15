import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Safari 15+ (iPhones a few iOS versions back), not just the newest browsers
  build: { chunkSizeWarningLimit: 900, target: ['es2022', 'safari15', 'chrome100', 'firefox100'] },
});
