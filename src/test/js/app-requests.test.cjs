const {readFileSync} = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const source = readFileSync(path.resolve(__dirname, "../../main/resources/static/app.js"), "utf8");
const withoutBoot = source.replace(/updateModeText\(\);\s*updateCount\(\);\s*render\(\);\s*$/, "");

function pendingDraft() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: "", disabled: false, textContent: "", handlers: {},
      addEventListener(type, handler) { this.handlers[type] = handler; },
      focus() {}
    });
    return elements.get(id);
  }
  let complete;
  let fail;
  const response = new Promise((resolve, reject) => { complete = resolve; fail = reject; });
  const context = {document: {getElementById: element}, fetch: () => response};
  // Keep the actual event handlers and export controls; these tests do not need card layout.
  vm.runInNewContext(withoutBoot + "\nrender = () => updateControls();", context);
  element("source-text").value = "Q: Old question?\nA: Old answer.";
  element("draft-mode").value = "extract";
  const finished = element("generate-btn").handlers.click();
  return {
    element, finished,
    fail() { fail(new Error("Network unavailable.")); },
    complete(ok = true) {
      complete({ok, json: async () => ({
        items: [{question: "Old question?", answer: "Old answer."}],
        message: "Old request failed."
      })});
    }
  };
}

test("a response for unchanged source enables export", async () => {
  const draft = pendingDraft();
  draft.complete();
  await draft.finished;
  assert.equal(draft.element("faq-count").textContent, "1 ITEM");
  assert.equal(draft.element("copy-btn").disabled, false);
  assert.equal(draft.element("generate-btn").disabled, false);
});

test("editing the source discards an in-flight response even if the text is restored", async () => {
  const draft = pendingDraft();
  const input = draft.element("source-text");
  const original = input.value;
  input.value = "A different document.";
  input.handlers.input();
  input.value = original;
  input.handlers.input();
  draft.complete();
  await draft.finished;
  assert.equal(draft.element("faq-count").textContent, "0 ITEMS");
  assert.equal(draft.element("copy-btn").disabled, true);
  assert.equal(draft.element("download-btn").disabled, true);
  assert.equal(draft.element("generate-btn").disabled, false);
});

test("switching modes discards results and preserves the new mode status", async () => {
  const draft = pendingDraft();
  const mode = draft.element("draft-mode");
  mode.value = "generate";
  mode.handlers.change();
  const status = draft.element("status").textContent;
  draft.complete();
  await draft.finished;
  assert.equal(draft.element("faq-count").textContent, "0 ITEMS");
  assert.equal(draft.element("copy-btn").disabled, true);
  assert.equal(draft.element("status").textContent, status);
});

test("loading an example invalidates the previous request", async () => {
  const draft = pendingDraft();
  draft.element("sample-btn").handlers.click();
  draft.complete();
  await draft.finished;
  assert.equal(draft.element("faq-count").textContent, "0 ITEMS");
  assert.equal(draft.element("copy-btn").disabled, true);
});

test("an outdated failure cannot overwrite the current mode status", async () => {
  const draft = pendingDraft();
  draft.element("draft-mode").value = "generate";
  draft.element("draft-mode").handlers.change();
  const status = draft.element("status").textContent;
  draft.complete(false);
  await draft.finished;
  assert.equal(draft.element("status").textContent, status);
  assert.equal(draft.element("generate-btn").disabled, false);
});

test("importing replacement text invalidates the previous request", async () => {
  const draft = pendingDraft();
  const input = draft.element("file-input");
  input.files = [{name: "replacement.txt", size: 30, text: async () => "New imported document."}];
  await input.handlers.change({target: input});
  draft.complete();
  await draft.finished;
  assert.equal(draft.element("source-text").value, "New imported document.");
  assert.equal(draft.element("faq-count").textContent, "0 ITEMS");
  assert.equal(draft.element("copy-btn").disabled, true);
});

test("an outdated network failure cannot replace the current status", async () => {
  const draft = pendingDraft();
  draft.element("sample-btn").handlers.click();
  const status = draft.element("status").textContent;
  draft.fail();
  await draft.finished;
  assert.equal(draft.element("status").textContent, status);
  assert.equal(draft.element("generate-btn").disabled, false);
});

test("a current network failure remains visible and allows retry", async () => {
  const draft = pendingDraft();
  draft.fail();
  await draft.finished;
  assert.equal(draft.element("status").textContent, "Network unavailable.");
  assert.equal(draft.element("status").className, "status error");
  assert.equal(draft.element("generate-btn").disabled, false);
});
