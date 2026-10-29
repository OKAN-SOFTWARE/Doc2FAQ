# Doc2FAQ release checklist

The release version is **v0.4.0**. The release commit uses `0.4.0` in `pom.xml`; earlier development builds used `0.4.0-SNAPSHOT`. Merging source changes alone does not publish a GitHub Release or update an already downloaded JAR.

## Validate the release build

Use JDK 21, Maven 3.6.3+, and Node.js:

```cmd
mvn -B -ntp clean verify
node --test src/test/js/*.test.cjs
java -jar target/doc2faq-0.4.0.jar
```

Open `http://localhost:8080` (or use `--server.port=8081` if occupied). Check the packaged JAR with these steps:

1. Extract explicit Markdown and Q:/A: questions. Expand Show source; verify exact excerpts and text-line ranges.
2. Generate from multiple sections, including repeated topics with different details. Confirm distinct passages remain. Use Keep both, merge, and Undo; confirm both references survive a merge.
3. Edit a question/answer; confirm its edited label. Remove an item and Undo. Reorder items and use search.
4. Set a document title, use Save work, refresh, and reopen it. Confirm source, order, edited values, references, and review choices. Save and reopen an incomplete FAQ too. An invalid project must leave the workspace intact.
5. Enable autosave, edit, wait for Saved in this browser, and reload. Confirm restore. Clear saved data and reload; confirm it is gone. Test with browser storage unavailable and use Save work as the fallback.
6. Preview exports and download Markdown, JSON, HTML, PDF, and DOCX with edited content. Upload `TEst Data.pdf` and confirm the suggested filename is `testdata-Doc2FAQ.pdf`; rename it and check the actual download. Clear document, reload, and confirm the previous PDF and draft stay cleared. Check centered titles, Lato PDF fonts, no FAQ-count subtitle, and optional references; HTML must display document markup as text.
7. Open PDF and Word downloads with short and long answers, Unicode text, long unbroken tokens, and page breaks. Check margins, heading placement, footer page numbers, and the final answer. Unsupported PDF glyphs must produce an error with the DOCX option.
8. Change source/mode or open a project while a draft/file request is pending. The old response must not replace current work. Check desktop and narrow-screen controls and keyboard focus. Move the pointer to check the background; enable reduced motion and confirm it stays still.

## Prepare the release commit

1. Review and merge the development PR after CI and the checks above pass.
2. Change the project version from `0.4.0-SNAPSHOT` to `0.4.0`, mark the changelog section released, and update README run commands. Review that release-preparation change.
3. Update a clean local checkout to the merged release commit:

   ```cmd
   git switch main
   git pull --ff-only origin main
   git status --short
   git rev-parse HEAD
   mvn -B -ntp clean verify
   node --test src/test/js/*.test.cjs
   java -jar target/doc2faq-0.4.0.jar
   ```

4. Confirm the working tree is clean and record the exact commit SHA. Repeat the packaged-JAR smoke check. Confirm no existing v0.4.0 tag or Release exists.

## Publish when ready

1. Open [Draft a new release](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/new).
2. Create tag `v0.4.0` at the exact recorded commit; title: **Doc2FAQ v0.4.0 — Review, Save & Export**.
3. Copy the 0.4.0 changelog section into the notes. Attach the tested `target/doc2faq-0.4.0.jar`, never `.jar.original` or a renamed older JAR. Also attach `Doc2FAQ-0.4.0-Windows.zip` containing that same JAR, `Start-Doc2FAQ.cmd`, and a quick-start README, plus `SHA256SUMS.txt` for both downloads. Confirm the launcher references `doc2faq-0.4.0.jar` and neither the ZIP nor its instructions reference the snapshot build.
4. Review the tag, commit, notes, and asset before publishing. Keep existing release artifacts unchanged.
5. Download the published JAR and ZIP to a separate folder, verify their hashes against `SHA256SUMS.txt`, and confirm that the JAR inside the ZIP matches the standalone JAR. Run it with Java 21 and verify the version, health, project restore, source review, and PDF/Word downloads.

Accounts, billing, OCR, optional external AI, and public-server hardening remain separate work. This build is intended for local use.
