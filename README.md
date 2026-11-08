# Doc2FAQ

**Turn documents into editable FAQ drafts — locally, with full control over the answers.**

Doc2FAQ is a Java 21 / Spring Boot document-to-FAQ workbench. Paste text or upload TXT, Markdown, PDF, or DOCX, then extract existing questions or create source-grounded suggestions from ordinary document sections. Review source excerpts, edit and reorder your FAQs, save a project, and export as **Markdown, JSON, HTML, PDF, or Word (DOCX)**.

Created by **Okan Tiktas** · [OKAN-SOFTWARE](https://github.com/OKAN-SOFTWARE).

> **Latest release: v0.5.0 — Source & Review.** Download the ready-to-run JAR, Windows ZIP, and checksum file from [GitHub Releases](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/tag/v0.5.0).

## New in v0.5.0 — Source & Review

I redesigned Doc2FAQ with an illustrated homepage and a responsive FAQ workbench. Visit the [product homepage](https://okantiktas.com/projects/doc2faq/) for an overview, or try the [interactive browser demo](https://okantiktas.com/projects/doc2faq/demo/) to import documents, review FAQs, and export the results directly in your browser. The browser demo and downloadable Java application have different processing engines, so their FAQ suggestions may differ. See the [v0.5.0 changes](CHANGELOG.md#050--2026-11-08) and [design system](docs/DESIGN-SYSTEM.md) for details.

- **Source beside answer:** select **View source beside answer** on an FAQ to highlight all of its original passages in a read-only document viewer beside the review editor on desktop (stacked on smaller screens). References still use extracted-text lines, not PDF page numbers. Manual FAQs have no automatic reference.
- **Review status:** FAQs start as **Needs review**. Mark a complete answer **Approved** after checking it. Editing its question or answer, or merging FAQs, returns it to **Needs review**. Moving an item preserves approval; Undo restores the status from before a removal or merge.
- **Search and review filters:** combine a case-insensitive question/answer search with **All statuses**, **Needs review**, or **Approved**. The summary shows visible, approved, and pending counts. **Clear filters** restores the full list. Filters never change what is saved, previewed, or exported: all FAQs remain included, and incomplete entries still block export.
- **Saved work compatibility:** approval status is preserved in project downloads and optional autosave. New saves use project schema 2; v0.4 schema-1 files still open with FAQs marked Needs review. Schema-2 files require v0.5 or later to reopen.

The source builds version `0.5.0` from `pom.xml` as `target/doc2faq-0.5.0.jar`. The published ZIP contains the same JAR, a Windows launcher, and a quick-start guide; release downloads also include SHA-256 checksums.

## New in v0.4.0

- **Save work / Open saved work:** a versioned JSON file preserves source text, title, mode, draft order, edits, original excerpts, and duplicate-review choices. Incomplete FAQs can be saved too. Project files are limited to 4 MB and validated before replacing the workspace.
- **Optional browser autosave:** off by default. Enabling it stores the complete source and draft on this browser's origin and restores them on reload. The highlighted **Clear saved data** button asks for confirmation before removing the browser copy; canceling preserves it, and confirming leaves your current workspace open. Disabling autosave also removes the stored copy. Storage failures leave the draft open; use **Save work** as a backup.
- **Source references:** expand **Show source** to see the original section, extracted-text line range, and exact passage. Edited questions and answers are marked for rechecking. References use text lines, not PDF page numbers; manually added FAQs have no automatic reference.
- **Duplicate review:** distinct passages are retained even if their questions cover the same topic. Similar questions are flagged using a word-overlap heuristic. Choose **Keep both** or **Merge into this FAQ**. Merging keeps both answers and all source references; **Undo removal / merge** restores the previous items until another FAQ edit, addition, reorder, or review choice. Exact duplicate question/answer pairs are still filtered. The maximum remains 30 FAQs.
- **PDF and Word export:** edited content, a centered document title, readable page layout, metadata, and page numbers. Optionally include section/line references and edited-answer notices. PDF embeds Lato Regular and Bold (see `src/main/resources/fonts/LICENSE-Lato.txt`); if text contains a glyph that font cannot represent, export returns an error and suggests DOCX.
- **Export preview:** inspect the final content before downloading. PDF and Word apply their own pagination. Markdown, JSON, and standalone HTML export remain available; binary exports use **Download**.

- **Clear document:** removes the loaded source, FAQ draft, file names, pending results, and its saved browser copy. The autosave preference is retained. A late import or export cannot bring back the cleared PDF.
- **Original filenames:** importing `TEst Data.pdf` pre-fills the document title and the download name `testdata-Doc2FAQ.pdf`. Edit **Download filename** before exporting; saved work preserves that choice. Names are sanitized for Windows and the extension follows the selected format.
- **Interactive background:** gentle particles and a cursor-responsive glow, paused while the page is hidden. Reduced-motion preferences use a still background.

## What's fixed in v0.3.1

- Whitespace-heavy input no longer causes excessive backtracking in FAQ question parsing.
- Draft responses and errors are discarded after the source or mode changes, preventing stale results from being exported.
- Client and provider responsibilities are treated as distinct topics, preserving both FAQ suggestions.

The document placeholder now uses neutral Q&A prompts, and Generate Mode's sample uses a team knowledge guide instead of payment terms.

## Features introduced in v0.3.0

- **Extract Mode:** Find explicit Markdown question headings and Q:/A: pairs; do not invent questions or answers.
- **Generate Mode:** Suggest questions from regular documents, such as service agreements, policies, and résumés, using section headings and the source's own words.
- **Review editor:** Change questions and answers, move items up or down, remove unwanted entries, or add an FAQ manually (up to 30 items).
- **Export:** Download or copy **Markdown**, **JSON**, or **standalone HTML**. HTML export escapes document content to prevent injected markup.
- **Question quality filters:** Avoids duplicate common topics, skips document titles and FAQ appendices, and uses more natural questions for responsibilities, confidentiality and ownership.
- **Consistent 50,000-character limit** across document extraction, the browser, and both FAQ API endpoints.
- **Windows CMD setup** for people who don't have Java or Maven installed, plus troubleshooting.

**Privacy and accuracy:** The current Generate Mode is **deterministic and rule-based, not a generative AI model**. No API key, paid AI service, or external model is required. Its questions are suggestions; answers come from excerpts in your source document. Similar-question flags are suggestions and can include questions you want to keep. It cannot reliably interpret every layout or guarantee an accurate summary. Always review before publishing.

## Try it in your browser

[Doc2FAQ homepage](https://okantiktas.com/projects/doc2faq/) · [Try the interactive browser demo](https://okantiktas.com/projects/doc2faq/demo/) · [Source & Review user guide](docs/USER-GUIDE.md) · [Demo capabilities and deployment](docs/WEB-DEMO.md) · [Design system](docs/DESIGN-SYSTEM.md)

The demo processes pasted text and TXT/Markdown in your browser, using simplified rules. Try both drafting modes, source highlighting, editing, approval status, duplicate review, search/filters, saved projects, and Markdown/JSON/HTML exports. PDF/Word (.docx) import and export also run locally in the browser; PDF uploads are limited to 5 MB and 50 pages, and DOCX to 5 MB. Scanned PDFs need external OCR. The demo does not run a Java backend and its drafting rules remain simplified. Document libraries load from a version-pinned CDN when needed; document content is not uploaded. Browser PDF export now embeds bundled DejaVu Sans fonts for Turkish and a wider range of Unicode characters; Word remains the fallback for unsupported scripts. The development demo may include features newer than the latest release download.

For detailed changes, see [CHANGELOG.md](CHANGELOG.md). For the release checklist, see [docs/RELEASING.md](docs/RELEASING.md).

## Requirements

- To run a release download: **Java 21 or newer**. The JAR targets Java 21 bytecode; v0.5.0's **required automated compatibility matrix is Java 21–26**. Java 27 **passed an exploratory CI build and packaged-JAR smoke test** on November 8, 2026, but is not a committed v0.5.0 support target; formal support can follow in a later release. Newer Java versions are not automatically guaranteed compatible. The JAR works on Windows, macOS, and Linux; the Windows ZIP includes `Start-Doc2FAQ.cmd` and a quick-start guide. Extract the ZIP into a new folder, stop any older Doc2FAQ process, run the launcher, and open **http://localhost:8080**. Maven and Node.js are only needed to build and test from source.

To build from source:

- Java Development Kit (**JDK 21**), not just a Java Runtime Environment.
- **Apache Maven 3.6.3 or later** (examples use Maven 3.9.16).
- Windows 10/11, macOS, or Linux, with an internet connection for the initial Maven dependency download.

Verify your tools:

```cmd
java -version
javac -version
mvn -version
```

If you're on Windows and one of these commands says **"is not recognized as an internal or external command"**, use the steps below.

## Windows 10/11 — install Java and Maven using CMD

Open **Command Prompt (CMD)**. The following commands install Java and Maven for local development. You do not need an IDE.

### 1. Install Java 21

Windows 11 usually includes the Windows Package Manager (winget):

```cmd
winget install --id EclipseAdoptium.Temurin.21.JDK --exact --accept-source-agreements --accept-package-agreements
```

**Close CMD and open a new CMD window** so Windows can pick up Java's updated PATH, then verify:

```cmd
java -version
javac -version
```

Both commands should show version **21**. If winget is unavailable, download the Java 21 JDK installer from [Eclipse Adoptium](https://adoptium.net/temurin/releases/?version=21), run it, and select the option to **add Java to PATH** during setup.

If Java is already installed but not found, restart CMD or check your JDK installation and the PATH variable. A typical location is `C:\Program Files\Eclipse Adoptium\jdk-21...\bin`.

### 2. Download Maven 3.9.16 from Apache using CMD

These commands download the official Maven ZIP to your temporary directory, then unpack it under your user profile:

```cmd
curl.exe -fL "https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip" -o "%TEMP%\apache-maven-3.9.16-bin.zip"
powershell -NoProfile -Command "Expand-Archive -LiteralPath (Join-Path $env:TEMP 'apache-maven-3.9.16-bin.zip') -DestinationPath (Join-Path $env:LOCALAPPDATA 'Programs') -Force"
```

Make Maven available **in the current CMD window**:

```cmd
set "PATH=%LOCALAPPDATA%\Programs\apache-maven-3.9.16\bin;%PATH%"
mvn -version
```

You should see **Apache Maven 3.9.16** and Java 21. There is no need to repeat the download each time.

### 3. Make Maven available in future CMD windows

Run this **once**, in CMD. It adds Maven's bin folder to your *user* PATH without overwriting your existing PATH:

```cmd
powershell -NoProfile -Command "$maven = Join-Path $env:LOCALAPPDATA 'Programs\apache-maven-3.9.16\bin'; $userPath = [Environment]::GetEnvironmentVariable('Path', 'User'); if (($userPath -split ';') -notcontains $maven) { [Environment]::SetEnvironmentVariable('Path', (($userPath + ';' + $maven).Trim(';')), 'User') }"
```

**Close all existing CMD windows, open a new CMD window**, and confirm:

```cmd
where java
where mvn
mvn -version
```

If `mvn` still isn't recognized, you can run it **without changing PATH**:

```cmd
"%LOCALAPPDATA%\Programs\apache-maven-3.9.16\bin\mvn.cmd" -version
```

Official installation references: [Java for Windows](https://learn.microsoft.com/en-us/windows/dev-environment/java), [Maven installation](https://maven.apache.org/install.html), [Apache Maven downloads](https://maven.apache.org/download.cgi). If Maven 3.9.16 has been archived in the future, find the current version at Apache's download page and update the version in these commands.

### 4. Start Doc2FAQ

Open CMD inside the folder containing `pom.xml` (for example, open that folder in File Explorer and type `cmd` into the address bar):

```cmd
mvn spring-boot:run
```

Open **http://localhost:8080** in a browser. The first build downloads dependencies and may take a few minutes.

To stop the application, press **Ctrl+C** in CMD.

Optional alternate port:

```cmd
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=9090"
```

If Maven isn't on PATH, replace `mvn` with the full `mvn.cmd` path shown above.

## macOS / Linux

Install JDK 21 and Maven 3.6.3+ through your system's package manager or the official download links above. In the repository directory:

```bash
java -version
mvn -version
mvn spring-boot:run
```

Open **http://localhost:8080**.

## Build and run the JAR

After updating your checkout to the latest `main`, run these commands from the directory containing `pom.xml`:

```cmd
mvn -B -ntp clean verify
node --test src/test/js/*.test.cjs
java -jar target/doc2faq-0.5.0.jar
```

The JavaScript checks require Node.js. Keep the terminal open while the app runs, and use **Ctrl+C** to stop it. Open **http://localhost:8080** and refresh the browser to load the updated frontend.

If port 8080 is occupied, stop the previous Doc2FAQ process or use an alternate port:

```cmd
java -jar target/doc2faq-0.5.0.jar --server.port=8081
```

Then open **http://localhost:8081**. Merging source changes does not update an existing JAR or a running Java process; rebuild and restart to use the fixes. Published JARs must be built from the corresponding release commit.

The preview heading and footer display the full project version from `pom.xml`. Maven fills these values when copying `index.html` into the build; changing the project version and rebuilding updates both labels automatically.

## Using the app

1. Paste your document's text or choose a `.txt`, `.md`, `.pdf`, or `.docx` file.
2. Select **Extract Mode** if your text already contains FAQ questions; select **Generate Mode** for a normal document with section headings.
3. Click **Extract FAQ draft** or **Generate FAQ draft**, depending on the mode.
4. Select **View source beside answer** to highlight original passages beside the editor on desktop (above it on mobile). You can also expand **Show source** for individual excerpts. Typing preserves the source viewer's scroll position; selecting a source explicitly reveals its highlighted passage.
5. Edit and verify each FAQ, then change its status from **Needs review** to **Approved**. Blank entries cannot be approved. Editing either field or merging resets approval; moving an FAQ preserves it.
6. Combine the question/answer search with the **All statuses**, **Needs review**, or **Approved** filter. Read the visible and review counts; use **Clear filters** to restore the list. Filters do not restrict saved projects, previews, or exports.
7. Reorder, remove, or add FAQs. Review similar questions, choose Keep both or merge, and use Undo immediately after a removal/merge if needed. Review status changes clear that undo history too.
8. Set the document title and use **Save work** to keep source, edits, order, references, duplicate decisions, and review status. **Open saved work** resumes a project. Optional autosave is off by default. New schema-2 project files require v0.5 or later; schema-1 files open with Needs review defaults.
9. Choose **Markdown**, **JSON**, **HTML**, **PDF**, or **Word**, optionally include references, and inspect **Preview export**. Use **Copy** for text formats or **Download** for any format. All FAQs are included, even if filtered out. Any blank question or answer blocks export; approval is a review aid and is not required to export.

Example document for **Generate Mode**:

```markdown
## Services
The team provides onboarding guides and a shared knowledge base.

## Technical Skills
Members share guides on document organization and clear technical writing.
```

Example suggested output:

```markdown
## What services are included?
The team provides onboarding guides and a shared knowledge base.

## Which skills and technologies are listed?
Members share guides on document organization and clear technical writing.
```

Generate Mode preserves explicit FAQ pairs and suggests questions for additional sections. Exact duplicate pairs and boilerplate appendix headings are filtered; distinct passages remain available for review. The answer text is sourced from the document. Generated question phrasing is heuristic; this is *not* legal advice or an automated contract interpretation service.

## Formats and limits

| Input | Processing | Limits |
| --- | --- | --- |
| TXT, Markdown | Read in the browser and sent to the server on draft creation | 256 KB input file, 50,000 characters of text |
| PDF | Text extraction using Apache PDFBox | 5 MB upload, 50 pages, 50,000 extracted characters |
| DOCX | Text extraction using Apache POI | 5 MB upload, 50,000 extracted characters |
| FAQ drafts | Local rules based on source text | Maximum 30 suggested/extracted pairs |
| Project files | Validated JSON, read in the browser; schema 1 reads, schema 2 saves | 4 MB, 30 FAQs, 50,000 source characters |
| Review status | Browser workspace and project saves | Needs review / Approved; complete FAQs only for approval |
| Exports | Text formats in browser; PDF/DOCX on the server | Title 200 characters; question 500; answer 50,000; combined FAQ text 300,000 |

The server checks file signatures, not just extensions. Empty, corrupted, password-protected, and unsupported documents are rejected with clear errors. **Scanned/image-only PDFs require OCR**, which this version does not provide. Complex tables and multi-column layouts can lead to imperfect text order; inspect the extracted text before drafting.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health and AI-enabled status |
| POST | `/api/documents/extract` | Multipart PDF/DOCX to extracted text |
| POST | `/api/faqs/preview` | Extract explicit questions and answers |
| POST | `/api/faqs/generate` | Suggest source-grounded FAQs using local rules |
| POST | `/api/faqs/export/pdf` | Validated FAQ JSON to downloadable PDF |
| POST | `/api/faqs/export/docx` | Validated FAQ JSON to downloadable Word document |

**Review state is client-side:** approval status, search, and filters are not API parameters. Project JSON preserves approval status; finished FAQ JSON exports contain content and optional references, rather than the full workspace.

Both FAQ endpoints take JSON input:

```json
{"content": "## Services\nWebsite monitoring and software maintenance."}
```

Response format:

```json
{
  "items": [
    {
      "question": "What services are included?",
      "answer": "Website monitoring and software maintenance.",
      "source": {"section": "Services", "startLine": 1, "endLine": 2,
                 "excerpt": "## Services\nWebsite monitoring and software maintenance."}
    }
  ],
  "count": 1,
  "notice": "..."
}
```

The `/api/faqs/preview` endpoint deliberately returns zero results if there are no complete, explicit Q&A pairs. The `/api/faqs/generate` endpoint can produce a conservative draft from ordinary text, even without headings.

Export endpoints accept this shape (1–30 nonblank entries; references are optional):

```json
{
  "title": "Team FAQ",
  "includeSources": true,
  "filename": "team-Doc2FAQ.pdf",
  "items": [{
    "question": "Where is support?",
    "answer": "Ask in the team channel.",
    "edited": false,
    "sources": [{"section": "Support", "startLine": 1, "endLine": 2}]
  }]
}
```

Export references are supplied by the caller. They identify passages for human review; the export API does not independently verify their origin. Both download responses use `Cache-Control: no-store`. The optional `filename` controls the attachment name; the endpoint enforces the PDF/DOCX extension. Exports omit the FAQ-count subtitle.

## Tests

```bash
mvn -B -ntp clean verify
node --test src/test/js/*.test.cjs
node scripts/build-web-demo.mjs
```

GitHub Actions automatically runs the Java and JavaScript checks on pushes and pull requests. Tests cover both modes, exact source references, preservation of distinct passages, stale responses, document import errors, project round trips and invalid files, merge behavior, API validation, Unicode exports, PDF pagination, and export safety. They also cover approval restore/reset, legacy project migration, combined filters, source-viewer scroll preservation, and browser-demo drafting rules. The frontend tests require Node.js and have no npm dependencies.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `'java' is not recognized` | Install the **JDK 21**, reopen CMD, and confirm `java -version` |
| `'mvn' is not recognized` | Run the temporary PATH command above, reopen CMD after permanent PATH setup, or use the full `mvn.cmd` path |
| Maven selects the wrong Java version | Check `mvn -version` and set `JAVA_HOME` to your JDK 21 installation |
| `No complete Q&A pairs found` | Switch from **Extract Mode** to **Generate Mode**, or format existing pairs as Markdown question headings |
| No FAQs visible after filtering | Use **Clear filters**; the draft and its export still include every FAQ |
| Approval changes after editing | Expected: edited or merged content returns to Needs review |
| Saved project will not open in v0.4 | Schema-2 projects need v0.5 or later; keep the original schema-1 file when using older releases |
| Browser document tools fail to load | Allow the version-pinned jsDelivr libraries and retry; document content remains on your device |
| Older Word `.doc` file rejected | Save it as `.docx` first |
| Browser PDF export reports an unsupported character | Choose Word (.docx), which preserves Unicode text |
| Scanned PDF fails | The file is image-only; run OCR outside Doc2FAQ first |
| Port 8080 already in use | Stop the other program or start Doc2FAQ with port 9090 |
| Maven downloads fail | Check internet access, proxy configuration, corporate restrictions, and the Maven Central repository |

## Security and privacy

I built Doc2FAQ with local document processing in mind. The downloadable Java application runs on your own computer at `http://localhost:8080`. PDF and Word files are processed by the local Spring Boot server for each request; I do not store them in an application database, although the server may temporarily buffer uploads. When you generate FAQs from pasted text or TXT/Markdown files, that text goes from your browser to the same local server. PDF and Word exports also send the edited FAQ content to the local server to create the download. Editing, project saves, and text-format exports happen in your browser.

The [online demo](https://okantiktas.com/projects/doc2faq/demo/) works differently: document processing and exports run in your browser, without uploading your document to my website. PDF and Word features load version-pinned libraries from jsDelivr when needed, so your browser contacts that CDN for application code, not to submit document content.

I leave **autosave off by default**. If you enable it, your browser stores the source text and FAQ draft locally so you can return to your work. **Save work** downloads a project file that also contains your source text. On a shared computer, use **Clear saved data** when finished and handle downloaded project files as you would the original documents. With autosave disabled, unsaved work does not survive a page reload.

Doc2FAQ does not currently include user accounts, billing, request rate limiting, or a server-side draft database. **I designed the Java application for trusted local use, not as a public document-processing server.** Before hosting it for other users, I would add authentication, HTTPS, rate limits, isolated file parsing, malware scanning, monitoring, and a documented data-retention policy. I recommend processing confidential documents only on a device or server you trust, and reviewing the generated answers before sharing them.

## License

MIT · Copyright © 2026 **Okan Tiktas**.

## Later releases

Optional AI generation with explicit opt-in and token/cost limits, OCR, and account/subscription workflows are outside the current v0.5.0 scope. See [docs/RELEASING.md](docs/RELEASING.md) for the validation and release process.
