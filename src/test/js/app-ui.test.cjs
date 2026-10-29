const {readFileSync} = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const scriptPath = path.resolve(__dirname, "../../main/resources/static/app.js");
const source = readFileSync(scriptPath, "utf8");

// This app has no frontend dependencies. Test the actual export functions with tiny DOM stubs.
const stub = () => ({value: "extract", addEventListener() {}});
const context = {Doc2FaqProject: require("../../main/resources/static/project.js"), document: {getElementById: stub}};
const withoutBoot = source.replace(/updateModeText\(\);\s*updateCount\(\);\s*render\(\);\s*$/, "");
vm.runInNewContext(withoutBoot +
  "\nglobalThis.exportsUnderTest = {" +
  "setItems: (next) => { items = next; }, " +
  "markdown, json, html, escapeHtml, validDraft, exportData};\n", context);
const app = context.exportsUnderTest;

test("Markdown and JSON exports include user-edited FAQ values", () => {
  app.setItems([{question: "How much?", answer: "USD 50 < monthly"}]);
  assert.match(app.markdown(), /## How much\?/);
  const data = JSON.parse(app.json());
  assert.equal(data.items[0].answer, "USD 50 < monthly");
  assert.equal(app.validDraft(), true);
});

test("HTML export escapes untrusted document text", () => {
  app.setItems([{
    question: '<img src=x onerror=alert("x")>',
    answer: '<script>alert("x")</script> & clear'
  }]);
  const output = app.html();
  assert.match(output, /&lt;img src=x/);
  assert.match(output, /&lt;script&gt;/);
  assert.match(output, /&amp; clear/);
  assert.doesNotMatch(output, /<script>/);
  assert.doesNotMatch(output, /<img src=x/);
});

test("Blank FAQ entries cannot be exported", () => {
  app.setItems([{question: "What?", answer: "  "}]);
  assert.equal(app.validDraft(), false);
});

test("Selected export format controls output and extension", () => {
  app.setItems([{question: "What?", answer: "Yes."}]);
  const item = app.exportData();
  assert.equal(item.ext, "md");
  assert.match(item.text, /## What\?/);
});
