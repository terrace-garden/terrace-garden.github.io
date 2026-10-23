import { mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { publicPage } from '../src/public-pages.mjs';

const output = new URL('../docs/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const route of ['privacy', 'support', 'community']) {
  const path = route ? `/${route}/` : '/';
  const response = publicPage(new Request(`https://terrace-garden.github.io${path}`), path);
  if (!response?.ok) throw new Error(`Unable to generate ${path}`);
  const prefix = route ? '../' : './';
  let html = (await response.text())
    .replaceAll('href="/"', `href="${prefix}"`)
    .replace(/href="\/(privacy|support|community)"/g, (_, page) => `href="${prefix}${page}/"`)
    .replace('<meta name="viewport"', '<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src \'self\'; base-uri \'none\'; form-action \'none\'"><meta name="viewport"');
  const directory = new URL(route ? `${route}/` : './', output);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}
await cp(new URL('../src/landing/', import.meta.url), output, { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
await writeFile(new URL('404.html', output), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — Terrace</title><main><h1>A little detour.</h1><p>This page isn’t here. <a href="https://terrace-garden.github.io/">Return to Terrace</a>.</p></main></html>');
console.log(`Built four static pages at ${fileURLToPath(output)}`);
