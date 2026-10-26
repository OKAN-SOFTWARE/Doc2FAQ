# Doc2FAQ release checklist

This is the procedure for publishing **v0.3.0** from the protected `main` branch. Preparing a PR and changing the Maven version do **not** publish the release.

## Before publishing

1. Merge the version-finalization PR into `main` after the required `build-and-test` check passes.
2. Verify the `main` branch has the release commit and the `pom.xml` version is exactly `0.3.0` (not `0.3.0-SNAPSHOT`).
3. Run the GitHub Actions build or verify locally with Java 21 and Maven 3.6.3+:
   
   ```cmd
mvn -B -ntp clean verify
```

4. Open `http://localhost:8080` with `mvn spring-boot:run` and smoke-test:
   - Extract Mode: the fictional maintenance agreement produces six explicit FAQ entries.
   - Generate Mode: the same example produces nine source-grounded entries after duplicate and appendix filtering.
   - Review: edit, reorder, remove, and add FAQ entries.
   - Export: Markdown, JSON, and HTML downloads contain the expected questions and answers.
5. Confirm the repository has no existing `v0.3.0` tag or Release. Do not replace an existing tag.

## Publish using GitHub

1. Open [Draft a new release](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases/new).
2. Choose **Create new tag**, enter **`v0.3.0`**, and target the current **`main`** branch.
3. Use release title: **Doc2FAQ v0.3.0 — Generate Mode, Review & Multi-Format Export**.
4. Copy the **0.3.0** section of [CHANGELOG.md](../CHANGELOG.md) into the Release notes. Describe the deterministic nature of generation and limits honestly.
5. Optionally attach the runnable `target/doc2faq-0.3.0.jar` built by Maven, after validating it starts with Java 21. GitHub automatically supplies source-code archives.
6. Review all fields and select **Publish release**. This is the public publication step; do it only when ready.

## Verify after publishing

- Confirm [Releases](https://github.com/OKAN-SOFTWARE/Doc2FAQ/releases) includes **v0.3.0** and targets the exact release commit on `main`.
- Verify the GitHub Actions check for the tag, if triggered, completes successfully.
- Download the source archive or JAR from the release page and confirm the version and local startup.
- Leave any future PDF/DOCX output feature work for a separate branch and release.

**License:** MIT · Copyright © 2026 Okan Tiktas.
