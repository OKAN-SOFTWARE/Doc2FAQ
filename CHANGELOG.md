# Changelog

All notable Doc2FAQ changes are recorded here. Version numbers follow semantic versioning; entries describe shipped source functionality and do not imply an external AI service.

## 0.3.0

### Added

- **Extract Mode** for existing Markdown question headings and explicit Q:/A: pairs.
- **Generate Mode** for source-grounded FAQ suggestions from document sections. Generation is local and deterministic, not powered by a paid AI provider.
- In-browser FAQ editor for changing questions and answers, reordering items, removing duplicates, and adding new entries.
- Markdown, JSON, and standalone HTML exports, with HTML content escaped for safety.
- Windows Command Prompt instructions for installing Java 21 and Maven, configuring PATH, and troubleshooting local startup.
- Java service and API integration tests for generation, limits, and validation, plus Node tests for export safety.

### Improved

- Expanded FAQ text validation to **50,000 characters**, consistent with extraction and the browser.
- Generate Mode filters common-topic duplicates, document-title headings, and existing FAQ appendices.
- More natural question phrasing for client responsibilities, confidentiality, and intellectual-property ownership.
- Existing Extract Mode behavior remains unchanged when a document contains explicit FAQ pairs.

### Supported inputs and limits

- TXT and Markdown uploads in the browser (256 KB file size).
- PDF and DOCX uploads via the Java server (5 MB each).
- Maximum 50 PDF pages, 50,000 extracted characters, and 30 FAQ items.

### Known limitations

- Scanned or image-only PDFs require OCR before import; OCR is not included.
- Generate Mode is heuristic and may skip useful details or produce generic questions. Review every answer.
- No accounts, paid plans, public-server hardening, or document persistence are included.
- PDF and DOCX **export** are planned for a future release. The current outputs are Markdown, JSON, and HTML.

## 0.2.0

- Added PDF and DOCX text import using Apache PDFBox and Apache POI.
- Introduced format-signature validation and explicit errors for unsupported, empty, encrypted, or scanned documents.
- Added document upload size and page/text extraction limits.
- Preserved local, deterministic explicit-Q&A extraction.
