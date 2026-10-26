# Doc2FAQ release checklist

This is the procedure for publishing **v0.3.1** from the protected `main` branch. Preparing a PR, merging fixes, and changing the Maven version do **not** replace an existing release JAR or publish a new GitHub Release.

## Before publishing

1. Merge the v0.3.1 release PR into `main` after the `build-and-test` check passes.
2. Update a clean local checkout to the merged release commit:

   ```cmd
   git switch main
   git pull --ff-only origin main
   git status --short
   git rev-parse HEAD
   ```

   Confirm `git status --short` is empty. Record the commit SHA; the release tag and attached JAR must correspond to this commit. Verify the project version in `pom.xml` is exactly `0.3.1` (not `0.3.1-SNAPSHOT`).
3. Build and test with JDK 21, Maven 3.6.3+, and Node.js:

   ```cmd
   mvn -B -ntp clean verify
   node --test src/test/js/*.test.cjs
   ```

   Continue only when both checks pass. The runnable artifact is **`target/doc2faq-0.3.1.jar`**; do not upload the `.jar.original` file or rename an older JAR.
4. Stop any previous Doc2FAQ instance, then smoke-test the actual packaged artifact:

   ```cmd
   java -jar target/doc2faq-0.3.1.jar
   ```

   Confirm the startup log identifies **v0.3.1**. Open `http://localhost:8080` and refresh the browser. If another application owns port 8080, use `--server.port=8081` and open `http://localhost:8081` instead. Keep this terminal open while testing; use **Ctrl+C** to stop the app.

   - Extract Mode: `Q: Does this run locally?` followed by `A: Yes, without an external AI service.` on the next line produces one FAQ.
   - Generate Mode: separate `## Client Responsibilities` and `## Provider Responsibilities` sections, each with a source paragraph, produce separate client and provider FAQs.
   - Review: edit, reorder, remove, and add FAQ entries.
   - Export: Markdown, JSON, and HTML downloads contain the expected edited questions and answers; HTML escapes document markup.
5. Confirm the repository has no existing **v0.3.1** tag or Release. Keep the existing v0.3.0 tag, Release, and JAR unchanged.

## Publish using GitHub

1. Open [Draft a new release](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/new).
2. Choose **Create new tag**, enter **`v0.3.1`**, and target the recorded release commit SHA. If selecting `main`, verify its current SHA still matches the commit used to build the JAR.
3. Use release title: **Doc2FAQ v0.3.1 — Parsing and Draft Reliability Fixes**.
4. Copy the **0.3.1** section of [CHANGELOG.md](../CHANGELOG.md) into the Release notes. State that the fixes cover whitespace-heavy parsing, stale draft responses, and distinct client/provider responsibilities. Public-server hardening remains future work.
5. Attach the tested **`target/doc2faq-0.3.1.jar`**. GitHub automatically supplies source-code archives; those archives do not replace the runnable JAR.
6. Review the tag, commit, notes, and attached filename, then select **Publish release** when ready.

## Verify after publishing

- Confirm [Releases](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases) includes **v0.3.1**, its tag points to the recorded release commit, and the downloadable asset is **`doc2faq-0.3.1.jar`**.
- Verify the GitHub Actions check for the tag, if triggered, completes successfully.
- Download the attached JAR to a separate folder, run it with Java 21, and confirm the startup version, health endpoint, and client/provider generation behavior.
- Leave subscriptions, accounts, PDF/DOCX exports, and public-hosting hardening for separate changes.

**License:** MIT · Copyright © 2026 Okan Tiktas.
