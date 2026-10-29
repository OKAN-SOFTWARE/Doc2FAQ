# Doc2FAQ

**Turn documents into editable FAQ drafts — locally, with full control over the answers.**

Doc2FAQ is a Java 21 / Spring Boot document-to-FAQ workbench. Paste text or upload TXT, Markdown, PDF, or DOCX, then extract existing questions or create source-grounded suggestions from ordinary document sections. Review source excerpts, edit and reorder your FAQs, save a project, and export as **Markdown, JSON, HTML, PDF, or Word (DOCX)**.

Created by **Okan Tiktas** · [OKAN-SOFTWARE](https://github.com/OKAN-SOFTWARE).

> **Development version: v0.4.0-SNAPSHOT.** The version in `pom.xml` identifies this build. For published tags, release downloads, and announcements, see [GitHub Releases](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases). This source version does not by itself publish a GitHub Release.

## New in the v0.4.0 development build

- **Save / Open project:** a versioned JSON file preserves source text, title, mode, draft order, edits, original excerpts, and duplicate-review choices. Incomplete FAQs can be saved too. Project files are limited to 4 MB and validated before replacing the workspace.
- **Optional browser autosave:** off by default. Enabling it stores the complete source and draft on this browser's origin and restores them on reload. Disabling autosave or using **Clear saved data** removes Doc2FAQ's saved data without clearing your open workspace. Storage failures leave the draft open; use **Save project** as a backup.
- **Source references:** expand **Show source** to see the original section, extracted-text line range, and exact passage. Edited questions and answers are marked for rechecking. References use text lines, not PDF page numbers; manually added FAQs have no automatic reference.
- **Duplicate review:** distinct passages are retained even if their questions cover the same topic. Similar questions are flagged using a word-overlap heuristic. Choose **Keep both** or **Merge into this FAQ**. Merging keeps both answers and all source references; **Undo removal / merge** restores the previous items until another FAQ edit, addition, reorder, or review choice. Exact duplicate question/answer pairs are still filtered. The maximum remains 30 FAQs.
- **PDF and Word export:** edited content, project title, readable page layout, metadata, and page numbers. Optionally include section/line references and edited-answer notices. PDF embeds DejaVu Sans (see `src/main/resources/fonts/LICENSE-DejaVu.txt`); if text contains a glyph that font cannot represent, export returns an error and suggests DOCX.
- **Export preview:** inspect the final content before downloading. PDF and Word apply their own pagination. Markdown, JSON, and standalone HTML export remain available; binary exports use **Download**.

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

For detailed changes, see [CHANGELOG.md](CHANGELOG.md). For the release checklist, see [docs/RELEASING.md](docs/RELEASING.md).

## Requirements

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
java -jar target/doc2faq-0.4.0-SNAPSHOT.jar
```

The JavaScript checks require Node.js. Keep the terminal open while the app runs, and use **Ctrl+C** to stop it. Open **http://localhost:8080** and refresh the browser to load the updated frontend.

If port 8080 is occupied, stop the previous Doc2FAQ process or use an alternate port:

```cmd
java -jar target/doc2faq-0.4.0-SNAPSHOT.jar --server.port=8081
```

Then open **http://localhost:8081**. Merging source changes does not update an existing JAR or a running Java process; rebuild and restart to use the fixes. Published JARs must be built from the corresponding release commit.

The preview heading and footer display the full project version from `pom.xml`. Maven fills these values when copying `index.html` into the build; changing the project version and rebuilding updates both labels automatically.

## Using the app

1. Paste your document's text or choose a `.txt`, `.md`, `.pdf`, or `.docx` file.
2. Select **Extract Mode** if your text already contains FAQ questions; select **Generate Mode** for a normal document with section headings.
3. Click **Extract FAQ draft** or **Generate FAQ draft**, depending on the mode.
4. Expand **Show source** and review each question and answer. Reorder, remove, or add entries. Review similar questions and use Undo after a removal or merge.
5. Name your project and use **Save project** to keep the source and your edits. Use **Open project** to continue later. Optionally enable browser autosave.
6. Choose **Markdown**, **JSON**, **HTML**, **PDF**, or **Word**, optionally include references, and inspect **Preview export**. Use **Copy** for text formats or **Download** for any format. Blank questions or answers must be completed before export.

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
| Project files | Validated JSON, read in the browser | 4 MB, 30 FAQs, 50,000 source characters |
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
  "items": [{
    "question": "Where is support?",
    "answer": "Ask in the team channel.",
    "edited": false,
    "sources": [{"section": "Support", "startLine": 1, "endLine": 2}]
  }]
}
```

Export references are supplied by the caller. They identify passages for human review; the export API does not independently verify their origin. Both download responses use `Cache-Control: no-store`.

## Tests

```bash
mvn -B -ntp clean verify
node --test src/test/js/*.test.cjs
```

GitHub Actions automatically runs the Java and JavaScript checks on pushes and pull requests. Tests cover both modes, exact source references, preservation of distinct passages, stale responses, document import errors, project round trips and invalid files, merge behavior, API validation, Unicode exports, PDF pagination, and export safety. The frontend tests require Node.js and have no npm dependencies.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `'java' is not recognized` | Install the **JDK 21**, reopen CMD, and confirm `java -version` |
| `'mvn' is not recognized` | Run the temporary PATH command above, reopen CMD after permanent PATH setup, or use the full `mvn.cmd` path |
| Maven selects the wrong Java version | Check `mvn -version` and set `JAVA_HOME` to your JDK 21 installation |
| `No complete Q&A pairs found` | Switch from **Extract Mode** to **Generate Mode**, or format existing pairs as Markdown question headings |
| Scanned PDF fails | The file is image-only; run OCR outside Doc2FAQ first |
| Port 8080 already in use | Stop the other program or start Doc2FAQ with port 9090 |
| Maven downloads fail | Check internet access, proxy configuration, corporate restrictions, and the Maven Central repository |

## Security and privacy

Doc2FAQ currently has **no accounts, billing, rate limiting, or server-side draft storage**. PDF/DOCX files are processed for the request and are not intentionally saved by the app, though the web server may use temporary multipart buffering. TXT/Markdown are read in the browser and submitted as text when you generate a draft. Editing, project saves, and text-format exports happen in the browser. PDF/DOCX export sends the edited FAQ content and reference labels to this server for an in-memory download. With autosave off, unsaved drafts disappear on reload. Downloaded project files and optional browser autosave contain source text; clear saved data on shared devices when finished.

This is a **local development application**, not a hardened internet-facing service. Before offering paid or public document processing, add authentication, rate limiting, isolated document parsing, malware scanning, HTTPS, audit/monitoring, and retention policies. Do not process confidential material on an untrusted server.

## License

MIT · Copyright © 2026 **Okan Tiktas**.

## Later releases

Optional AI generation with explicit opt-in and token/cost limits, OCR, and account/subscription workflows are outside the v0.4.0 development scope. See [docs/RELEASING.md](docs/RELEASING.md) for the validation and release process.
