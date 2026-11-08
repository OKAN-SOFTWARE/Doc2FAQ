# Doc2FAQ release checklist

**Release-candidate branch:** `0.5.0`. **Latest published download:** v0.4.0. The next planned release is **v0.5.0 — Source & Review**. The release-candidate branch is not a published release. Merging source changes does not publish a release or update an installed JAR. Keep existing tags and assets unchanged.

## Validate the release candidate

Use JDK 21+, Maven 3.6.3+, and Node.js. CI compiles the application for Java 21 and runs Java tests plus a packaged-JAR smoke check on **JDKs 21 through 26**. All six required matrix jobs must succeed before publication. Java 27 is outside this **required** release matrix, but an exploratory [Java 27 CI rerun on November 8, 2026](https://github.com/OKAN-SOFTWARE/Doc2FAQ/actions/runs/42477058195) **passed the Maven build, tests, and packaged-JAR smoke check**. The earlier attempt failed only while downloading the JDK (HTTP 504). Consider formal Java 27 support separately in a later release:

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
12. Review the [Doc2FAQ design system](DESIGN-SYSTEM.md), including responsive layouts, readable focus states, reduced-motion behavior, and the **What's new** release-notes area. Confirm that an unreleased candidate is not presented as a published download. Keep browser context menus and developer tools available; browser UI restrictions are not an application security control.

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

1. Merge the verified release candidate into `main`. The version-specific [release workflow](../.github/workflows/publish-v0.5.0.yml) runs on the first merge that adds it to `main`; it can also be retriggered manually using **Run workflow** after a fix. Do not create the `v0.5.0` tag or release in advance.
2. That workflow builds, tests, and smoke-tests the exact release commit on **every supported JDK (21–26)** before the publish job can start. If any matrix entry fails, publication is skipped. It then checks for an existing release/tag, builds with Java 21, runs browser tests, and assembles `doc2faq-0.5.0.jar` and `Doc2FAQ-0.5.0-Windows.zip`. The ZIP contains the **same JAR**, `Start-Doc2FAQ.cmd`, and `WINDOWS-QUICK-START.md`. It verifies the archive and writes `SHA256SUMS.txt` for both downloads.
3. **Only after every check passes**, the workflow creates the `v0.5.0` tag at the exact tested commit and publishes **Doc2FAQ v0.5.0 — Source & Review** with [release notes](RELEASE-NOTES-0.5.0.md) and all three files. If the release job fails, do not call it published; inspect the run, fix the cause, and rerun without replacing any existing tag or release.
4. Inspect the published commit, notes and assets. Download the assets independently, verify hashes and the ZIP/JAR match, then start the published JAR on Java 21. Confirm the version, health, review status, source viewer, and PDF/Word exports.
5. Date the changelog and update README and product-site release links to v0.5.0 after publication. Rebuild/synchronize the browser demo when shared frontend code changes. Verify the actual Hostinger custom-domain routes and links before calling the public website current.

Accounts, billing, OCR, external AI, and public-server hardening remain separate work. The Java build is intended for local use; the static browser demo runs its simplified drafting on visitors' devices.
