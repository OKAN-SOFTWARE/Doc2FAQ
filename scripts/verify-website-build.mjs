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
assert.match(home, /<details class="mobile-nav">/, 'Mobile visitors can open homepage navigation');
assert.doesNotMatch(home, /href="\/(?:demo\/|styles\.css|)"/, 'No domain-root homepage links');
assert.match(home, /id="whats-new"/, 'Homepage includes the release notes preview');
assert.match(home, /v0\.5\.0 AVAILABLE/, 'Published version is visibly labeled');
assert.match(home, /Released November 8, 2026/, 'Release date is explicit');
assert.match(home, /Java 21–26/, 'Homepage reflects the required compatibility matrix');
assert.match(home, /v0\.5\.0 Java app and Windows ZIP are ready to download/, 'Current release downloads are identified accurately');
assert.match(home, /releases\/tag\/v0\.5\.0/, 'Homepage links directly to the published release');
assert.match(demo, /href="\.\.\/"/, 'Demo navigates back to its own homepage');
assert.match(demo, /THE INTERACTIVE PLAYGROUND/, 'Demo is branded consistently');
assert.match(demo, /id="file-input"/, 'File import remains available');
assert.match(demo, /id="export-format"/, 'FAQ export remains available');
assert.match(demo, /<option value="pdf" selected>PDF<\/option>/, 'PDF is the first and default export');
assert.match(demo, /<option value="docx">Word \(\.docx\)<\/option>/, 'DOCX is the next export');
assert.match(demo, /href="\.\/retro\.css\?v=/, 'Demo uses the approved retro theme');

const homepageStyles = await readFile(path.join(output, 'styles.css'), 'utf8');
const demoStyles = await readFile(path.join(output, 'demo/retro.css'), 'utf8');
assert.match(homepageStyles, /@media\(max-width:480px\)/, 'Homepage includes narrow-phone rules');
assert.match(homepageStyles, /\.mobile-nav\[open\]/, 'Mobile navigation has an open state');
assert.match(demoStyles, /\/\* Mobile workspace:/, 'Workspace includes mobile layout rules');
assert.match(demoStyles, /\.project-toolbar\{display:grid/, 'Mobile workspace stacks saved-work controls');
assert.match(demoStyles, /\.result-actions\{grid-template-columns:/, 'Mobile exports remain reachable');

for (const name of ['styles.css', 'retro.css', 'app.js', 'engine.js', 'documents.js', 'project.js', 'background.js']) {
  const file = path.join(output, 'demo', name);
  assert.ok((await stat(file)).size > 0, `Missing generated demo asset: ${name}`);
}
for (const name of ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf', 'LICENSE-DejaVu.txt']) {
  const fontAsset = path.join(output, 'demo/fonts', name);
  assert.ok((await stat(fontAsset)).size > 0, `Missing Unicode PDF font asset: ${name}`);
}
const documents = await readFile(path.join(output, 'demo/documents.js'), 'utf8');
assert.match(documents, /registerFontkit\(fonts\.fontkit\)/, 'PDF export registers the custom font engine');
assert.match(documents, /DejaVuSans\.ttf/, 'PDF export uses bundled Unicode fonts');
console.log('Website homepage, demo routes, export defaults and assets verified.');
