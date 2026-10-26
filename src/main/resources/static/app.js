"use strict";

const MAX_CHARS = 50_000;
const MAX_TEXT_FILE_BYTES = 256_000;
const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ITEMS = 30;

const extractExample = [
  "## What is Doc2FAQ?",
  "Doc2FAQ creates reviewable FAQ drafts from documents.",
  "",
  "## Which files are supported?",
  "TXT, Markdown, PDF, and DOCX files are supported.",
  "",
  "Q: Does it call an AI provider?",
  "A: No. Both modes use local, deterministic processing."
].join("\n");
const generateExample = [
  "# Team Knowledge Guide",
  "",
  "## Services",
  "The team provides onboarding guides, project templates, and a shared knowledge base.",
  "",
  "## Team Responsibilities",
  "Team members keep project notes current and review shared documents for clarity.",
  "",
  "## Knowledge Sharing",
  "Useful examples and project decisions are collected in the shared notes.",
  "",
  "## Support",
  "Ask questions in the team channel and include the steps needed to reproduce a problem."
].join("\n");

const $ = (id) => document.getElementById(id);
const source = $("source-text");
const status = $("status");
const search = $("search-input");
const results = $("results");
const count = $("faq-count");
const draftButton = $("generate-btn");
const copyButton = $("copy-btn");
const downloadButton = $("download-btn");
const formatSelect = $("export-format");
const addButton = $("add-item-btn");
const modeSelect = $("draft-mode");
let items = [];
let draftRevision = 0;

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = "status" + (kind ? " " + kind : "");
}

function selectedMode() {
  return modeSelect.value === "generate" ? "generate" : "extract";
}

function updateCount() {
  $("char-count").textContent = source.value.length.toLocaleString() + " / 50,000 characters";
}

function updateModeText() {
  const generating = selectedMode() === "generate";
  $("mode-description").textContent = generating
    ? "Generate source-grounded questions from headings and document passages. Local rules only; review each answer."
    : "Extract questions already written in the document, such as Markdown question headings or Q:/A: pairs.";
  $("results-intro").textContent = generating
    ? "Questions are suggested from the source text without an AI service. Edit and verify before sharing."
    : "Explicit questions and their written answers are extracted. Edit and verify before sharing.";
  draftButton.textContent = generating ? "Generate FAQ draft ↗" : "Extract FAQ draft ↗";
}

function validDraft() {
  return items.length > 0 && items.every((item) =>
    typeof item.question === "string" && item.question.trim() &&
    typeof item.answer === "string" && item.answer.trim());
}

function updateControls() {
  const hasItems = items.length > 0;
  const ready = validDraft();
  search.disabled = !hasItems;
  copyButton.disabled = !ready;
  downloadButton.disabled = !ready;
  formatSelect.disabled = !hasItems;
  addButton.disabled = items.length >= MAX_ITEMS;
  const ext = {markdown: "md", json: "json", html: "html"}[formatSelect.value] || "md";
  downloadButton.textContent = "Download ." + ext;
  count.textContent = items.length + (items.length === 1 ? " ITEM" : " ITEMS");
}

function makeButton(label, className, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}

function move(item, offset) {
  const from = items.indexOf(item);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= items.length) return;
  [items[from], items[to]] = [items[to], items[from]];
  render();
}

function render() {
  const term = search.value.trim().toLocaleLowerCase();
  const shown = items.filter((item) =>
    (item.question + " " + item.answer).toLocaleLowerCase().includes(term));
  results.replaceChildren();
  updateControls();

  if (!shown.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "?";
    const title = document.createElement("h4");
    title.textContent = items.length ? "No matching answers." : "Your answers will appear here.";
    const hint = document.createElement("p");
    hint.textContent = items.length
      ? "Try a different search term."
      : "Load the example or add text on the left, then create your first draft.";
    empty.append(icon, title, hint);
    results.append(empty);
    return;
  }

  for (const item of shown) {
    const index = items.indexOf(item);
    const card = document.createElement("section");
    card.className = "faq-editor";

    const heading = document.createElement("div");
    heading.className = "faq-editor-heading";
    const number = document.createElement("span");
    number.className = "faq-editor-index";
    number.textContent = "FAQ " + String(index + 1).padStart(2, "0");
    const cardActions = document.createElement("div");
    cardActions.className = "faq-editor-actions";
    cardActions.append(
      makeButton("↑", "editor-action", () => move(item, -1), index === 0),
      makeButton("↓", "editor-action", () => move(item, 1), index === items.length - 1),
      makeButton("Remove", "editor-action editor-remove", () => {
        const found = items.indexOf(item);
        if (found !== -1) items.splice(found, 1);
        render();
        setStatus("FAQ item removed. Changes are in this browser session.", "success");
      })
    );
    heading.append(number, cardActions);

    const questionLabel = document.createElement("label");
    questionLabel.className = "field-label";
    questionLabel.htmlFor = "faq-question-" + index;
    questionLabel.textContent = "QUESTION";
    const question = document.createElement("input");
    question.id = questionLabel.htmlFor;
    question.className = "faq-edit-question";
    question.type = "text";
    question.maxLength = 500;
    question.value = item.question;
    question.addEventListener("input", () => {
      item.question = question.value;
      updateControls();
    });

    const answerLabel = document.createElement("label");
    answerLabel.className = "field-label";
    answerLabel.htmlFor = "faq-answer-" + index;
    answerLabel.textContent = "ANSWER";
    const answer = document.createElement("textarea");
    answer.id = answerLabel.htmlFor;
    answer.className = "faq-edit-answer";
    answer.rows = 4;
    answer.maxLength = 10_000;
    answer.value = item.answer;
    answer.addEventListener("input", () => {
      item.answer = answer.value;
      updateControls();
    });

    card.append(heading, questionLabel, question, answerLabel, answer);
    results.append(card);
  }
}

function markdown() {
  return "# FAQ draft\n\n" + items.map((item) =>
    "## " + item.question.trim() + "\n\n" + item.answer.trim()).join("\n\n") + "\n";
}

function json() {
  return JSON.stringify({
    title: "FAQ draft",
    items: items.map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim()
    }))
  }, null, 2) + "\n";
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function html() {
  const entries = items.map((item) =>
    '    <section class="faq-item">\n' +
    "      <h2>" + escapeHtml(item.question.trim()) + "</h2>\n" +
    "      <p>" + escapeHtml(item.answer.trim()).replace(/\n/g, "<br>") + "</p>\n" +
    "    </section>").join("\n");
  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "  <title>FAQ draft</title>\n</head>\n<body>\n" +
    "  <main>\n    <h1>FAQ draft</h1>\n" + entries +
    "\n  </main>\n</body>\n</html>\n";
}

function exportData() {
  if (formatSelect.value === "json") return {text: json(), ext: "json", mime: "application/json"};
  if (formatSelect.value === "html") return {text: html(), ext: "html", mime: "text/html"};
  return {text: markdown(), ext: "md", mime: "text/markdown"};
}

function clearDraft() {
  draftRevision++;
  items = [];
  search.value = "";
  render();
}

source.addEventListener("input", () => {
  updateCount();
  clearDraft();
});
search.addEventListener("input", render);
modeSelect.addEventListener("change", () => {
  updateModeText();
  clearDraft();
  setStatus("Mode changed. Create a new draft from your document.");
});
formatSelect.addEventListener("change", updateControls);

$("sample-btn").addEventListener("click", () => {
  source.value = selectedMode() === "generate" ? generateExample : extractExample;
  updateCount();
  clearDraft();
  source.focus();
  setStatus("Example loaded. Create your FAQ draft to preview the results.", "success");
});

addButton.addEventListener("click", () => {
  if (items.length >= MAX_ITEMS) return;
  search.value = "";
  items.push({question: "", answer: ""});
  render();
  const field = results.querySelector(".faq-editor:last-child .faq-edit-question");
  field?.focus();
  setStatus("New FAQ added. Complete both fields to enable export.");
});

$("file-input").addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;
  input.value = "";
  const isText = /\.(txt|md)$/i.test(file.name);
  const isDocument = /\.(pdf|docx)$/i.test(file.name);
  if (!isText && !isDocument) {
    setStatus("Choose a .txt, .md, .pdf, or .docx file.", "error");
    return;
  }
  if (file.size === 0) {
    setStatus("The selected file is empty.", "error");
    return;
  }
  if (file.size > (isText ? MAX_TEXT_FILE_BYTES : MAX_UPLOAD_FILE_BYTES)) {
    setStatus(isText
      ? "Text file is too large. The limit is 256 KB."
      : "PDF and DOCX files must not exceed 5 MB.", "error");
    return;
  }

  input.disabled = true;
  setStatus(isText ? "Reading text file…" : "Extracting document text on this server…");
  try {
    let text;
    if (isText) {
      text = await file.text();
    } else {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/documents/extract", {
        method: "POST", body
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not read this document.");
      text = data.text;
    }
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("No usable text found. Scanned PDFs need OCR.");
    }
    if (text.length > MAX_CHARS) {
      throw new Error("Extracted text exceeds 50,000 characters.");
    }
    source.value = text;
    updateCount();
    clearDraft();
    setStatus("Loaded " + file.name + ". Review the source text, then create a draft.", "success");
  } catch (error) {
    setStatus(error.message || "Could not read the selected file.", "error");
  } finally {
    input.disabled = false;
  }
});

draftButton.addEventListener("click", async () => {
  const content = source.value;
  if (!content.trim()) {
    setStatus("Add document text or choose a file first.", "error");
    source.focus();
    return;
  }
  if (content.length > MAX_CHARS) {
    setStatus("Document text exceeds the 50,000-character limit.", "error");
    return;
  }

  const mode = selectedMode();
  const generating = mode === "generate";
  const revision = draftRevision;
  const isCurrentDraft = () => revision === draftRevision
    && source.value === content && selectedMode() === mode;
  draftButton.disabled = true;
  draftButton.textContent = generating ? "Generating draft…" : "Extracting pairs…";
  setStatus(generating ? "Building source-grounded FAQ suggestions…" : "Extracting explicit Q&A pairs…");
  try {
    const response = await fetch(generating ? "/api/faqs/generate" : "/api/faqs/preview", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({content})
    });
    const data = await response.json().catch(() => ({}));
    if (!isCurrentDraft()) return;
    if (!response.ok) throw new Error(data.message || "Could not create an FAQ draft.");
    items = Array.isArray(data.items)
      ? data.items.filter((item) =>
        item && typeof item.question === "string" && typeof item.answer === "string")
        .slice(0, MAX_ITEMS).map((item) => ({question: item.question, answer: item.answer}))
      : [];
    search.value = "";
    render();
    setStatus(items.length
      ? "Created " + items.length + " FAQ item(s). Edit and verify before exporting."
      : "No complete Q&A pairs found. Switch to Generate Mode for ordinary documents.",
      items.length ? "success" : "");
  } catch (error) {
    if (isCurrentDraft()) {
      setStatus(error.message || "The FAQ service is unavailable.", "error");
    }
  } finally {
    draftButton.disabled = false;
    updateModeText();
  }
});

copyButton.addEventListener("click", async () => {
  if (!validDraft()) {
    setStatus("Complete all questions and answers before exporting.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(exportData().text);
    setStatus("FAQ draft copied as " + formatSelect.value.toUpperCase() + ".", "success");
  } catch {
    setStatus("Clipboard unavailable. Use the download button instead.", "error");
  }
});

downloadButton.addEventListener("click", () => {
  if (!validDraft()) {
    setStatus("Complete all questions and answers before exporting.", "error");
    return;
  }
  const {text, ext, mime} = exportData();
  const blob = new Blob([text], {type: mime + ";charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "doc2faq-draft." + ext;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Downloaded your " + ext.toUpperCase() + " FAQ draft.", "success");
});

updateModeText();
updateCount();
render();
