"use strict";

const MAX_CHARS = 20_000;
const MAX_TEXT_FILE_BYTES = 80_000;
const MAX_UPLOAD_FILE_BYTES = 2 * 1024 * 1024;
const example = [
  "## What is Doc2FAQ?",
  "Doc2FAQ extracts explicit questions and answers from Markdown or plain text.",
  "",
  "## Does this preview use AI?",
  "No. This preview uses deterministic extraction and does not call an AI service.",
  "",
  "Q: Can I review answers before sharing?",
  "A: Yes. Inspect the generated draft, search it, and export only when ready.",
  "",
  "## What formats are supported?",
  "Text, Markdown, PDF, and DOCX files are supported in this version."
].join("\n");

const $ = (id) => document.getElementById(id);
const source = $("source-text");
const status = $("status");
const search = $("search-input");
const results = $("results");
const count = $("faq-count");
const generate = $("generate-btn");
const copy = $("copy-btn");
const download = $("download-btn");
let items = [];

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = "status" + (kind ? " " + kind : "");
}

function updateCount() {
  $("char-count").textContent = source.value.length.toLocaleString() + " / 20,000 characters";
}

function render() {
  const term = search.value.trim().toLocaleLowerCase();
  const shown = items.filter((item) =>
    (item.question + " " + item.answer).toLocaleLowerCase().includes(term));
  results.replaceChildren();
  count.textContent = items.length + (items.length === 1 ? " ITEM" : " ITEMS");

  if (!items.length || !shown.length) {
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
    const card = document.createElement("details");
    card.className = "faq-item";
    const question = document.createElement("summary");
    question.textContent = item.question;
    const answer = document.createElement("p");
    answer.textContent = item.answer;
    card.append(question, answer);
    results.append(card);
  }
}

function markdown() {
  return "# FAQ draft\n\n" + items.map((item) =>
    "## " + item.question + "\n\n" + item.answer).join("\n\n") + "\n";
}

function clearDraft() {
  items = [];
  search.value = "";
  search.disabled = true;
  copy.disabled = true;
  download.disabled = true;
  render();
}

source.addEventListener("input", () => {
  updateCount();
  clearDraft();
});
search.addEventListener("input", render);

$("sample-btn").addEventListener("click", () => {
  source.value = example;
  updateCount();
  clearDraft();
  source.focus();
  setStatus("Example loaded. Choose “Create FAQ draft” to preview it.");
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
      ? "Text file is too large. The limit is 80 KB."
      : "PDF and DOCX files must not exceed 2 MB.", "error");
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
        method: "POST",
        body
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Could not read this document.");
      }
      text = data.text;
    }
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("No usable text found. Scanned PDFs need OCR.");
    }
    if (text.length > MAX_CHARS) {
      throw new Error("Extracted text exceeds 20,000 characters.");
    }
    source.value = text;
    updateCount();
    clearDraft();
    setStatus("Loaded " + file.name + ". Review the extracted text, then create your FAQ draft.", "success");
  } catch (error) {
    setStatus(error.message || "Could not read the selected file.", "error");
  } finally {
    input.disabled = false;
  }
});

generate.addEventListener("click", async () => {
  const content = source.value;
  if (!content.trim()) {
    setStatus("Add some question headings and answers first.", "error");
    source.focus();
    return;
  }
  if (content.length > MAX_CHARS) {
    setStatus("Document text exceeds the 20,000-character limit.", "error");
    return;
  }

  generate.disabled = true;
  generate.textContent = "Creating draft…";
  setStatus("Extracting explicit question and answer pairs…");
  try {
    const response = await fetch("/api/faqs/preview", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({content})
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Could not generate a preview.");
    }
    items = Array.isArray(data.items) ? data.items : [];
    search.value = "";
    search.disabled = !items.length;
    copy.disabled = !items.length;
    download.disabled = !items.length;
    render();
    setStatus(items.length
      ? "Extracted " + items.length + " FAQ item(s). Review each answer before sharing."
      : "No complete Q&A pairs found. Try a Markdown question heading followed by an answer.",
      items.length ? "success" : "");
  } catch (error) {
    setStatus(error.message || "The preview service is unavailable.", "error");
  } finally {
    generate.disabled = false;
    generate.textContent = "Create FAQ draft ↗";
  }
});

copy.addEventListener("click", async () => {
  if (!items.length) return;
  try {
    await navigator.clipboard.writeText(markdown());
    setStatus("FAQ draft copied. Review it before publishing.", "success");
  } catch {
    setStatus("Clipboard unavailable. Use Download .md instead.", "error");
  }
});

download.addEventListener("click", () => {
  if (!items.length) return;
  const blob = new Blob([markdown()], {type: "text/markdown;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "doc2faq-draft.md";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Downloaded your Markdown draft.", "success");
});

updateCount();
