/* Shared project validation and review logic, with no DOM or dependencies. */
(function (root) {
  "use strict";
  const MAX_PROJECT_BYTES = 4 * 1024 * 1024;
  let sequence = 0;
  const id = () => "faq-" + Date.now().toString(36) + "-" + (++sequence).toString(36);
  const lines = (text) => text.split(/\r\n|[\n\r\v\f\u0085\u2028\u2029]/);
  const fail = (message) => { throw new Error(message); };
  function string(value, max, label) {
    if (typeof value !== "string" || value.length > max) fail("Invalid " + label + ".");
    return value;
  }
  function normalizeItem(item) {
    return {
      id: item.id || id(), question: item.question, answer: item.answer,
      originalQuestion: item.originalQuestion ?? item.question,
      originalAnswer: item.originalAnswer ?? item.answer,
      sources: item.sources || (item.source ? [item.source] : []),
      keptWith: item.keptWith || [], edited: item.edited === true
    };
  }
  function edited(item) {
    return item.edited === true || item.question !== item.originalQuestion || item.answer !== item.originalAnswer;
  }
  function sourceTitle(name) {
    return name.split(/[\\/]/).pop().replace(/\.[^.]+$/, "").trim().slice(0, 200) || "FAQ draft";
  }
  function defaultDownloadName(name) {
    const stem = sourceTitle(name).normalize("NFKC").toLowerCase()
      .replace(/-doc2faq$/i, "").replace(/[^\p{L}\p{N}._-]/gu, "").replace(/^\.+|\.+$/g, "").slice(0, 160);
    return (stem || "document") + "-Doc2FAQ";
  }
  function downloadFilename(name, format) {
    const ext = {markdown: "md", json: "json", html: "html", pdf: "pdf", docx: "docx"}[format] || "md";
    let stem = (name || "").trim().replace(/\.(pdf|docx|md|json|html)$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "-").replace(/^\.+|[. ]+$/g, "").slice(0, 180);
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) stem = "document-" + stem;
    return (stem || "document-Doc2FAQ") + "." + ext;
  }
  function validateProject(project) {
    if (!project || project.type !== "doc2faq-project" || project.schemaVersion !== 1) {
      fail("Choose a supported Doc2FAQ project file (schema version 1).");
    }
    const title = string(project.title, 200, "project title");
    if (!["extract", "generate"].includes(project.mode)) fail("Invalid project mode.");
    const text = string(project.source?.text, 50000, "source text");
    const name = string(project.source?.name, 255, "source filename");
    const downloadName = string(project.downloadName ?? defaultDownloadName(name), 180, "download filename");
    if (!Array.isArray(project.items) || project.items.length > 30) fail("A project can contain at most 30 FAQs.");
    const sourceLines = lines(text);
    const ids = new Set();
    let answerCharacters = 0;
    const items = project.items.map((raw) => {
      if (!raw || typeof raw !== "object") fail("Invalid FAQ entry.");
      const itemId = string(raw.id, 100, "FAQ identifier");
      if (!itemId || ids.has(itemId)) fail("FAQ identifiers must be unique.");
      ids.add(itemId);
      const question = string(raw.question, 500, "FAQ question");
      const answer = string(raw.answer, 50000, "FAQ answer");
      answerCharacters += question.length + answer.length;
      const originalQuestion = string(raw.originalQuestion, 50000, "original question");
      const originalAnswer = string(raw.originalAnswer, 50000, "original answer");
      if (!Array.isArray(raw.sources) || raw.sources.length > 30) fail("Invalid source references.");
      const sources = raw.sources.map((reference) => {
        if (!reference || typeof reference !== "object") fail("Invalid source reference.");
        const section = string(reference.section, 50000, "source section");
        const excerpt = string(reference.excerpt, 50000, "source excerpt");
        const {startLine, endLine} = reference;
        if (!Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 ||
            endLine < startLine || endLine > sourceLines.length || !excerpt ||
            sourceLines.slice(startLine - 1, endLine).join("\n") !== excerpt) {
          fail("A source reference does not match the project's document text.");
        }
        return {section, startLine, endLine, excerpt};
      });
      if (!Array.isArray(raw.keptWith) || raw.keptWith.length > 30 ||
          raw.keptWith.some((value) => typeof value !== "string" || value.length > 100)) fail("Invalid review choices.");
      return {id: itemId, question, answer, originalQuestion, originalAnswer, sources,
        keptWith: [...raw.keptWith], edited: raw.edited === true};
    });
    if (answerCharacters > 300000) fail("FAQ text must not exceed 300,000 characters.");
    for (const item of items) item.keptWith = item.keptWith.filter((key) => ids.has(key) && key !== item.id);
    return {type: "doc2faq-project", schemaVersion: 1, title, downloadName, mode: project.mode, source: {text, name}, items};
  }
  function serialize(project) {
    const text = JSON.stringify(validateProject(project), null, 2) + "\n";
    if (new TextEncoder().encode(text).length > MAX_PROJECT_BYTES) fail("Project files must not exceed 4 MB.");
    return text;
  }
  function parse(text) {
    if (new TextEncoder().encode(text).length > MAX_PROJECT_BYTES) fail("Project files must not exceed 4 MB.");
    let data;
    try { data = JSON.parse(text); } catch { fail("This file is not valid JSON."); }
    return validateProject(data);
  }
  function words(question) {
    return new Set(question.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  }
  function similar(a, b) {
    const first = words(a), second = words(b);
    if (!first.size || !second.size) return false;
    for (const party of ["client", "provider"]) {
      if (first.has(party) !== second.has(party)) return false;
    }
    const shared = [...first].filter((word) => second.has(word)).length;
    return shared / (first.size + second.size - shared) >= 0.7;
  }
  function related(items, item) {
    return items.filter((other) => other !== item && !item.keptWith.includes(other.id) &&
      !other.keptWith.includes(item.id) && similar(item.question, other.question));
  }
  function merge(first, second) {
    const answer = first.answer.trim() === second.answer.trim() ? first.answer :
      [first.answer.trim(), second.answer.trim()].filter(Boolean).join("\n\n");
    if (answer.length > 50000) fail("The merged answer would exceed 50,000 characters. Shorten it first.");
    const sources = [...first.sources];
    for (const source of second.sources) {
      if (!sources.some((saved) => saved.startLine === source.startLine && saved.endLine === source.endLine &&
          saved.excerpt === source.excerpt)) sources.push({...source});
    }
    if (sources.length > 30) fail("The merged FAQ would have too many source references.");
    return {...first, answer, sources, keptWith: [], edited: true};
  }
  const api = {MAX_PROJECT_BYTES, normalizeItem, edited, sourceTitle, defaultDownloadName, downloadFilename,
    validateProject, serialize, parse, similar, related, merge};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Doc2FaqProject = api;
})(globalThis);
