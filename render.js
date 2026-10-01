// Build the client bundle, then prerender App.svelte into dist/index.html
// and inline the CSS, so that the page renders fully without JS.
import fs from 'node:fs/promises';
import path from 'node:path';
import {build, createServer} from 'vite';
import {render} from 'svelte/server';

const outDir = 'dist';

await build();

const server = await createServer({
  server: {middlewareMode: true},
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: {noDiscovery: true},
});
const {default: App} = await server.ssrLoadModule('/src/App.svelte');
const {body} = render(App);
await server.close();

const htmlPath = path.join(outDir, 'index.html');
let html = await fs.readFile(htmlPath, 'utf-8');

html = html.replace('<!--app-html-->', () => body);

const linkRegExp = /<link rel="stylesheet"[^>]* href="([^"]+)">/g;
for (const [link, href] of [...html.matchAll(linkRegExp)]) {
  const cssPath = path.join(outDir, href);
  const css = await fs.readFile(cssPath, 'utf-8');
  html = html.replace(link, () => `<style>${css}</style>`);
  await fs.rm(cssPath);
}

await fs.writeFile(htmlPath, html);
