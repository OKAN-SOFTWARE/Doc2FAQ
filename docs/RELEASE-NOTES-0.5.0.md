# Doc2FAQ v0.5.0 — Source & Review

This release makes Doc2FAQ easier to review, safer to export, and more welcoming on desktop and mobile, with the approved illustrated Doc2FAQ design.

### Highlights

- **Review status:** Mark complete FAQs as Approved, filter by review status, search the draft, and keep all entries in exports regardless of the current view.
- **Source viewer:** Inspect original passages and line references behind each answer. Editing or merging an FAQ returns it to Needs review.
- **PDF and Word:** Import PDF/DOCX, export paginated PDF or Word documents, and use PDF-first format selection. The browser demo embeds DejaVu Sans for Turkish and extended Latin characters; DOCX remains the fallback for unsupported glyphs.
- **Save and return:** Save a complete project as JSON or optionally autosave in the browser. Clear saved data has a clearly labeled confirmation and does not close the active workspace.
- **New look:** A distinctive illustrated homepage, matching Java and browser interfaces, clearer controls and responsive layouts.
- **Browser-only demo:** Try the simplified workflow online. The downloadable Java app still runs locally and may produce different FAQ suggestions.

### Compatibility

- Built for Java 21 bytecode; required release tests run on **Java 21–26**.
- Java 27 successfully passed exploratory build/tests and packaged-JAR smoke tests, but is not part of the formal v0.5.0 support target.
- The ZIP includes a Windows launcher. Windows SmartScreen can warn about unfamiliar unsigned scripts; direct `java -jar` startup is also supported.

### Downloads

- `doc2faq-0.5.0.jar` — standalone Java application.
- `Doc2FAQ-0.5.0-Windows.zip` — the same JAR plus Windows launcher and quick-start guide.
- `SHA256SUMS.txt` — hashes for both downloads.

After starting the app, open **http://localhost:8080**. Java must remain running while the local site is in use.

No AI service, OCR, accounts, billing, or hardened public Java backend is included. The browser demo processes document content on the visitor's device; some libraries are downloaded from a CDN. Review all generated FAQs before sharing.
