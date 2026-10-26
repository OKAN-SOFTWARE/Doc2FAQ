# Doc2FAQ

**Turn explicit questions in documents into clean, searchable FAQ drafts.**

Doc2FAQ is a Java 21 / Spring Boot application with a review-first, deterministic workflow. You can paste text or select a **TXT, Markdown, PDF, or DOCX** file, inspect extracted text, and create FAQ drafts from questions already written in the source. No external AI service is called and no questions are invented.

Created by **Okan Tiktas** · [OKAN-SOFTWARE](https://github.com/OKAN-SOFTWARE).

## Version 0.2.0 (in development)

- New document import endpoint for **PDF** (Apache PDFBox) and **DOCX** (Apache POI).
- Added browser import for PDF/DOCX, with a mandatory text review step before drafting FAQs.
- Limits: **2 MB** per PDF/DOCX upload, **50 PDF pages**, **20,000 extracted characters**, and **30 FAQ entries**.
- Checks file signatures as well as filename extensions. Rejects empty, corrupted, password-protected, and unsupported documents.
- Text is processed in memory and returned to the browser; the app intentionally does not store uploaded documents or generated drafts.
- Includes unit tests and HTTP integration tests for imported documents.

This version is **not yet a GitHub Release**. Finish review and CI checks before merging, then change the project version in `pom.xml` from `0.2.0-SNAPSHOT` to `0.2.0` when publishing the stable release.

## Run locally

Requirements: **Java 21** and **Maven 3.6.3+**.

```bash
mvn spring-boot:run
```

Open **http://localhost:8080**. Upload a document or click **Load example**, review the input, then click **Create FAQ draft**.

On Windows use PowerShell or Command Prompt. To run on another port:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=9090"
```

## Supported documents

| Format | How it is handled |
| --- | --- |
| TXT / Markdown | Read locally in the browser, then sent for FAQ preview when requested |
| PDF | Uploaded to the local Spring Boot server, selectable text extracted with PDFBox |
| DOCX | Uploaded to the local Spring Boot server, text extracted with Apache POI |

The upload endpoint uses `multipart/form-data`. It does not perform optical character recognition (OCR). **Image-only/scanned PDFs** cannot be read. Complex PDF layouts, tables, headers, and Word formatting may produce imperfect reading order. Please review imported text and FAQ answers before exporting.

Standalone lines that already end with a question mark may be marked as explicit questions after PDF/DOCX import. This is a formatting heuristic, not AI question generation.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Returns service status |
| POST | `/api/faqs/preview` | Extracts up to 30 explicit Q&A pairs from JSON document text |
| POST | `/api/documents/extract` | Extracts readable text from a PDF or DOCX multipart file |

Extract text:

```bash
curl -X POST http://localhost:8080/api/documents/extract -F "file=@example.pdf"
```

Result:

```json
{"filename":"example.pdf","format":"pdf","text":"Q: What is Doc2FAQ?\nA: A document FAQ workbench."}
```

Create FAQ draft:

```bash
curl -X POST http://localhost:8080/api/faqs/preview \
  -H 'Content-Type: application/json' \
  -d '{"content":"Q: What is Doc2FAQ?\nA: A document FAQ workbench."}'
```

Use Markdown question headings or `Q:` / `A:` text pairs. The preview route returns `items`, `count`, and a notice.

## Test

```bash
mvn test
mvn package
```

GitHub Actions runs `mvn -B -ntp verify` for changes and pull requests.

## Security and privacy

The application deliberately has no account system or permanent document storage. Uploaded PDF/DOCX contents are handled during one HTTP request and discarded afterwards, aside from transient server upload buffering. Invalid or unsupported formats return a structured error. Multipart limits are configured in `application.yml`.

**This is a local development preview, not a hardened public document-processing service.** Do not expose it to the internet without authentication, rate limiting, resource isolation, upload scanning and monitoring. Do not use sensitive material on untrusted servers.

**License:** MIT · Copyright © 2026 Okan Tiktas.
