import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
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
  .replaceAll('src="/project.js"', 'src="./project.js"')
  .replace('src="/app.js"', 'src="./app.js"')
  .replace('src="/background.js"', 'src="./background.js"')
  .replace('<script src="./app.js"', '<script src="./engine.js" defer></script>\n  <script src="./app.js"')
  .replace('<title>Doc2FAQ — Clear answers start here</title>', '<title>Doc2FAQ · Try the browser demo | Okan Tiktas</title>')
  .replace('href="/" aria-label="Doc2FAQ home"', 'href="https://okantiktas.com/" aria-label="Back to Okan Tiktas homepage"')
  .replace('PREVIEW · LOCAL WORKSPACE', 'INTERACTIVE BROWSER DEMO')
  .replace('DOCUMENT INTELLIGENCE / PREVIEW', 'BROWSER DEMO / DEVELOPMENT')
  .replace('PDF/DOCX files are processed by this server in memory; no documents are permanently saved.', 'Demo text is processed in this browser. Load an example to get started.')
  .replace('Paste text or open <code>.txt</code>, <code>.md</code>, <code>.pdf</code>, or <code>.docx</code> (up to 5 MB for PDF/Word). Choose how to build your draft.', 'Paste text or open <code>.txt</code> or <code>.md</code> (256 KB). This browser demo uses simplified text rules. PDF/Word imports and exports are in the Java app.')
  .replace('accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"', 'accept=".txt,.md,text/plain,text/markdown"')
  .replace('                <option value="pdf">PDF</option>\n', '')
  .replace('                <option value="docx">Word (.docx)</option>\n', '')
  .replace('Content preview. PDF and Word downloads apply their own page layout.', 'Content preview. All FAQs are included, even when the review list is filtered.');
const noteStart = html.indexOf('        <p><strong>Good to know.</strong>');
const noteEnd = html.indexOf('</p>', noteStart) + 4;
html = html.slice(0, noteStart) + '        <p><strong>Browser demo.</strong> Text processing and text exports happen on your device. Nothing you paste is sent to an FAQ server. No AI is used. This simplified demo may produce different drafts from the full Java app. Source references use text lines, not PDF pages. Optional autosave stores source and drafts in this browser; use Clear saved data on shared devices. Saved projects contain the source. PDF/Word processing and OCR are not available here; the Java app supports PDF/Word import and export, but does not include OCR.</p>' + html.slice(noteEnd);
html = html.replace('      <section class="workspace"', `      <nav class="demo-links" aria-label="Project navigation"><a class="button button-secondary" href="https://okantiktas.com/">← Back to homepage</a><a class="button button-secondary" href="https://github.com/OKAN-SOFTWARE/Doc2FAQ" target="_blank" rel="noopener noreferrer">Explore source ↗</a><a class="button button-primary" href="https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/latest" target="_blank" rel="noopener noreferrer">Download Java app ↗</a></nav>\n      <p class="demo-disclosure">Try the review workflow here. The latest downloadable release may have fewer features than this development demo. <a href="https://github.com/OKAN-SOFTWARE/Doc2FAQ/blob/main/docs/WEB-DEMO.md">Compare demo and app ↗</a></p>\n      <section class="workspace"`);
await writeFile(path.join(output, 'index.html'), html);
let app = await readFile(path.join(source, 'app.js'), 'utf8');
app = app.replaceAll('await fetch(', 'await globalThis.Doc2FaqDemo.request(')
 .replace('TXT, Markdown, PDF, and DOCX files are supported.', 'This demo supports TXT and Markdown. The Java app also supports PDF and DOCX.')
 .replace('const isDocument = /\\.(pdf|docx)$/i.test(file.name);', 'const isDocument = false;')
 .replace('Choose a .txt, .md, .pdf, or .docx file.', 'This browser demo accepts .txt or .md. Use the Java app for PDF or Word files.')
 .replace('Generate source-grounded questions from headings and document passages. Local rules only; review each answer.', 'Suggest questions from Markdown sections using simplified browser rules. Review each answer.');
await writeFile(path.join(output, 'app.js'), app);
for (const file of ['project.js', 'background.js', 'styles.css']) await copyFile(path.join(source, file), path.join(output, file));
await copyFile(path.join(root, 'web-demo/engine.js'), path.join(output, 'engine.js'));
await writeFile(path.join(output, 'styles.css'), (await readFile(path.join(output, 'styles.css'), 'utf8')) + '\n.demo-links{display:flex;gap:12px;flex-wrap:wrap;margin:0 0 18px}.demo-links .button-primary{flex:0 1 auto}.demo-disclosure{color:var(--muted);font-size:13px;line-height:1.7;margin-bottom:30px}.demo-disclosure a{color:var(--mint)}\n');
console.log('Built browser demo at ' + output);
