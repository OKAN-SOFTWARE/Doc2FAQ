# Doc2FAQ — Source & Review guide

This guide describes the `0.5.0` release-candidate source build, which has not yet been published. The latest published v0.4.0 download does not include the new source viewer or approval filters. See the [README](../README.md) for installation and [browser-demo comparison](WEB-DEMO.md) for the website's supported features.

## Create a draft

1. Start the Java app and open the localhost URL printed by the app (8080 by default).
2. Paste text or import TXT, Markdown, PDF, or DOCX. Inspect extracted text; scanned PDFs require external OCR.
3. Choose Extract Mode for explicit Markdown question headings or Q:/A: pairs. Choose Generate Mode for ordinary sections. Neither mode calls AI.
4. Create the draft. Maximums are 50,000 source characters and 30 FAQ entries. Drafts require human review.

Changing source text or mode clears the current draft. Save work before replacing a document or generating another draft if you need the old edits.

## Compare an answer with its source

Select **View source beside answer** on an FAQ. The read-only viewer highlights every matching original passage, including multiple references retained after merging. On desktop it sits beside the editor; on narrow screens it stacks above it. References use extracted-text line numbers, not original PDF pages. **Show source** expands a specific excerpt within the FAQ card.

Editing a question or answer preserves the source viewer's content and scroll position. Explicitly opening a source selection scrolls to its first highlight. Selecting another FAQ updates the highlighted passages. Manually added FAQs have no automatic source reference; the viewer says so. An edited badge means the current text differs from its original draft; approving does not remove that history.

## Track review

| Action | Review status |
| --- | --- |
| Create/extract/generate or add an FAQ | Needs review |
| Approve a complete question and answer | Approved |
| Edit either field or merge FAQs | Needs review |
| Move an FAQ up/down | Preserved |
| Undo a removal or merge | Restores the previous snapshot, including status |
| Open a schema-1 project | Needs review unless a recognized status was explicitly present |

Approval is a manual review decision. It does not automatically verify accuracy or prevent export of other complete FAQs.

## Search and organize

Search matches questions and answers without case sensitivity. Combine it with All statuses, Needs review, or Approved. Counts show the visible number and the whole draft's approved/pending totals. Clear filters restores the list. Adding an FAQ clears filters so the new blank entry is visible.

Editing a matching FAQ can make it disappear from the filtered list; the edit remains in the draft. Search and filters never remove data, restrict exports, or limit saved projects.

Similar-question warnings use word overlap. Keep both retains distinct passages; Merge into this FAQ combines answers and source references. Review the merged result. Undo removal / merge restores the previous snapshot until another edit, addition, reorder, review choice, or approval-status change clears that history.

## Save and reopen

**Save work** downloads versioned project JSON, including source text, title, filename, mode, FAQ order, original values, references, duplicate decisions, and review status. Incomplete entries may be saved. **Open saved work** validates the file before replacing the workspace; invalid files leave current work intact.

The source build reads schemas 1 and 2, and saves schema 2. Older v0.4 apps reject schema-2 files. Keep an original project copy if you also use an older release. The limit remains 4 MB.

Optional browser autosave is off by default. Enabling it stores source and drafts on that browser origin. The prominently highlighted **Clear saved data** button asks for confirmation; cancel keeps the browser copy, while confirmation removes it and leaves the open workspace intact. Clear document removes source, drafts, pending results, and the saved copy. Download a project when browser storage is unavailable.

## Export

Set the document title and download filename, choose a format, optionally include source references, and preview the result. All FAQs are exported in draft order, regardless of search or status filters. Every entry must have a nonblank question and answer; approval is optional.

Markdown, JSON, and standalone HTML can be copied or downloaded. In the Java app, PDF and Word downloads use the local Java server. On the website demo, document import and PDF/Word generation run in the browser. Both apply their own pagination. The browser demo requires an initial download of version-pinned document libraries; your document content is not uploaded. Browser PDF fonts have Latin character coverage; Word preserves Unicode. Unsupported PDF glyphs produce an error suggesting Word. Finished FAQ JSON is an export, not a saved project: use Save work to preserve review state and resume editing later.
