# Doc2FAQ release checklist

**Release-candidate branch:** `0.5.0`. **Latest published download:** v0.4.0. The next planned release is **v0.5.0 — Source & Review**. The release-candidate branch is not a published release. Merging source changes does not publish a release or update an installed JAR. Keep existing tags and assets unchanged.

## Validate the release candidate

Use JDK 21+, Maven 3.6.3+, and Node.js. CI compiles the application for Java 21 and runs Java tests plus a packaged-JAR smoke check on JDKs 21 through 27. All matrix jobs must succeed before publication:

```cmd
mvn -B -ntp clean verify
node --test src/test/js/*.test.cjs
node scripts/build-website.mjs
java -jar target/doc2faq-0.5.0.jar
```

Open `http://localhost:8080` (or use `--server.port=8081` if occupied). Test the packaged JAR, not only a static frontend preview:

On Linux or Git Bash, the optional automated JAR smoke check runs the packaged server locally, tests health, loads the frontend, and extracts an FAQ before stopping it:

```sh
bash scripts/smoke-packaged-jar.sh target/doc2faq-0.5.0.jar
```

GitHub Actions runs this smoke check on every push/PR. On Windows without Bash, use the equivalent manual checks below.

1. Import TXT, Markdown, PDF, and DOCX. Extract explicit questions and generate from ordinary sections; inspect exact excerpts and text-line ranges. Scanned PDFs must explain the OCR limitation.
2. Select an FAQ's source viewer and check all highlights, including multiple references after merge. Try a manual FAQ and HTML-like source text. Check desktop side-by-side and mobile stacked layouts. Typing in questions/answers must preserve page and source scroll positions.
3. Approve complete FAQs, then edit each field or merge and confirm Needs review. Blank entries cannot be approved. Move an approved FAQ and confirm approval remains. Remove/Undo restores status and references.
4. Combine question/answer search and review filters. Check visible/approved/pending counts, live edits, Clear filters, and adding a blank FAQ while filtered. Filters must not restrict saving or exporting.
5. Use Keep both, merge, and Undo on similar questions. Preserve distinct passages and all references; newer edits or review decisions must clear stale undo history.
6. Save/reopen a complete and incomplete project. Verify source, filename, title, mode, order, edits, original excerpts, duplicate choices, and review status. Schema-1 files upgrade; new saves use schema 2. Invalid states and mismatched references leave the workspace intact.
7. Enable autosave, edit, wait for Saved in this browser, and reload. Clear saved data leaves the workspace open; Clear document removes source, draft, names, pending results, and its saved copy. Test blocked browser storage and use Save work as fallback.
8. With filters active, preview/download Markdown, JSON, HTML, PDF, and Word. Every FAQ remains included in draft order; a hidden incomplete entry blocks export. Verify edited values and optional references. Finished FAQ JSON is not a full project save.
9. Import `TEst Data.pdf`, check the suggested `testdata-Doc2FAQ.pdf`, rename it, and verify the download. Check centered titles, PDF Lato fonts, page numbers, long answers/tokens, Unicode, and page breaks. Unsupported PDF glyphs must suggest Word. HTML must escape document markup.
10. Change source/mode, clear the document, or open another project during pending imports/drafting/exports. Old results must not replace or download current work. Check keyboard focus, mobile widths, and reduced motion.
11. Follow [WEB-DEMO.md](WEB-DEMO.md) for the separate static browser demo; verify its feature disclosure and website links. The demo cannot substitute for packaged-JAR testing.

## Prepare v0.5.0

1. Review and merge development changes after CI and packaged-JAR checks pass.
2. Review the release-candidate branch with `pom.xml` already at `0.5.0`. Verify the README and guide match the JAR name. Leave v0.4.0 labeled as the latest published download until v0.5.0 actually ships. Date the changelog and update download links at publication. Keep historical v0.4.0 notes accurate.
3. Update a clean checkout to the merged release commit, then build again:

   ```cmd
   git switch main
   git pull --ff-only origin main
   git status --short
   git rev-parse HEAD
   mvn -B -ntp clean verify
   node --test src/test/js/*.test.cjs
   node scripts/build-website.mjs
   java -jar target/doc2faq-0.5.0.jar
   ```

   On Linux or Git Bash, also run `bash scripts/smoke-packaged-jar.sh target/doc2faq-0.5.0.jar` against the clean build. The application must be stopped before the manual JAR launch, unless you specify an alternate port.

4. Confirm a clean working tree and record the exact SHA. Repeat the packaged-JAR smoke check. Confirm that v0.5.0 does not already exist as a tag or release.

## Publish tested artifacts

1. Open [Draft a new release](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/new).
2. Tag the exact tested commit `v0.5.0`; title **Doc2FAQ v0.5.0 — Source & Review**.
3. Copy the v0.5.0 changelog notes. Attach the tested `target/doc2faq-0.5.0.jar`, never `.jar.original` or a renamed old JAR.
4. Also attach `Doc2FAQ-0.5.0-Windows.zip` with that exact JAR, `Start-Doc2FAQ.cmd`, and a quick-start README. The launcher must reference `doc2faq-0.5.0.jar`. Include `SHA256SUMS.txt` for both downloads; remove snapshot and older-version instructions from the new bundle.
5. Review tag, commit, notes, and assets before publishing. Download the published assets separately, verify hashes and that the ZIP's JAR matches the standalone JAR, then run with Java 21. Confirm version, health, saved review status, source viewer, and PDF/Word exports.
6. Rebuild/synchronize the website demo when its shared frontend changes. Verify the actual live route and update the portfolio link if needed.

Accounts, billing, OCR, external AI, and public-server hardening remain separate work. The Java build is intended for local use; the static browser demo runs its simplified drafting on visitors' devices.
