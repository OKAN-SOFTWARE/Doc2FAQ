# Browser demo and website deployment

The public-facing homepage route is `https://okantiktas.com/projects/doc2faq/`. Its **interactive demo** lives at `https://okantiktas.com/projects/doc2faq/demo/`. The portfolio's existing singular convention, `/project/doc2faq/`, redirects to the product homepage. The approved light, outlined, illustrated design is documented in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## What visitors can try

| Capability | Browser demo | Java app from current source |
| --- | --- | --- |
| Paste text, import TXT/Markdown | Yes; all drafting runs in the browser | Yes; drafts processed by local Java server |
| Extract explicit Q&A | Simplified JavaScript rules | Java extraction service |
| Suggest questions from sections | Simplified Markdown-heading rules | Java generation service, with broader heuristics |
| Source viewer, editing, reorder, duplicate review | Shared frontend | Yes |
| Approval status, search, filters | Shared frontend | Yes |
| Saved projects and optional browser autosave | Yes; schemas 1/2 read, schema 2 saved | Yes |
| Markdown/JSON/HTML export | Browser downloads | Browser downloads |
| PDF/DOCX import and export | Yes; browser PDF.js / Word XML extraction and PDF-LIB / docx exports | Yes; PDFBox / Apache POI |
| OCR, external AI, accounts/billing | No | Not implemented |

PDF and Word files are processed on the visitor's device. PDF import is limited to 5 MB, 50 pages and 50,000 extracted characters; DOCX import is limited to 5 MB, 50,000 extracted characters, 1,000 archive entries and an 8 MB expanded main XML part. Legacy `.doc`, password-protected PDFs and image-only/scanned PDFs are not supported. Word extraction reads main-document paragraphs and tables, mapping standard Heading 1–6 styles to Markdown section headings (levels 2–6) so the generator treats Heading 1 as a section rather than a document title. Headers/footers, images and complex layouts may not be retained. Browser PDF export **embeds bundled DejaVu Sans regular/bold font subsets** for Turkish, extended Latin, IPA and many mathematical symbols. If a font still cannot display a character, the app recommends Word rather than silently dropping it. Word exports preserve Unicode. Both exports include every FAQ regardless of filters and optionally include source references.

The demo demonstrates the review workflow; it is not a hosted Java backend and does not claim identical generation results. Its development features may be newer than the latest published JAR. No pasted text is sent to an FAQ server. Optional autosave and downloaded project files contain source text; clear saved data on shared devices. Normal website hosting still serves the page and assets. The document adapter lazily loads version-pinned PDF.js, PDF-LIB, fontkit, JSZip and docx code from jsDelivr. DejaVu fonts are **served by the same website**, not downloaded from a third-party font service. An internet connection is needed on first use; load failures leave the workspace available for retry. See [third-party libraries](../web-demo/THIRD-PARTY.md).

## Build and keep it synchronized

Run from the repository root with Node.js:

```sh
node --test src/test/js/*.test.cjs
node scripts/build-website.mjs
```

The builder creates ignored `demo-dist/` from the actual app frontend, shared project validator, stylesheet, and background. It replaces backend requests with the browser-only adapter in `web-demo/engine.js`, routes document import and binary export through `web-demo/documents.js`, keeps PDF/Word options available, uses relative asset paths with content-hash cache versions, fills the source-build version, and adds demo disclosure and homepage/source/download links. The approved retro theme also styles the Java application's UI without changing its JavaScript behavior.

The `build-website.mjs` step then creates ignored `website-dist/` containing the approved **Doc2FAQ marketing homepage** and the working, equally styled `demo/` subdirectory. It rewrites navigation to relative URLs that are valid under `/projects/doc2faq/`.

Copy the complete contents of **`website-dist/`** into `projects/doc2faq/` in the private `OKAN-SOFTWARE/okantiktas.com` repository. Preserve the `demo/` subdirectory and relative filenames. The Doc2FAQ homepage card may link to the new product homepage. Keep `/project/doc2faq/index.html` as a redirect with a visible fallback link. Do not replace the rest of the portfolio or its activity scripts.

The portfolio is hosted through its existing GitHub-main → Hostinger deployment. Pushing source and observing a live deployment are separate steps: verify the actual custom-domain route after deployment before reporting it live. Do not deploy the full Java app to static hosting or change DNS to add this subdirectory.

## Verify before publishing

- Both homepage routes and the `/projects/doc2faq/demo/` application resolve; source, download and return links work.
- Examples and pasted TXT/Markdown work in both modes; text source references match exactly.
- Source highlights remain stable while typing, including on mobile.
- Approvals persist after save/open and optional autosave/reload; edits/merges reset approval.
- Search and status filters combine; downloads and previews retain all FAQs.
- Import real PDF and Word files, then export and open PDF and Word downloads. Check page breaks, references, long tokens, Unicode Word text, and PDF glyph errors.
- Invalid, oversized, protected, scanned and excessive-page files are rejected without replacing the current workspace. Clear or edit during processing to confirm late results/downloads are discarded.
- No document content becomes executable HTML; no FAQ requests go to a server.
- Check desktop, narrow-screen controls, keyboard navigation, and reduced-motion behavior.
