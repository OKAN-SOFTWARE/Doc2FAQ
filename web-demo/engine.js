/* Browser-only demonstration rules. The Java services remain the full application's engine. */
(function (root) {
  'use strict';
  const splitLines = text => text.split(/\r\n|[\n\r\v\f\u0085\u2028\u2029]/);
  function draft(content, mode) {
    if (typeof content !== 'string' || !content.trim()) throw new Error('Add document text first.');
    if (content.length > 50000) throw new Error('Document text exceeds 50,000 characters.');
    const lines = splitLines(content), items = [], seen = new Set();
    function add(question, start, end, answerLines) {
      const answer = answerLines.join(' ').trim();
      question = question.slice(0, 500);
      const key = question.toLowerCase() + '\n' + answer.toLowerCase();
      if (!answer || !question || seen.has(key) || items.length >= 30) return;
      seen.add(key);
      items.push({question, answer, source: {section: question, startLine: start + 1, endLine: end + 1,
        excerpt: lines.slice(start, end + 1).join('\n')}});
    }
    let question = null, start = 0, end = 0, answer = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const prefix = /^(?:#{1,6}\s+|(?:Q|Question):\s*)/i.exec(line);
      if (prefix && line.endsWith('?') && line.slice(prefix[0].length).trim().length > 1) {
        add(question || '', start, end, answer);
        question = line.slice(prefix[0].length).trim(); start = end = i; answer = [];
      } else if (line.startsWith('#')) {
        add(question || '', start, end, answer); question = null; answer = [];
      } else if (question && line) {
        const value = line.replace(/^(?:A|Answer):\s*/i, '').trim();
        if (value) { answer.push(value); end = i; }
      }
    }
    add(question || '', start, end, answer);
    if (mode === 'generate') {
      const explicit = [...items];
      const headings = lines.map((line, i) => ({line: line.trim(), i})).filter(x => /^#{1,6}\s+/.test(x.line));
      for (let j = 0; j < headings.length; j++) {
        const heading = headings[j], last = (headings[j + 1]?.i ?? lines.length) - 1;
        const label = heading.line.replace(/^#{1,6}\s+/, '').trim();
        if (heading.line.startsWith('# ') || /\?$/.test(label) || /^faq\b/i.test(label) ||
            explicit.some(item => heading.i + 1 >= item.source.startLine && heading.i + 1 <= item.source.endLine)) continue;
        let finish = last;
        while (finish > heading.i && !lines[finish].trim()) finish--;
        const body = lines.slice(heading.i + 1, finish + 1).map(line => line.trim()).filter(Boolean);
        const phrasing = {services: 'What services are included?', support: 'Where can I get support?',
          'team responsibilities': 'What are the team responsibilities?', 'knowledge sharing': 'How is knowledge shared?',
          'technical skills': 'Which skills and technologies are listed?'};
        const suggestion = Object.hasOwn(phrasing, label.toLowerCase())
          ? phrasing[label.toLowerCase()] : 'What should I know about ' + label + '?';
        add(suggestion, heading.i, finish, body);
      }
      if (!headings.length && !items.length) {
        let first = lines.findIndex(line => line.trim()), last = lines.length - 1;
        while (last > first && !lines[last].trim()) last--;
        add('What does this document explain?', first, last, lines.slice(first, last + 1).map(line => line.trim()).filter(Boolean));
      }
    }
    return {items, count: items.length, notice: 'Browser demo: simplified text rules; review every answer.'};
  }
  const api = {draft, async request(url, options) {
    if (!['/api/faqs/preview', '/api/faqs/generate'].includes(url)) {
      return {ok: false, json: async () => ({message: 'PDF and Word processing are available in the downloadable Java app.'})};
    }
    try {
      const data = draft(JSON.parse(options.body).content, url.endsWith('/generate') ? 'generate' : 'extract');
      return {ok: true, json: async () => data};
    } catch (error) { return {ok: false, json: async () => ({message: error.message})}; }
  }};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Doc2FaqDemo = api;
})(globalThis);
