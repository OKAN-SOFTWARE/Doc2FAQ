const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../../../web-demo/documents.js');

test('document input accepts PDF/DOCX within the size bound and rejects legacy, empty and oversized files', () => {
  for (const name of ['input.pdf','INPUT.DOCX']) assert.doesNotThrow(()=>tools.validateInput({name,size:100}));
  for (const file of [{name:'old.doc',size:100},{name:'empty.pdf',size:0},{name:'large.docx',size:5*1024*1024+1}]) assert.throws(()=>tools.validateInput(file));
});

test('empty/scanned extraction and excess text are explained without returning partial text', () => {
  assert.throws(()=>tools.checkedText('  '),/OCR/);
  assert.throws(()=>tools.checkedText('a'.repeat(50001)),/50,000/);
  assert.equal(tools.checkedText('Readable text.'),'Readable text.');
});

test('invalid file signatures are rejected before PDF/ZIP parsing', async () => {
  await assert.rejects(tools.extractPdf(new TextEncoder().encode('Not a PDF'),{}),/valid PDF/);
  assert.throws(()=>tools.validateZip(new Uint8Array(30)),/valid DOCX/);
});

test('PDF import rejects password protection and too many pages and always destroys the worker', async () => {
  let destroyed = 0;
  const bytes = new TextEncoder().encode('%PDF-1.7');
  await assert.rejects(tools.extractPdf(bytes,{getDocument(){return {promise:Promise.resolve({numPages:51}),destroy:async()=>destroyed++};}}),/50 pages/);
  await assert.rejects(tools.extractPdf(bytes,{getDocument(){return {promise:Promise.reject(Object.assign(new Error('password'),{name:'PasswordException'})),destroy:async()=>destroyed++};}}),/unlocked/);
  assert.equal(destroyed,2);
});

test('PDF text import preserves lines, combines pages and releases resources', async () => {
  let cleaned = 0, destroyed = 0;
  const pdfjs={getDocument(){return {promise:Promise.resolve({numPages:2,getPage:async i=>({getTextContent:async()=>({items:[{str:'Question '+i,transform:[0,0,0,0,0,100],hasEOL:true},{str:'Answer '+i,transform:[0,0,0,0,0,80],hasEOL:true}]}),cleanup(){cleaned++;}})}),destroy:async()=>destroyed++};}};
  const text = await tools.extractPdf(new TextEncoder().encode('%PDF-1.7'),pdfjs);
  assert.match(text,/Question 1\nAnswer 1/); assert.match(text,/Question 2\nAnswer 2/);
  assert.equal(cleaned,2); assert.equal(destroyed,1);
});

test('DOCX entry decompression is bounded and stops the stream rather than returning partial text', async () => {
  let paused = false;
  const entry={internalStream(){const handlers={};return {on(event,fn){handlers[event]=fn;},resume(){handlers.data(new Uint8Array(20));handlers.end();},pause(){paused=true;}};}};
  await assert.rejects(tools.boundedEntry(entry,10),/processing limit/); assert.equal(paused,true);
  await assert.rejects(tools.boundedEntry(null,10),/missing required/);
});

test('export validation keeps hidden incomplete entries and total text limits effective', () => {
  const data={title:'FAQ',items:[{question:'What?',answer:'Yes.'}]};
  assert.doesNotThrow(()=>tools.validateExport(data));
  assert.throws(()=>tools.validateExport({...data,items:[...data.items,{question:'',answer:'Hidden'}]}),/Complete/);
  assert.throws(()=>tools.validateExport({...data,items:Array.from({length:7},()=>({question:'What?',answer:'a'.repeat(50000)}))}),/300,000/);
});

test('PDF line wrapping preserves blank lines and splits long tokens within the printable width', () => {
  const font={widthOfTextAtSize:(text)=>[...text].length};
  const lines=tools.wrap('a'.repeat(51)+'\n\nShort answer',font,11,20);
  assert.ok(lines.every(line=>line.length<=20)); assert.ok(lines.includes(''));
  assert.equal(lines.slice(0,3).join(''),'a'.repeat(51));
});

test('Word Heading 1 becomes a section the browser generator can draft from', () => {
  const {draft} = require('../../../web-demo/engine.js');
  const text = tools.headingPrefix('Heading1') + 'Services\nOnboarding guides.\n' + tools.headingPrefix('Heading2') + 'Support\nAsk the team.';
  const result = draft(text, 'generate');
  assert.equal(result.count,2);
  assert.equal(result.items[0].answer,'Onboarding guides.');
  assert.equal(tools.headingPrefix('Title'),'');
  assert.equal(tools.headingPrefix('Heading6'),'###### ');
});

test('contiguous PDF fragments keep words intact while positioned word gaps get spaces', async () => {
  const fragments = [
    {str:'Doc',width:18,transform:[12,0,0,12,50,100]},
    {str:'2FAQ',width:28,transform:[12,0,0,12,68,100]},
    {str:'works',width:30,transform:[12,0,0,12,102,100]},
    {str:' well',width:25,transform:[12,0,0,12,132,100],hasEOL:true}
  ];
  const pdfjs={getDocument(){return {promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:fragments}),cleanup(){}})}),destroy:async()=>{}};}};
  assert.equal(await tools.extractPdf(new TextEncoder().encode('%PDF-1.7'),pdfjs),'Doc2FAQ works well');
});
