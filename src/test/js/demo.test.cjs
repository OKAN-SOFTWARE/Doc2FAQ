const test = require('node:test');
const assert = require('node:assert/strict');
const {draft, request} = require('../../../web-demo/engine.js');
const project = require('../../main/resources/static/project.js');

test('browser demo extracts Q/A and question headings with exact CRLF source ranges', () => {
  const text = 'Q: Where is support?\r\nA: Ask the team.\r\n\r\n## What services?\r\nOnboarding.';
  const result = draft(text, 'extract');
  assert.equal(result.count, 2);
  assert.equal(result.items[0].answer, 'Ask the team.');
  const saved = {type:'doc2faq-project',schemaVersion:2,title:'Demo',mode:'extract',source:{text,name:'demo.txt'},items:result.items.map(project.normalizeItem)};
  assert.equal(project.parse(project.serialize(saved)).items.length, 2);
});

test('extract does not invent FAQs from ordinary text', () => {
  assert.equal(draft('An ordinary document without questions.', 'extract').count, 0);
});

test('browser generation suggests section questions using original answers', () => {
  const result = draft('# Guide\n\n## Services\nOnboarding.\n\n## Support\nAsk the team.', 'generate');
  assert.equal(result.count, 2);
  assert.equal(result.items[1].question, 'Where can I get support?');
  assert.equal(result.items[1].answer, 'Ask the team.');
  assert.equal(result.items[1].source.startLine, 6);
});

test('browser demo validates size and caps entries', () => {
  assert.throws(() => draft('', 'generate'), /Add document/);
  assert.throws(() => draft('x'.repeat(50001), 'extract'), /50,000/);
  assert.equal(draft(Array.from({length:40},(_,i)=>`Q: Question ${i}?\nA: Answer ${i}.`).join('\n'), 'extract').count, 30);
});

test('browser adapter never falls through to remote import or export APIs', async () => {
  const unsupported = await request('/api/faqs/export/pdf', {});
  assert.equal(unsupported.ok, false);
  assert.match((await unsupported.json()).message, /unavailable/);
  const supported = await request('/api/faqs/preview', {body:JSON.stringify({content:'Q: What?\nA: Example.'})});
  assert.equal(supported.ok, true);
  assert.equal((await supported.json()).count, 1);
});

test('HTML-like document text remains source text in the demo result', () => {
  const result = draft('Q: What?\nA: <script>alert(1)</script>', 'extract');
  assert.equal(result.items[0].answer, '<script>alert(1)</script>');
});

test('unrecognized headings use string fallback even when named like Object properties', () => {
  const text = '## Constructor\nFirst detail.\n## __proto__\nSecond detail.\n## toString\nThird detail.\n## Services\nOnboarding.';
  const result = draft(text, 'generate');
  assert.equal(result.count, 4);
  assert.equal(result.items[0].question, 'What should I know about Constructor?');
  assert.equal(result.items[1].question, 'What should I know about __proto__?');
  assert.equal(result.items[2].question, 'What should I know about toString?');
  assert.equal(result.items[3].question, 'What services are included?');
});
