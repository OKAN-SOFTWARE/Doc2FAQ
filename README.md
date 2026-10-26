# Doc2FAQ

**Turn documents into editable FAQ drafts — locally, with full control over the answers.**

Doc2FAQ is a Java 21 / Spring Boot document-to-FAQ workbench. Paste text or upload TXT, Markdown, PDF, or DOCX, then extract existing questions or create source-grounded suggestions from ordinary document sections. Review, edit, reorder, and export your results as **Markdown, JSON, or HTML**.

Created by **Okan Tiktas** · [OKAN-SOFTWARE](https://github.com/OKAN-SOFTWARE).

> **Source version: v0.3.0.** The version in `pom.xml` identifies this build. For published tags, release downloads, and announcements, see [GitHub Releases](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases). This source version does not by itself publish a GitHub Release.

## What's new in v0.3.0

- **Extract Mode:** Find explicit Markdown question headings and Q:/A: pairs; do not invent questions or answers.
- **Generate Mode:** Suggest questions from regular documents, such as service agreements, policies, and résumés, using section headings and the source's own words.
- **Review editor:** Change questions and answers, move items up or down, remove unwanted entries, or add an FAQ manually (up to 30 items).
- **Export:** Download or copy **Markdown**, **JSON**, or **standalone HTML**. HTML export escapes document content to prevent injected markup.
- **Question quality filters:** Avoids duplicate common topics, skips document titles and FAQ appendices, and uses more natural questions for responsibilities, confidentiality and ownership.
- **Consistent 50,000-character limit** across document extraction, the browser, and both FAQ API endpoints.
- **Windows CMD setup** for people who don't have Java or Maven installed, plus troubleshooting.

**Privacy and accuracy:** The current Generate Mode is **deterministic and rule-based, not a generative AI model**. No API key, paid AI service, or external model is required. Its questions are suggestions; answers come from excerpts in your source document. Topic-based duplicate filtering can sometimes suppress distinct details within a topic. It cannot reliably interpret every layout or guarantee an accurate summary. Always review before publishing.

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

## Using the app

1. Paste your document's text or choose a `.txt`, `.md`, `.pdf`, or `.docx` file.
2. Select **Extract Mode** if your text already contains FAQ questions; select **Generate Mode** for a normal document with section headings.
3. Click **Extract FAQ draft** or **Generate FAQ draft**, depending on the mode.
4. Review and edit each question and answer. Use arrows to reorder, **Remove** to delete, and **Add FAQ** to add an entry.
5. Choose **Markdown**, **JSON**, or **HTML**, then **Copy** or **Download**. Blank questions or answers must be completed before export.

Example document for **Generate Mode**:

```markdown
## Services
Website monitoring, routine software updates, and uptime reviews.

## Payment Terms
The client pays USD 1,200 within fifteen days of receiving an invoice.
```

Example suggested output:

```markdown
## What services are included?
Website monitoring, routine software updates, and uptime reviews.

## When and how are payments due?
The client pays USD 1,200 within fifteen days of receiving an invoice.
```

Generate Mode preserves explicit FAQ pairs, then suggests questions for additional sections while filtering repeated common topics and boilerplate appendix headings. The answer text is sourced from the document. Generated question phrasing is heuristic; this is *not* legal advice or an automated contract interpretation service.

## Formats and limits

| Input | Processing | Limits |
| --- | --- | --- |
| TXT, Markdown | Read in the browser and sent to the server on draft creation | 256 KB input file, 50,000 characters of text |
| PDF | Text extraction using Apache PDFBox | 5 MB upload, 50 pages, 50,000 extracted characters |
| DOCX | Text extraction using Apache POI | 5 MB upload, 50,000 extracted characters |
| FAQ drafts | Local rules based on source text | Maximum 30 suggested/extracted pairs |

The server checks file signatures, not just extensions. Empty, corrupted, password-protected, and unsupported documents are rejected with clear errors. **Scanned/image-only PDFs require OCR**, which this version does not provide. Complex tables and multi-column layouts can lead to imperfect text order; inspect the extracted text before drafting.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health and AI-enabled status |
| POST | `/api/documents/extract` | Multipart PDF/DOCX to extracted text |
| POST | `/api/faqs/preview` | Extract explicit questions and answers |
| POST | `/api/faqs/generate` | Suggest source-grounded FAQs using local rules |

Both FAQ endpoints take JSON input:

```json
{"content": "## Services\nWebsite monitoring and software maintenance."}
```

Response format:

```json
{
  "items": [
    {"question": "What services are included?", "answer": "Website monitoring and software maintenance."}
  ],
  "count": 1,
  "notice": "..."
}
```

The `/api/faqs/preview` endpoint deliberately returns zero results if there are no complete, explicit Q&A pairs. The `/api/faqs/generate` endpoint can produce a conservative draft from ordinary text, even without headings.

## Tests

```bash
mvn test
mvn package
```

GitHub Actions automatically runs `mvn -B -ntp verify` on pushes and pull requests. Tests cover both modes, duplicate-topic filtering, FAQ appendix/title exclusions, natural question wording, document import errors, API validation, and output limits.

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

Doc2FAQ currently has **no accounts, billing, rate limiting, or permanent draft storage**. PDF/DOCX files are processed for the request and are not intentionally saved by the app, though the web server may use temporary multipart buffering. TXT/Markdown are read in the browser and submitted as text when you generate a draft. Editing and exporting happen in the browser; drafts disappear when the page is reloaded.

This is a **local development application**, not a hardened internet-facing service. Before offering paid or public document processing, add authentication, rate limiting, isolated document parsing, malware scanning, HTTPS, audit/monitoring, and retention policies. Do not process confidential material on an untrusted server.

## License

MIT · Copyright © 2026 **Okan Tiktas**.

## Planned enhancements

- PDF and DOCX FAQ export with page layout, fonts, document metadata, and validation tests (not included in this version).
