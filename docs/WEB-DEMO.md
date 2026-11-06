# Browser demo and website deployment

The public-facing route is `https://okantiktas.com/projects/doc2faq/`. The portfolio's existing singular convention, `/project/doc2faq/`, redirects to it. The homepage's Doc2FAQ card links to the interactive demo.

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
| PDF/DOCX import and export | Use the downloadable app | Yes |
| OCR, external AI, accounts/billing | No | Not implemented |

The demo demonstrates the review workflow; it is not a hosted Java backend and does not claim identical generation results. Its development features may be newer than the latest published JAR. No pasted text is sent to an FAQ server. Optional autosave and downloaded project files contain source text; clear saved data on shared devices. Normal website hosting still serves the page and assets.

## Build and keep it synchronized

Run from the repository root with Node.js:

```sh
node --test src/test/js/*.test.cjs
node scripts/build-web-demo.mjs
```

The builder creates ignored `demo-dist/` from the actual app frontend, shared project validator, stylesheet, and background. It replaces backend requests with the browser-only adapter in `web-demo/engine.js`, limits uploads to TXT/Markdown, removes binary export choices, uses relative asset paths, fills the source-build version, and adds demo disclosure and homepage/source/download links. It does not modify the Java application's served UI.

Copy the complete contents of `demo-dist/` into `projects/doc2faq/` in the private `OKAN-SOFTWARE/okantiktas.com` repository. Preserve relative filenames. Update the Doc2FAQ homepage card to the demo route. Keep `/project/doc2faq/index.html` as a redirect with a visible fallback link. Do not replace the rest of the portfolio or its activity scripts.

The portfolio is hosted through its existing GitHub-main → Hostinger deployment. Pushing source and observing a live deployment are separate steps: verify the actual custom-domain route after deployment before reporting it live. Do not deploy the full Java app to static hosting or change DNS to add this subdirectory.

## Verify before publishing

- Both demo routes resolve; homepage, source, and download links work.
- Examples and pasted TXT/Markdown work in both modes; text source references match exactly.
- Source highlights remain stable while typing, including on mobile.
- Approvals persist after save/open and optional autosave/reload; edits/merges reset approval.
- Search and status filters combine; downloads and previews retain all FAQs.
- Invalid/oversized files are rejected and PDF/Word requests explain how to use the local app.
- No document content becomes executable HTML; no FAQ requests go to a server.
- Check desktop, narrow-screen controls, keyboard navigation, and reduced-motion behavior.
