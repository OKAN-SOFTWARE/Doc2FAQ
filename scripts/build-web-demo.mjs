import {readFile, writeFile, mkdir, copyFile, cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'demo-dist');
const source = path.join(root, 'src/main/resources/static');
await mkdir(output, {recursive: true});
const pom = await readFile(path.join(root, 'pom.xml'), 'utf8');
const version = pom.match(/<artifactId>doc2faq<\/artifactId>\s*<version>([^<]+)<\/version>/)[1];
let html = await readFile(path.join(source, 'index.html'), 'utf8');
html = html.replaceAll('@project.version@', version)
  .replace('content="Doc2FAQ extracts existing Q&A or builds source-grounded FAQ suggestions from TXT, Markdown, PDF, and DOCX. Review, edit, and export."', 'content="Try Doc2FAQ in your browser: draft FAQs from text, inspect sources, edit, approve, and export."')
  .replaceAll('href="/styles.css"', 'href="./styles.css"')
  .replaceAll('href="/retro.css"', 'href="./retro.css"')
  .replaceAll('src="/project.js"', 'src="./project.js"')
  .replace('src="/app.js"', 'src="./app.js"')
  .replace('src="/background.js"', 'src="./background.js"')
  .replace('<script src="./app.js"', '<script src="./documents.js" defer></script>\n  <script src="./engine.js" defer></script>\n  <script src="./app.js"')
  .replace('<title>Doc2FAQ — The FAQ Workbench</title>', '<title>Doc2FAQ — The Interactive Playground</title>')
  .replace('href="/" aria-label="Doc2FAQ home"', 'href="https://okantiktas.com/projects/doc2faq/" aria-label="Back to Doc2FAQ homepage"')
  .replace('LOCAL JAVA WORKSPACE', 'THE INTERACTIVE PLAYGROUND')
  .replace('WELCOME TO DOC2FAQ /', 'WELCOME TO THE DOC2FAQ PLAYGROUND /')
  .replace('PDF/DOCX files are processed by this server in memory; no documents are permanently saved.', 'Demo text is processed in this browser. Load an example to get started.')
  .replace('Paste text or open <code>.txt</code>, <code>.md</code>, <code>.pdf</code>, or <code>.docx</code> (up to 5 MB for PDF/Word). Choose how to build your draft.', 'Paste text or open <code>.txt</code>, <code>.md</code>, <code>.pdf</code>, or <code>.docx</code>. PDF/Word files: up to 5 MB; PDFs: up to 50 pages. Documents are processed in your browser. Legacy .doc files and OCR are not supported.')
  .replace('Content preview. PDF and Word downloads apply their own page layout.', 'All FAQs are included, even when filtered. PDF and Word downloads apply their own pagination.');
const noteStart = html.indexOf('        <p><strong>Good to know.</strong>');
const noteEnd = html.indexOf('</p>', noteStart) + 4;
html = html.slice(0, noteStart) + '        <p><strong>Browser demo.</strong> Text processing and text exports happen on your device. Nothing you paste is sent to an FAQ server. No AI is used. This simplified demo may produce different drafts from the full Java app. Source references use text lines, not PDF pages. Optional autosave stores source and drafts in this browser; use Clear saved data on shared devices. Saved projects contain the source. PDF and Word (.docx) import/export run in your browser. Scanned PDFs need OCR, which is not included. PDF export embeds bundled DejaVu Sans fonts for extended Unicode coverage; unsupported scripts may still require Word. Document libraries load from a CDN when needed; your document content is not uploaded.</p>' + html.slice(noteEnd);
html = html.replace('      <section class="workspace"', `      <nav class="demo-links" aria-label="Project navigation"><a class="button button-secondary" href="https://okantiktas.com/projects/doc2faq/">← Back to Doc2FAQ homepage</a><a class="button button-secondary" href="https://github.com/OKAN-SOFTWARE/Doc2FAQ" target="_blank" rel="noopener noreferrer">Explore source ↗</a><a class="button button-primary" href="https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/latest" target="_blank" rel="noopener noreferrer">Download Java app ↗</a></nav>\n      <p class="demo-disclosure">Try the review workflow here. The latest downloadable release may have fewer features than this development demo. <a href="https://github.com/OKAN-SOFTWARE/Doc2FAQ/blob/main/docs/WEB-DEMO.md">Compare demo and app ↗</a></p>\n      <section class="workspace"`);
await writeFile(path.join(output, 'index.html'), html);
let app = await readFile(path.join(source, 'app.js'), 'utf8');
app = app.replaceAll('await fetch(', 'await globalThis.Doc2FaqDemo.request(')
 .replace('TXT, Markdown, PDF, and DOCX files are supported.', 'TXT, Markdown, PDF, and Word (.docx) are supported in this browser.')
 .replace('Extracting document text on this server…', 'Extracting document text in your browser…')
 .replace('Generate source-grounded questions from headings and document passages. Local rules only; review each answer.', 'Suggest questions from Markdown sections using simplified browser rules. Review each answer.');
await writeFile(path.join(output, 'app.js'), app);
for (const file of ['project.js', 'background.js', 'styles.css', 'retro.css']) await copyFile(path.join(source, file), path.join(output, file));
await copyFile(path.join(root, 'web-demo/engine.js'), path.join(output, 'engine.js'));
await copyFile(path.join(root, 'web-demo/documents.js'), path.join(output, 'documents.js'));
await cp(path.join(root, 'web-demo/fonts'), path.join(output, 'fonts'), {recursive: true});
await writeFile(path.join(output, 'styles.css'), (await readFile(path.join(output, 'styles.css'), 'utf8')) + '\n.demo-links{display:flex;gap:12px;flex-wrap:wrap;margin:0 0 18px}.demo-links .button-primary{flex:0 1 auto}.demo-disclosure{color:var(--muted);font-size:13px;line-height:1.7;margin-bottom:30px}.demo-disclosure a{color:var(--mint)}\n');
for (const file of ['app.js', 'engine.js', 'documents.js', 'project.js', 'background.js', 'styles.css', 'retro.css']) {
  const digest = createHash('sha256').update(await readFile(path.join(output, file))).digest('hex').slice(0, 12);
  html = html.replaceAll('./' + file + '"', './' + file + '?v=' + digest + '"');
}
await writeFile(path.join(output, 'index.html'), html);
console.log('Built browser demo at ' + output);
