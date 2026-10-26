# Doc2FAQ

**Turn explicit questions in a document into a clean, searchable FAQ draft.**

Doc2FAQ is a Java 21 / Spring Boot web app. The first release reads Markdown and plain text, extracts questions already present in that text, and lets you review, search, copy, or download the result. It does **not** invent questions, use AI, upload files to external services, or save document text on the server.

Created by **Okan Tiktas** · [OKAN-SOFTWARE](https://github.com/OKAN-SOFTWARE).

## Run it locally

You need **Java 21** and **Maven 3.6.3+**.

1. Download or clone this repository.
2. Open a terminal inside the `Doc2FAQ` folder.
3. Run:

```bash
mvn spring-boot:run
```

4. Open **http://localhost:8080**.
5. Click **Load example**, then **Create FAQ draft**.

Stop the server with **Ctrl+C**. To use another port:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=9090"
```

On Windows, run the same commands in PowerShell or Command Prompt. If Maven is not installed, install Maven or import `pom.xml` into a Java IDE with Maven support.

## How to write an FAQ-friendly document

Use a question as a Markdown heading, followed by an answer:

```markdown
## What is Doc2FAQ?
It extracts question-and-answer pairs from text.

## Does it use AI?
No. The first release uses deterministic extraction.
```

Or use plain text labels:

```text
Q: Where can I find help?
A: Contact the support team.
```

Files supported in the browser: **`.txt` and `.md`**. Text is limited to **20,000 characters**. The preview returns up to **30** distinct FAQ entries. Headings without an answer are ignored.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Confirm the service is running and AI is off |
| POST | `/api/faqs/preview` | Extract explicit Q&A pairs from text |

Example request:

```bash
curl -X POST http://localhost:8080/api/faqs/preview \
  -H 'Content-Type: application/json' \
  -d '{"content":"## What is Doc2FAQ?\nIt creates a reviewable FAQ draft."}'
```

The API returns `items`, `count`, and a notice describing its limits. Invalid JSON or document text produces a `400` response with a short error code and message.

## Verify changes

```bash
mvn test
mvn package
```

GitHub Actions runs `mvn verify` on pushes and pull requests.

## Project layout

- `src/main/java/.../api/` — HTTP controllers and validation errors
- `src/main/java/.../service/` — deterministic question/answer extraction
- `src/main/java/.../model/` — request and response records
- `src/main/resources/static/` — responsive, dependency-free browser interface
- `src/test/` — service tests and HTTP integration tests

## Scope and security

This is an **early local preview**, not a public SaaS or a substitute for review. It requires no external service account, database, or API key. Document text is sent only to the locally running Spring Boot server for in-memory extraction; it is not intentionally persisted or sent to an AI provider. Avoid exposing this unauthenticated prototype directly to the public internet.

PDF/DOCX parsing, generated questions, authentication, document persistence, and workspace collaboration are future features—not included in v0.1.0.

**License:** MIT · Copyright © 2026 Okan Tiktas.
