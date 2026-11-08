import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'website-dist');
const home = await readFile(path.join(output, 'index.html'), 'utf8');
const demo = await readFile(path.join(output, 'demo/index.html'), 'utf8');

assert.match(home, /href="\.\/demo\/"/, 'Homepage opens its sibling demo');
assert.match(home, /href="\.\/styles\.css"/, 'Homepage loads styles relative to subdirectory');
assert.doesNotMatch(home, /href="\/(?:demo\/|styles\.css|)"/, 'No domain-root homepage links');
assert.match(demo, /href="\.\.\/"/, 'Demo navigates back to its own homepage');
assert.match(demo, /THE INTERACTIVE PLAYGROUND/, 'Demo is branded consistently');
assert.match(demo, /id="file-input"/, 'File import remains available');
assert.match(demo, /id="export-format"/, 'FAQ export remains available');
assert.match(demo, /<option value="pdf" selected>PDF<\/option>/, 'PDF is the first and default export');
assert.match(demo, /<option value="docx">Word \(\.docx\)<\/option>/, 'DOCX is the next export');
assert.match(demo, /href="\.\/retro\.css\?v=/, 'Demo uses the approved retro theme');

for (const name of ['styles.css', 'retro.css', 'app.js', 'engine.js', 'documents.js', 'project.js', 'background.js']) {
  const file = path.join(output, 'demo', name);
  assert.ok((await stat(file)).size > 0, `Missing generated demo asset: ${name}`);
}
console.log('Website homepage, demo routes, export defaults and assets verified.');
