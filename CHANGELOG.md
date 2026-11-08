# Changelog

All notable Doc2FAQ changes are recorded here. Version numbers follow semantic versioning; entries describe shipped source functionality and do not imply an external AI service.

## [0.5.0] — Unreleased (release candidate)

### Added
- Browser PDF/Word (.docx) import and paginated export with local processing, PDF page/file/text limits, bounded DOCX XML decompression, optional references, and clear unsupported-file/font errors.
- Browser-only website demo built from the shared frontend, with simplified text drafting, explicit PDF/Word limitations, homepage navigation, and text exports.
- Approved Doc2FAQ landing page and matching browser/Java workbench theme, with original document mascot, responsive illustrated cards, accessible focus styles, reduced-motion support, and a reproducible `website-dist/` build. The homepage includes a "What's new" release-notes preview, clearly labeled as unreleased.
- Source & Review user guide and current documentation for development builds, schema compatibility, and v0.5.0 release preparation.
- Read-only source viewer highlighting the selected FAQ's exact original passages, with a stacked layout on narrow screens.
- Per-FAQ Needs review / Approved status, persisted in saved projects and optional browser autosave.
- Combined question/answer search and review-status filters, visible result counts, and Clear filters.

### Changed
- Editing questions or answers and merging FAQs reset approval; incomplete FAQs cannot be approved.
- Project schema 2 stores review status and upgrades schema-1 projects with Needs review defaults. Older application versions reject schema-2 files instead of silently discarding approval state.
- Filters affect only the review list; saving, export preview, and all export formats retain every FAQ in draft order.
- Export formats now open with PDF first and Word (.docx) second; the default download name uses `.pdf`.
- GitHub Actions now uses Node 24-based checkout/setup-java actions and pins Ubuntu 24.04 to avoid runner-label migration notices.
- The v0.5.0 release gate validates **Java 21–26** with Java 21-compatible bytecode. Java 27 formal support is deferred, not declared incompatible: a transient JDK-download HTTP 504 caused an initial CI failure, and a later rerun **passed Java 27 build/tests and packaged-JAR smoke checks**.
- Release-candidate source version is 0.5.0; v0.4.0 remains the published release until the new artifacts are validated and released.

## 0.4.0 — 2026-10-29

### Added

- Cursor-responsive ambient background with reduced-motion and page-visibility support.
- Document title help, separate editable download filename, and Save work labels that explain how to resume edits.
- Clear document control that also removes the saved source and discards late imports, FAQ responses, and exports.
- Original source filename defaults such as `TEst Data.pdf` to `testdata-Doc2FAQ.pdf`, preserved in saved work and supported by export response headers.

- Versioned project files that save/reopen source text, title, FAQ edits/order, original excerpts, and review choices, including incomplete entries.
- Optional browser autosave/restore with clear saved data controls; saving is off by default.
- Exact source excerpts and extracted-text line references for both drafting modes, with edited-answer labels.
- Similar-question review, keep/merge controls, and undo for removals/merges. Merges retain the original references.
- PDF and DOCX downloads with title metadata, page numbers, Unicode font support, optional references, and validated input limits.
- Safe content preview and configurable titles for all exports.
- Project/schema/merge tests, source-reference tests, and export API tests for Unicode, pagination, validation, and unsupported PDF glyphs.

### Changed

- PDF uses embedded Lato Regular/Bold fonts and a centered title; PDF and Word exports omit the FAQ-count subtitle.

- Distinct answers under the same topic or question are retained for manual review instead of silently discarded. Exact question/answer duplicates remain filtered; the draft cap remains 30.
- Answer editing now supports up to 50,000 characters, consistent with imported text.
- Pending draft results are invalidated when draft entries are edited, added, moved, removed, merged, or restored. Delayed file imports cannot replace newer source/project changes.

### Fixed

- Show the full build version in the preview heading and footer, populated from `pom.xml` during the Maven build so future releases stay in sync.

## 0.3.1

### Fixed

- Avoid excessive regex backtracking on whitespace-heavy input in both FAQ modes.
- Discard pending draft results and errors after the source, example, imported text, or mode changes.
- Preserve separate client and provider responsibility suggestions while still filtering duplicates for the same party.

### Changed

- Replaced the document placeholder with neutral Q&A prompts and the Generate Mode sample with a team knowledge guide, removing payment and fee examples from the interface.
- Added instructions for rebuilding and restarting the versioned JAR, handling occupied ports, and publishing the matching release artifact.

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
