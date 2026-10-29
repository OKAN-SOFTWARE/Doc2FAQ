"use strict";

const MAX_CHARS = 50_000;
const MAX_TEXT_FILE_BYTES = 256_000;
const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ITEMS = 30;
const projectTools = globalThis.Doc2FaqProject;
const SAVE_KEY = "doc2faq.project.v1";
const AUTOSAVE_KEY = "doc2faq.autosave";

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
let sourceName = "Pasted text";
let undoHistory = [];
let saveTimer;
let importRevision = 0;
let reviewUpdaters = [];

function projectTitle() { return $("project-title").value.trim() || "FAQ draft"; }

function currentProject() {
  return {type: "doc2faq-project", schemaVersion: 1, title: projectTitle(), mode: selectedMode(),
    source: {text: source.value, name: sourceName}, items};
}

function autosave() {
  if (!$("autosave-toggle").checked) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, projectTools.serialize(currentProject()));
      $("save-status").textContent = "Saved in this browser";
    } catch {
      $("save-status").textContent = "Browser save unavailable. Download a project to keep your work.";
    }
  }, 250);
}

function remember() {
  draftRevision++;
  undoHistory.push(JSON.stringify(items));
  if (undoHistory.length > 20) undoHistory.shift();
}

function applyProject(project) {
  draftRevision++;
  importRevision++;
  source.value = project.source.text;
  sourceName = project.source.name;
  $("project-title").value = project.title;
  modeSelect.value = project.mode;
  items = project.items;
  undoHistory = [];
  search.value = "";
  updateModeText(); updateCount(); render(); autosave();
}

function restoreSavedProject() {
  try {
    if (localStorage.getItem(AUTOSAVE_KEY) !== "true") return;
    $("autosave-toggle").checked = true;
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      applyProject(projectTools.parse(saved));
      setStatus("Restored your saved project from this browser.", "success");
    }
  } catch {
    $("save-status").textContent = "Saved project could not be restored. Clear saved data or open a project file.";
  }
}

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
  copyButton.disabled = !ready || ["pdf", "docx"].includes(formatSelect.value);
  downloadButton.disabled = !ready;
  formatSelect.disabled = !hasItems;
  addButton.disabled = items.length >= MAX_ITEMS;
  $("preview-btn").disabled = !ready;
  $("undo-btn").disabled = !undoHistory.length;
  const ext = {markdown: "md", json: "json", html: "html", pdf: "pdf", docx: "docx"}[formatSelect.value] || "md";
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
  draftRevision++;
  undoHistory = [];
  [items[from], items[to]] = [items[to], items[from]];
  render(); autosave();
}

function render() {
  reviewUpdaters = [];
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
        remember();
        const found = items.indexOf(item);
        if (found !== -1) items.splice(found, 1);
        render(); autosave();
        setStatus("FAQ removed. Use Undo to restore it.", "success");
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
      draftRevision++;
      undoHistory = [];
      item.question = question.value;
      updateControls(); updateBadge();
      for (const update of reviewUpdaters) update();
      autosave();
    });

    const answerLabel = document.createElement("label");
    answerLabel.className = "field-label";
    answerLabel.htmlFor = "faq-answer-" + index;
    answerLabel.textContent = "ANSWER";
    const answer = document.createElement("textarea");
    answer.id = answerLabel.htmlFor;
    answer.className = "faq-edit-answer";
    answer.rows = 4;
    answer.maxLength = 50_000;
    answer.value = item.answer;
    answer.addEventListener("input", () => {
      draftRevision++;
      undoHistory = [];
      item.answer = answer.value;
      updateControls(); updateBadge(); autosave();
    });

    const reviewDetails = document.createElement("div");
    const badge = document.createElement("p");
    badge.className = "source-badge";
    function updateBadge() {
      badge.textContent = !item.sources.length ? "Manually added — no source reference" :
        projectTools.edited(item) ? "Edited — recheck against the source" : "Source excerpt available";
    }
    updateBadge();
    reviewDetails.append(badge);
    for (const reference of item.sources) {
      const details = document.createElement("details");
      details.className = "source-details";
      const summary = document.createElement("summary");
      summary.textContent = "Show source · " + reference.section + " · text lines " + reference.startLine + "–" + reference.endLine;
      const excerpt = document.createElement("pre");
      excerpt.textContent = reference.excerpt;
      details.append(summary, excerpt);
      reviewDetails.append(details);
    }
    const similarDetails = document.createElement("div");
    reviewDetails.append(similarDetails);
    function updateSimilarDetails() {
      similarDetails.replaceChildren();
      const related = projectTools.related(items, item);
      if (related.length) {
        const review = document.createElement("details");
        review.className = "similar-review";
        const summary = document.createElement("summary");
        summary.textContent = related.length + " similar question(s) — review details";
        review.append(summary);
        for (const other of related) {
          const row = document.createElement("div");
          const label = document.createElement("p");
          label.textContent = "FAQ " + (items.indexOf(other) + 1) + ": " + other.question;
          row.append(label,
            makeButton("Keep both", "editor-action", () => {
              draftRevision++;
              undoHistory = [];
              item.keptWith.push(other.id); other.keptWith.push(item.id);
              render(); autosave();
            }),
            makeButton("Merge into this FAQ", "editor-action", () => {
              try {
                const merged = projectTools.merge(item, other);
                remember();
                items[items.indexOf(item)] = merged;
                items.splice(items.indexOf(other), 1);
                render(); autosave();
                setStatus("Answers and source references combined. Review the result; Undo restores both FAQs.", "success");
              } catch (error) { setStatus(error.message, "error"); }
            })
          );
          review.append(row);
        }
        similarDetails.append(review);
      }
    }
    reviewUpdaters.push(updateSimilarDetails);
    updateSimilarDetails();
    card.append(heading, questionLabel, question, answerLabel, answer, reviewDetails);
    results.append(card);
  }
}

function markdown() {
  return "# " + projectTitle() + "\n\n" + items.map((item) =>
    "## " + item.question.trim() + "\n\n" + item.answer.trim() +
    ($("include-sources").checked ? "\n\n" + referenceText(item) : "")).join("\n\n") + "\n";
}

function referenceText(item) {
  const references = item.sources || [];
  const text = references.map((ref) => "Source: " + ref.section + " (text lines " + ref.startLine + "–" + ref.endLine + ").");
  if (!text.length) text.push("Manually added — no source reference.");
  if (projectTools.edited(item)) text.push("Edited question or answer — recheck against the source.");
  return text.join("\n");
}

function json() {
  return JSON.stringify({
    title: projectTitle(),
    items: items.map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
      ...($("include-sources").checked ? {sources: item.sources || [], edited: projectTools.edited(item)} : {})
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
    ($("include-sources").checked ? "      <p class=source>" + escapeHtml(referenceText(item)).replace(/\n/g, "<br>") + "</p>\n" : "") +
    "    </section>").join("\n");
  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "  <title>" + escapeHtml(projectTitle()) + "</title>\n" +
    "  <style>body{font:16px/1.6 system-ui,sans-serif;max-width:800px;margin:48px auto;padding:0 24px;color:#172233}h2{font-size:20px;margin-top:32px}.source{font-size:12px;color:#475569}p{overflow-wrap:anywhere}</style>\n</head>\n<body>\n" +
    "  <main>\n    <h1>" + escapeHtml(projectTitle()) + "</h1>\n" + entries +
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
  undoHistory = [];
  search.value = "";
  render();
}

source.addEventListener("input", () => {
  importRevision++;
  sourceName = "Pasted text";
  updateCount();
  clearDraft(); autosave();
  setStatus("Source updated. Create a new FAQ draft.");
});
search.addEventListener("input", render);
modeSelect.addEventListener("change", () => {
  updateModeText();
  clearDraft(); autosave();
  setStatus("Mode changed. Create a new draft from your document.");
});
formatSelect.addEventListener("change", updateControls);

$("sample-btn").addEventListener("click", () => {
  source.value = selectedMode() === "generate" ? generateExample : extractExample;
  importRevision++;
  sourceName = "Example document";
  updateCount();
  clearDraft(); autosave();
  source.focus();
  setStatus("Example loaded. Create your FAQ draft to preview the results.", "success");
});

addButton.addEventListener("click", () => {
  if (items.length >= MAX_ITEMS) return;
  search.value = "";
  draftRevision++;
  undoHistory = [];
  items.push(projectTools.normalizeItem({question: "", answer: ""}));
  render(); autosave();
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
  const revision = ++importRevision;
  draftRevision++;
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
      if (revision !== importRevision) return;
      if (!response.ok) throw new Error(data.message || "Could not read this document.");
      text = data.text;
    }
    if (revision !== importRevision) return;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("No usable text found. Scanned PDFs need OCR.");
    }
    if (text.length > MAX_CHARS) {
      throw new Error("Extracted text exceeds 50,000 characters.");
    }
    source.value = text;
    sourceName = file.name.slice(0, 255);
    updateCount();
    clearDraft(); autosave();
    setStatus("Loaded " + file.name + ". Review the source text, then create a draft.", "success");
  } catch (error) {
    if (revision === importRevision) setStatus(error.message || "Could not read the selected file.", "error");
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
        .slice(0, MAX_ITEMS).map(projectTools.normalizeItem)
      : [];
    undoHistory = [];
    search.value = "";
    render(); autosave();
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

downloadButton.addEventListener("click", async () => {
  if (!validDraft()) {
    setStatus("Complete all questions and answers before exporting.", "error");
    return;
  }
  const format = formatSelect.value;
  downloadButton.disabled = true;
  try {
    if (["pdf", "docx"].includes(format)) {
      const response = await fetch("/api/faqs/export/" + format, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({title: projectTitle(), includeSources: $("include-sources").checked,
          items: items.map((item) => ({question: item.question.trim(), answer: item.answer.trim(),
            sources: item.sources.map(({section, startLine, endLine}) => ({section, startLine, endLine})),
            edited: projectTools.edited(item)}))})
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Export failed. Please try again.");
      }
      downloadBlob(await response.blob(), "doc2faq-draft." + format);
    } else {
      const {text, ext, mime} = exportData();
      downloadBlob(new Blob([text], {type: mime + ";charset=utf-8"}), "doc2faq-draft." + ext);
    }
    setStatus("Downloaded your " + format.toUpperCase() + " FAQ draft.", "success");
  } catch (error) { setStatus(error.message || "Download unavailable.", "error"); }
  finally { updateControls(); }
});

$("project-title").addEventListener("input", autosave);
$("open-project-btn").addEventListener("click", () => $("project-input").click());
$("choose-file-btn").addEventListener("click", () => $("file-input").click());
$("save-project-btn").addEventListener("click", () => {
  try {
    downloadBlob(new Blob([projectTools.serialize(currentProject())], {type: "application/json;charset=utf-8"}), "doc2faq-project.json");
    $("save-status").textContent = "Project downloaded";
    setStatus("Project saved with source text, edits, and review choices.", "success");
  } catch (error) { setStatus(error.message, "error"); }
});
$("project-input").addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > projectTools.MAX_PROJECT_BYTES) { setStatus("Project files must not exceed 4 MB.", "error"); return; }
  const revision = ++importRevision;
  try {
    const project = projectTools.parse(await file.text());
    if (revision !== importRevision) return;
    if ((source.value || items.length) && !globalThis.confirm("Open this project and replace the current workspace? Save your current project first if needed.")) return;
    applyProject(project);
    setStatus("Project opened. Your edits and references are ready.", "success");
  } catch (error) { if (revision === importRevision) setStatus(error.message, "error"); }
});
$("autosave-toggle").addEventListener("change", () => {
  try {
    if ($("autosave-toggle").checked) {
      localStorage.setItem(AUTOSAVE_KEY, "true"); autosave();
    } else {
      clearTimeout(saveTimer);
      localStorage.removeItem(AUTOSAVE_KEY); localStorage.removeItem(SAVE_KEY);
      $("save-status").textContent = "Autosave off";
    }
  } catch { $("save-status").textContent = "Browser storage unavailable. Use Save project."; }
});
$("clear-saved-btn").addEventListener("click", () => {
  clearTimeout(saveTimer);
  try {
    localStorage.removeItem(SAVE_KEY); localStorage.removeItem(AUTOSAVE_KEY);
    $("autosave-toggle").checked = false;
    $("save-status").textContent = "Saved data cleared; current workspace stays open";
  } catch { $("save-status").textContent = "Could not clear browser storage."; }
});
$("undo-btn").addEventListener("click", () => {
  if (!undoHistory.length) return;
  draftRevision++;
  items = JSON.parse(undoHistory.pop());
  render(); autosave();
  setStatus("Previous removal or merge undone.", "success");
});
$("preview-btn").addEventListener("click", () => {
  if (!validDraft()) return;
  const content = $("preview-content");
  content.replaceChildren();
  const title = document.createElement("h1"); title.textContent = projectTitle(); content.append(title);
  for (const item of items) {
    const heading = document.createElement("h2"); heading.textContent = item.question;
    const answer = document.createElement("p"); answer.textContent = item.answer;
    content.append(heading, answer);
    if ($("include-sources").checked) {
      const reference = document.createElement("p"); reference.className = "preview-source";
      reference.textContent = referenceText(item); content.append(reference);
    }
  }
  $("export-preview").showModal();
});
$("close-preview-btn").addEventListener("click", () => $("export-preview").close());

restoreSavedProject();
updateModeText();
updateCount();
render();
