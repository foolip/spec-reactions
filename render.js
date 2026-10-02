// Build the client bundle, then prerender App.svelte into dist/index.html
// and inline the CSS, so that the page renders fully without JS.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'vite';

const outDir = 'dist';
const ssrOutDir = '.ssr';

await build();
await build({
  logLevel: 'warn',
  build: {ssr: 'src/server.js', outDir: ssrOutDir},
});

const {default: renderBody} = await import(pathToFileURL(path.resolve(ssrOutDir, 'server.js')));
const body = renderBody();
await fs.rm(ssrOutDir, {recursive: true});

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
