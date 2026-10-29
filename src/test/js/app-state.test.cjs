const {readFileSync} = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");
const tools = require("../../main/resources/static/project.js");
const script = readFileSync(path.resolve(__dirname, "../../main/resources/static/app.js"), "utf8");

function harness(saved = new Map(), blocked = false) {
  const elements = new Map();
  function node(tag = "") {
    return {tag, value: "", checked: false, disabled: false, children: [], handlers: {}, textContent: "",
      addEventListener(name, fn) { this.handlers[name] = fn; },
      append(...values) { this.children.push(...values); }, replaceChildren(...values) { this.children = values; },
      focus() {}, querySelector() { return null; }};
  }
  function element(id) {
    if (!elements.has(id)) elements.set(id, node(id));
    return elements.get(id);
  }
  element("draft-mode").value = "extract";
  element("export-format").value = "markdown";
  const storage = {
    getItem(key) { if (blocked) throw new Error("Storage blocked"); return saved.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw new Error("Storage blocked"); saved.set(key, value); },
    removeItem(key) { if (blocked) throw new Error("Storage blocked"); saved.delete(key); }
  };
  const context = {Doc2FaqProject: tools, document: {getElementById: element, createElement: node},
    localStorage: storage, setTimeout(fn) { fn(); return 1; }, clearTimeout() {}, confirm: () => true,
    fetch: async () => ({ok: true, json: async () => ({items: [{question: "Where is support?", answer: "Ask the team.",
      source: {section: "Support", startLine: 1, endLine: 2, excerpt: "Q: Where is support?\nA: Ask the team."}}]})})};
  vm.runInNewContext(script, context);
  return {element, saved};
}

async function makeDraft(app) {
  app.element("source-text").value = "Q: Where is support?\nA: Ask the team.";
  app.element("source-text").handlers.input();
  await app.element("generate-btn").handlers.click();
}

function descendants(node) { return [node, ...node.children.flatMap(descendants)]; }

test("autosave is off by default and never writes document text until enabled", async () => {
  const app = harness(); await makeDraft(app);
  assert.equal(app.saved.size, 0);
  app.element("autosave-toggle").checked = true;
  app.element("autosave-toggle").handlers.change();
  const data = JSON.parse(app.saved.get("doc2faq.project.v1"));
  assert.equal(data.source.text, "Q: Where is support?\nA: Ask the team.");
  assert.equal(data.items[0].answer, "Ask the team.");
  assert.equal(app.saved.get("doc2faq.autosave"), "true");
});

test("saved edits restore on reload and clearing storage leaves the open workspace intact", async () => {
  const app = harness(); await makeDraft(app);
  app.element("autosave-toggle").checked = true; app.element("autosave-toggle").handlers.change();
  const answer = descendants(app.element("results")).find((node) => node.tag === "textarea");
  answer.value = "Updated support instructions."; answer.handlers.input();
  const restored = harness(app.saved);
  assert.equal(restored.element("faq-count").textContent, "1 ITEM");
  assert.equal(restored.element("source-text").value, app.element("source-text").value);
  assert.ok(descendants(restored.element("results")).some((node) => node.textContent === "Edited — recheck against the source"));
  restored.element("clear-saved-btn").handlers.click();
  assert.equal(restored.saved.size, 0);
  assert.equal(restored.element("faq-count").textContent, "1 ITEM");
  assert.equal(harness(restored.saved).element("faq-count").textContent, "0 ITEMS");
});

test("disabling autosave removes stored text and the preference", async () => {
  const app = harness(); await makeDraft(app);
  app.element("autosave-toggle").checked = true; app.element("autosave-toggle").handlers.change();
  app.element("autosave-toggle").checked = false; app.element("autosave-toggle").handlers.change();
  assert.equal(app.saved.size, 0);
  assert.equal(app.element("faq-count").textContent, "1 ITEM");
});

test("blocked storage and an invalid saved project leave the app usable", async () => {
  const app = harness(new Map(), true); await makeDraft(app);
  app.element("autosave-toggle").checked = true; app.element("autosave-toggle").handlers.change();
  assert.equal(app.element("faq-count").textContent, "1 ITEM");
  assert.match(app.element("save-status").textContent, /unavailable/);
  const invalid = harness(new Map([["doc2faq.autosave", "true"], ["doc2faq.project.v1", "bad JSON"]]));
  assert.equal(invalid.element("source-text").value, "");
  assert.match(invalid.element("save-status").textContent, /could not be restored/);
});

test("removing and undoing restores the answer and exact source excerpt", async () => {
  const app = harness(); await makeDraft(app);
  const remove = descendants(app.element("results")).find((node) => node.textContent === "Remove");
  remove.handlers.click();
  assert.equal(app.element("faq-count").textContent, "0 ITEMS");
  app.element("undo-btn").handlers.click();
  assert.equal(app.element("faq-count").textContent, "1 ITEM");
  assert.ok(descendants(app.element("results")).some((node) => node.tag === "pre" && node.textContent.includes("A: Ask the team.")));
});

test("a later FAQ edit clears snapshot undo so newer edits cannot be overwritten", async () => {
  const app = harness(); await makeDraft(app);
  app.element("add-item-btn").handlers.click();
  descendants(app.element("results")).find((node) => node.textContent === "Remove").handlers.click();
  assert.equal(app.element("undo-btn").disabled, false);
  const answer = descendants(app.element("results")).find((node) => node.tag === "textarea");
  answer.value = "Keep this newer edit."; answer.handlers.input();
  assert.equal(app.element("undo-btn").disabled, true);
  app.element("undo-btn").handlers.click();
  assert.equal(answer.value, "Keep this newer edit.");
  assert.equal(app.element("faq-count").textContent, "1 ITEM");
});

test("editing questions updates both similarity flags without closing the source excerpt", async () => {
  const app = harness(); await makeDraft(app);
  app.element("add-item-btn").handlers.click();
  const source = descendants(app.element("results")).find((node) => node.className === "source-details");
  source.open = true;
  const questions = descendants(app.element("results")).filter((node) => node.className === "faq-edit-question");
  questions[1].value = questions[0].value; questions[1].handlers.input();
  assert.equal(descendants(app.element("results")).filter((node) => node.className === "similar-review").length, 2);
  questions[0].value = "When does the agreement end?"; questions[0].handlers.input();
  assert.equal(descendants(app.element("results")).filter((node) => node.className === "similar-review").length, 0);
  assert.ok(descendants(app.element("results")).includes(source));
  assert.equal(source.open, true);
});

test("a delayed file read cannot replace text typed after the import began", async () => {
  const app = harness();
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const input = app.element("file-input");
  input.files = [{name: "old.txt", size: 10, text: () => pending}];
  const importing = input.handlers.change({target: input});
  app.element("source-text").value = "Newer text.";
  app.element("source-text").handlers.input();
  finish("Older imported text."); await importing;
  assert.equal(app.element("source-text").value, "Newer text.");
});

test("invalid project files leave the current source and FAQs untouched", async () => {
  const app = harness(); await makeDraft(app);
  const input = app.element("project-input");
  input.files = [{size: 12, text: async () => "{broken"}];
  await input.handlers.change({target: input});
  assert.equal(app.element("faq-count").textContent, "1 ITEM");
  assert.equal(app.element("source-text").value, "Q: Where is support?\nA: Ask the team.");
  assert.equal(app.element("status").className, "status error");
});
