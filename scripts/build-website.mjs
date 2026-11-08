import {cp, copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'website-dist');

// Rebuild from the tracked app frontend so the website demo never goes stale.
await import('./build-web-demo.mjs');
await mkdir(path.join(output, 'demo'), {recursive: true});

let homepage = await readFile(path.join(root, 'website/index.html'), 'utf8');
homepage = homepage
  .replaceAll('href="/styles.css"', 'href="./styles.css"')
  .replaceAll('href="/demo/"', 'href="./demo/"')
  .replaceAll('href="/"', 'href="./"');
await writeFile(path.join(output, 'index.html'), homepage);
await copyFile(path.join(root, 'website/styles.css'), path.join(output, 'styles.css'));

await cp(path.join(root, 'demo-dist'), path.join(output, 'demo'), {recursive: true});
await copyFile(path.join(root, 'web-demo/THIRD-PARTY.md'), path.join(output, 'demo/THIRD-PARTY.md'));

// The final website lives under /projects/doc2faq/, not the domain root.
const demoIndex = path.join(output, 'demo/index.html');
let demo = await readFile(demoIndex, 'utf8');
demo = demo
  .replaceAll('href="https://okantiktas.com/projects/doc2faq/"', 'href="../"')
  .replaceAll('href="https://okantiktas.com/"', 'href="../"');
await writeFile(demoIndex, demo);

console.log('Built website homepage and browser demo at ' + output);
