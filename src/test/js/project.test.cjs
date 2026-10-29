const test = require("node:test");
const assert = require("node:assert/strict");
const project = require("../../main/resources/static/project.js");

function fixture() {
  const text = "## Services\nOnboarding guides.\n## Support\nAsk the team.";
  const first = project.normalizeItem({question: "What services are included?", answer: "Onboarding guides.",
    source: {section: "Services", startLine: 1, endLine: 2, excerpt: "## Services\nOnboarding guides."}});
  const second = project.normalizeItem({question: "Where is support?", answer: "Ask the team.",
    source: {section: "Support", startLine: 3, endLine: 4, excerpt: "## Support\nAsk the team."}});
  return {type: "doc2faq-project", schemaVersion: 1, title: "Team FAQ", downloadName: "team-Doc2FAQ", mode: "generate",
    source: {text, name: "team.md"}, items: [first, second]};
}

test("project round trip preserves source, order, incomplete edits and original excerpts", () => {
  const data = fixture();
  data.items.reverse();
  data.items[0].answer = "Updated contact.";
  data.items[1].question = "";
  data.items[0].keptWith.push(data.items[1].id);
  const restored = project.parse(project.serialize(data));
  assert.deepEqual(restored, data);
  assert.equal(project.edited(restored.items[0]), true);
  assert.equal(restored.items[0].sources[0].excerpt, "## Support\nAsk the team.");
});

test("rejects malformed, oversized and unsupported project files", () => {
  assert.throws(() => project.parse("{"), /valid JSON/);
  assert.throws(() => project.parse(" ".repeat(project.MAX_PROJECT_BYTES + 1)), /4 MB/);
  assert.throws(() => project.parse(JSON.stringify({...fixture(), schemaVersion: 2})), /supported/);
  const data = fixture(); data.items[0].answer = "x".repeat(50001);
  assert.throws(() => project.serialize(data), /answer/);
});

test("rejects source references that do not match the source text", () => {
  for (const update of [{excerpt: "Invented fact."}, {startLine: 0}, {endLine: 99}, {endLine: 1.5}]) {
    const data = fixture(); Object.assign(data.items[0].sources[0], update);
    assert.throws(() => project.validateProject(data), /source reference/);
  }
});

test("rejects duplicate identifiers and excessive entries without mutating input", () => {
  const data = fixture();
  data.items[1].id = data.items[0].id;
  assert.throws(() => project.validateProject(data), /unique/);
  assert.throws(() => project.validateProject({...fixture(), items: Array(31).fill({})}), /30 FAQs/);
  const valid = fixture(); const saved = JSON.stringify(valid);
  project.validateProject(valid);
  assert.equal(JSON.stringify(valid), saved);
});

test("similarity flags repeated questions but distinguishes client and provider questions", () => {
  assert.equal(project.similar("What services are included?", "What services are included!"), true);
  assert.equal(project.similar("What responsibilities does the client have?", "What responsibilities does the provider have?"), false);
  assert.equal(project.similar("What services are included?", "When does the agreement end?"), false);
  assert.equal(project.similar("", "?"), false);
  // Suggestions only: neither party's answer is automatically removed.
  const data = fixture(); data.items[1].question = data.items[0].question;
  assert.equal(project.related(data.items, data.items[0]).length, 1);
  data.items[0].keptWith.push(data.items[1].id);
  assert.equal(project.related(data.items, data.items[1]).length, 0);
});

test("merge preserves both answers and sources and remains marked as edited", () => {
  const data = fixture(); const before = JSON.stringify(data);
  const merged = project.merge(...data.items);
  assert.equal(merged.answer, "Onboarding guides.\n\nAsk the team.");
  assert.equal(merged.sources.length, 2);
  assert.equal(project.edited(merged), true);
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(project.parse(project.serialize({...data, items: [merged]})).items[0], merged);
});

test("merge deduplicates identical sources and rejects an answer beyond the edit limit", () => {
  const [first] = fixture().items;
  assert.equal(project.merge(first, first).sources.length, 1);
  assert.equal(project.merge(first, first).answer, first.answer);
  assert.throws(() => project.merge({...first, answer: "a".repeat(30000)}, {...first, answer: "b".repeat(30000)}), /50,000/);
});

test("references use normalized text lines including CRLF and trailing blank lines", () => {
  const data = fixture(); data.source.text = data.source.text.replace(/\n/g, "\r\n");
  assert.equal(project.validateProject(data).items.length, 2);
});

test("PDF filenames follow the original name and permit an edited download name", () => {
  assert.equal(project.sourceTitle("TEst Data.pdf"), "TEst Data");
  assert.equal(project.downloadFilename(project.defaultDownloadName("TEst Data.pdf"), "pdf"), "testdata-Doc2FAQ.pdf");
  assert.equal(project.defaultDownloadName("TEst Data-Doc2FAQ.pdf"), "testdata-Doc2FAQ");
  assert.equal(project.defaultDownloadName("Résumé Notes.DOCX"), "résuménotes-Doc2FAQ");
  assert.equal(project.downloadFilename("My revised FAQ.pdf", "pdf"), "My revised FAQ.pdf");
  assert.equal(project.downloadFilename("My revised FAQ", "docx"), "My revised FAQ.docx");
  assert.equal(project.downloadFilename("", "pdf"), "document-Doc2FAQ.pdf");
  assert.equal(project.downloadFilename("CON", "pdf"), "document-CON.pdf");
  assert.doesNotMatch(project.downloadFilename("../bad:name\\test.pdf", "pdf"), /[/:\\]/);
});

test("older saved work remains readable and custom filenames survive save and reopen", () => {
  const data = fixture(); delete data.downloadName;
  assert.equal(project.validateProject(data).downloadName, "team-Doc2FAQ");
  data.downloadName = "Client knowledge base";
  assert.equal(project.parse(project.serialize(data)).downloadName, "Client knowledge base");
});
