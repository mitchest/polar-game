import { defineConfig } from 'vite';

// Relative base ('./') keeps asset URLs working both locally and, later, on the
// GitHub Pages project subpath (https://mitchest.github.io/polar-game/).
// `server.host` exposes the dev server on the LAN so we can test on a phone/iPad.
export default defineConfig({
  base: './',
  server: {
    host: true,
  },
});
