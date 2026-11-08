/* PDF/DOCX files stay on the device. Only pinned library code is loaded from a CDN. */
(function (root) {
  'use strict';
  const MAX_FILE = 5 * 1024 * 1024, MAX_TEXT = 50000;
  const libraries = {
    pdf: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.mjs',
    worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs',
    pdfLib: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    fontkit: 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js',
    pdfRegular: './fonts/DejaVuSans.ttf',
    pdfBold: './fonts/DejaVuSans-Bold.ttf',
    zip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    docx: 'https://cdn.jsdelivr.net/npm/docx@9.6.1/dist/index.iife.js'
  };
  const pending = new Map();
  function loadScript(url, name) {
    if (root[name]) return Promise.resolve(root[name]);
    if (!pending.has(url)) pending.set(url, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => { script.remove(); pending.delete(url); reject(new Error('Document tools could not load. Check your connection and try again.')); }, 30000);
      script.src = url; script.crossOrigin = 'anonymous';
      script.onload = () => { clearTimeout(timer); if (root[name]) resolve(root[name]); else { pending.delete(url); reject(new Error('Document tools failed to initialize. Please reload.')); } };
      script.onerror = () => { clearTimeout(timer); script.remove(); pending.delete(url); reject(new Error('Document tools could not load. Check your connection and try again.')); };
      document.head.append(script);
    }));
    return pending.get(url);
  }
  function loadFont(url) {
    if (!pending.has(url)) pending.set(url, root.fetch(url).then(async response => {
      if (!response.ok) throw new Error('PDF fonts could not load. Check your connection and try again.');
      return new Uint8Array(await response.arrayBuffer());
    }).catch(error => {
      pending.delete(url);
      throw new Error('PDF fonts could not load. Check your connection and try again.', {cause: error});
    }));
    return pending.get(url);
  }
  function validateInput(file) {
    if (!file || !/\.(pdf|docx)$/i.test(file.name)) throw new Error('Choose a PDF or Word (.docx) file. Legacy .doc files are not supported.');
    if (!file.size || file.size > MAX_FILE) throw new Error('PDF and DOCX files must be nonempty and no larger than 5 MB.');
  }
  function checkedText(text) {
    if (text.length > MAX_TEXT) throw new Error('Extracted text exceeds 50,000 characters. Try a smaller document.');
    if (!text.trim()) throw new Error('No readable text found. Scanned/image-only files need OCR, which is not included.');
    return text;
  }
  async function extractPdf(bytes, pdfjs) {
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('This file is not a valid PDF.');
    const task = pdfjs.getDocument({data: bytes, isEvalSupported: false, stopAtErrors: true});
    let doc;
    try {
      doc = await task.promise;
      if (doc.numPages > 50) throw new Error('PDF files must not exceed 50 pages.');
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i), content = await page.getTextContent();
        let line = '', pageText = '', lastY = null, previous = null;
        for (const item of content.items) {
          if (typeof item.str !== 'string') continue;
          const y = item.transform?.[5];
          if (line && lastY !== null && Number.isFinite(y) && Math.abs(y - lastY) > 3) { pageText += line.trim() + '\n'; line = ''; previous = null; }
          let separator = '';
          if (line && !/\s$/.test(line) && !/^\s/.test(item.str) && previous) {
            const x = item.transform?.[4], beforeX = previous.transform?.[4];
            if (Number.isFinite(x) && Number.isFinite(beforeX) && Number.isFinite(previous.width) && Number.isFinite(item.width)) {
              const gap = item.dir === 'rtl' && previous.dir === 'rtl'
                ? beforeX - (x + item.width) : x - (beforeX + previous.width);
              const size = Math.hypot(item.transform?.[2] || 0, item.transform?.[3] || 0) || 10;
              if (gap > Math.max(0.5, size * 0.12)) separator = ' ';
            }
          }
          line += separator + item.str;
          previous = item;
          lastY = y;
          if (item.hasEOL) { pageText += line.trim() + '\n'; line = ''; lastY = null; previous = null; }
          if (text.length + pageText.length + line.length > MAX_TEXT) throw new Error('Extracted text exceeds 50,000 characters.');
        }
        text += pageText + line.trim() + (i < doc.numPages ? '\n\n' : '');
        page.cleanup();
      }
      return checkedText(text.trim());
    } catch (error) {
      if (error.name === 'PasswordException') throw new Error('Password-protected PDFs are not supported. Use an unlocked copy.');
      throw error;
    } finally { await task.destroy(); }
  }
  // Reject large entry tables before a ZIP parser allocates objects for each entry.
  function validateZip(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) throw new Error('This file is not a valid DOCX document.');
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (view.getUint32(i, true) !== 0x06054b50 || i + 22 + view.getUint16(i + 20, true) !== bytes.length) continue;
      const entries = view.getUint16(i + 10, true);
      if (view.getUint16(i + 4, true) || view.getUint16(i + 6, true) || entries > 1000 || entries !== view.getUint16(i + 8, true)) throw new Error('This DOCX archive is too complex or unsupported.');
      const offset = view.getUint32(i + 16, true), size = view.getUint32(i + 12, true);
      if (offset + size > i) throw new Error('The DOCX archive is corrupted.');
      return;
    }
    throw new Error('The DOCX archive is corrupted or uses an unsupported ZIP format.');
  }
  async function boundedEntry(entry, limit) {
    if (!entry) throw new Error('This file is missing required Word document content.');
    return new Promise((resolve, reject) => {
      const chunks = []; let length = 0, failed = false;
      const stream = entry.internalStream('uint8array');
      stream.on('data', chunk => {
        if (failed) return;
        length += chunk.length;
        if (length > limit) { failed = true; stream.pause(); reject(new Error('The Word document expands beyond the processing limit.')); return; }
        chunks.push(chunk);
      });
      stream.on('error', reject);
      stream.on('end', () => {
        if (failed) return;
        const bytes = new Uint8Array(length); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        resolve(new TextDecoder().decode(bytes));
      });
      stream.resume();
    });
  }
  function headingPrefix(style) {
    const level = /^Heading([1-6])$/i.exec(style);
    return level ? '#'.repeat(Math.min(Number(level[1]) + 1, 6)) + ' ' : '';
  }
  function wordXmlText(xml, Parser = root.DOMParser) {
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsupported XML declarations in the Word document.');
    const document = new Parser().parseFromString(xml, 'application/xml');
    if (document.getElementsByTagName('parsererror').length) throw new Error('The Word document contains malformed XML.');
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const body = document.getElementsByTagNameNS(ns, 'body')[0];
    if (!body) throw new Error('This file has no Word document body.');
    const lines = []; let length = 0;
    for (const paragraph of body.getElementsByTagNameNS(ns, 'p')) {
      let text = '';
      for (const node of paragraph.getElementsByTagNameNS(ns, '*')) {
        if (node.localName === 't') text += node.textContent;
        else if (node.localName === 'tab') text += '\t';
        else if (node.localName === 'br' || node.localName === 'cr') text += '\n';
      }
      if (!text.trim()) continue;
      const style = paragraph.getElementsByTagNameNS(ns, 'pStyle')[0];
      text = headingPrefix(style?.getAttributeNS(ns, 'val') || '') + text;
      length += text.length + 1;
      if (length > MAX_TEXT + 1) throw new Error('Extracted text exceeds 50,000 characters.');
      lines.push(text);
    }
    return checkedText(lines.join('\n'));
  }
  async function extractDocx(bytes, zipLib, Parser = root.DOMParser) {
    validateZip(bytes);
    const zip = await zipLib.loadAsync(bytes);
    const types = await boundedEntry(zip.file('[Content_Types].xml'), 100000);
    if (!types.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')) throw new Error('Choose a standard Word (.docx) document.');
    const xml = await boundedEntry(zip.file('word/document.xml'), 8 * 1024 * 1024);
    return wordXmlText(xml, Parser);
  }
  function validateExport(data) {
    if (!data || typeof data.title !== 'string' || data.title.length > 200 || !Array.isArray(data.items) || !data.items.length || data.items.length > 30) throw new Error('Invalid FAQ export.');
    let total = 0;
    for (const item of data.items) {
      if (!item || typeof item.question !== 'string' || !item.question.trim() || item.question.length > 500 || typeof item.answer !== 'string' || !item.answer.trim() || item.answer.length > 50000) throw new Error('Complete every question and answer before exporting.');
      total += item.question.length + item.answer.length;
    }
    if (total > 300000) throw new Error('FAQ text must not exceed 300,000 characters.');
  }
  function references(item) {
    const parts = (item.sources || []).map(ref => 'Source: ' + ref.section + ' (text lines ' + ref.startLine + '-' + ref.endLine + ').');
    if (!parts.length) parts.push('Manually added - no source reference.');
    if (item.edited) parts.push('Edited question or answer - recheck against the source.');
    return parts.join('\n');
  }
  function wrap(text, font, size, width) {
    const result = [];
    const advances = new Map();
    for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
      let line = '', used = 0, lastSpace = -1;
      for (const char of paragraph) {
        if (!advances.has(char)) advances.set(char, font.widthOfTextAtSize(char, size));
        const advance = advances.get(char);
        if (used + advance > width && line) {
          if (lastSpace >= 0) { result.push(line.slice(0, lastSpace)); line = line.slice(lastSpace + 1); }
          else { result.push(line); line = ''; }
          used = font.widthOfTextAtSize(line, size); lastSpace = line.lastIndexOf(' ');
        }
        line += char; used += advance; if (char === ' ') lastSpace = line.length - 1;
      }
      result.push(line);
    }
    return result;
  }
  function checkPdfGlyphs(data, fonts) {
    const regular = fonts.fontkit.create(fonts.regular);
    const bold = fonts.fontkit.create(fonts.bold);
    const examined = [
      [data.title || 'FAQ draft', bold],
      ...data.items.flatMap(item => [[item.question, bold], [item.answer, regular], ...(data.includeSources ? [[references(item), regular]] : [])])
    ];
    for (const [text, face] of examined) {
      for (const char of new Set(text)) {
        const point = char.codePointAt(0);
        if (point <= 32 || point === 127) continue;
        if (!face.hasGlyphForCodePoint(point)) {
          throw new Error(`PDF export cannot display “${char}” (U+${point.toString(16).toUpperCase()}) with the bundled font. Choose Word (.docx) to preserve it.`);
        }
      }
    }
  }
  async function exportPdf(data, lib, fonts) {
    validateExport(data);
    checkPdfGlyphs(data, fonts);
    const pdf = await lib.PDFDocument.create();
    pdf.setTitle(data.title); pdf.setCreator('Doc2FAQ browser demo'); pdf.setAuthor('Doc2FAQ');
    pdf.registerFontkit(fonts.fontkit);
    // DejaVu Sans covers Turkish, Latin Extended, IPA, symbols and quotation marks
    // that standard PDF Helvetica/WinAnsi cannot encode. Embed only used glyphs.
    const regular = await pdf.embedFont(fonts.regular, {subset: true});
    const bold = await pdf.embedFont(fonts.bold, {subset: true});
    const width = 595.28, height = 841.89, margin = 50, bottom = 58;
    let page, y;
    function newPage() { page = pdf.addPage([width, height]); y = height - margin; }
    function block(text, size, font, {center = false, gap = 10, keep = false} = {}) {
      const lines = wrap(text, font, size, width - margin * 2), step = size * 1.45;
      if (keep && y - Math.min(lines.length + 2, 6) * step < bottom) newPage();
      for (const line of lines) {
        if (y - step < bottom) newPage();
        page.drawText(line, {x: center ? (width - font.widthOfTextAtSize(line, size)) / 2 : margin, y: y - size, size, font, color: lib.rgb(0.08, 0.12, 0.18)});
        y -= step;
      }
      y -= gap;
    }
    try {
      newPage(); block(data.title || 'FAQ draft', 20, bold, {center: true, gap: 24});
      for (const item of data.items) {
        block(item.question, 13, bold, {keep: true, gap: 6}); block(item.answer, 11, regular);
        if (data.includeSources) block(references(item), 9, regular, {gap: 18});
      }
      const pages = pdf.getPages();
      for (const [i, p] of pages.entries()) {
        const label = (i + 1) + ' / ' + pages.length;
        p.drawText(label, {x: (width - regular.widthOfTextAtSize(label, 9)) / 2, y: 30, size: 9, font: regular});
      }
      return new Blob([await pdf.save()], {type: 'application/pdf'});
    } catch (error) {
      if (/WinAnsi|encode|No glyph/i.test(error.message)) throw new Error('A character in your text is not supported by the PDF font. Choose Word (.docx) to preserve it.');
      throw error;
    }
  }
  async function exportDocx(data, lib) {
    validateExport(data);
    const {Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber} = lib;
    const children = [new Paragraph({text: data.title || 'FAQ draft', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: {after: 360}})];
    for (const item of data.items) {
      children.push(new Paragraph({text: item.question, heading: HeadingLevel.HEADING_1, keepNext: true, spacing: {before: 240, after: 120}}));
      for (const text of item.answer.replace(/\r\n?/g, '\n').split('\n')) children.push(new Paragraph({text, spacing: {after: 120}}));
      if (data.includeSources) for (const text of references(item).split('\n')) children.push(new Paragraph({children: [new TextRun({text, size: 18, color: '475569'})], spacing: {after: 100}}));
    }
    const doc = new Document({creator: 'Doc2FAQ', title: data.title, styles: {default: {document: {run: {font: 'Arial', size: 22}}}},
      sections: [{properties: {page: {size: {width: 11906, height: 16838}, margin: {top: 1000, bottom: 1000, left: 1000, right: 1000}}},
        footers: {default: new Footer({children: [new Paragraph({alignment: AlignmentType.CENTER, children: [new TextRun({children: [PageNumber.CURRENT]})]})]})}, children}]});
    return Packer.toBlob(doc);
  }
  async function request(url, options) {
    try {
      if (url === '/api/documents/extract') {
        const file = options.body.get('file'); validateInput(file);
        const bytes = new Uint8Array(await file.arrayBuffer());
        let text;
        if (/\.pdf$/i.test(file.name)) {
          let pdfjs;
          try { pdfjs = await import(libraries.pdf); } catch { throw new Error('PDF tools could not load. Check your connection and try again.'); }
          pdfjs.GlobalWorkerOptions.workerSrc = libraries.worker;
          text = await extractPdf(bytes, pdfjs);
        } else text = await extractDocx(bytes, await loadScript(libraries.zip, 'JSZip'));
        return {ok: true, json: async () => ({text})};
      }
      if (url === '/api/faqs/export/pdf' || url === '/api/faqs/export/docx') {
        const data = JSON.parse(options.body); validateExport(data);
        const blob = url.endsWith('/pdf') ? await (async () => {
          const [lib, fontkit, regular, bold] = await Promise.all([
            loadScript(libraries.pdfLib, 'PDFLib'), loadScript(libraries.fontkit, 'fontkit'),
            loadFont(libraries.pdfRegular), loadFont(libraries.pdfBold)
          ]);
          return exportPdf(data, lib, {fontkit, regular, bold});
        })() : await exportDocx(data, await loadScript(libraries.docx, 'docx'));
        return {ok: true, blob: async () => blob};
      }
      throw new Error('Unsupported document operation.');
    } catch (error) { return {ok: false, json: async () => ({message: error.message || 'Could not process this document.'})}; }
  }
  const api = {request, validateInput, checkedText, validateZip, boundedEntry, headingPrefix, wordXmlText, extractDocx, extractPdf, validateExport, references, wrap, checkPdfGlyphs, exportPdf, exportDocx, libraries};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Doc2FaqDocuments = api;
})(globalThis);
