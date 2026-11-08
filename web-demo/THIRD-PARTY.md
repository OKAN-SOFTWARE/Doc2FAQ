# Browser document libraries

The website lazily downloads these version-pinned scripts from jsDelivr. It sends no document bytes to these services. The Java app's Maven dependencies are separate.

| Library | Version | Purpose | License |
| --- | --- | --- | --- |
| [Mozilla PDF.js](https://github.com/mozilla/pdf.js) | 5.6.205 | PDF text extraction and worker | Apache-2.0 |
| [PDF-LIB](https://github.com/Hopding/pdf-lib) | 1.17.1 | Paginated PDF creation with embedded Unicode fonts | MIT |
| [@pdf-lib/fontkit](https://github.com/Hopding/fontkit) | 1.1.1 | Embed custom PDF fonts (loaded lazily for PDF export) | MIT |
| [DejaVu Sans](https://dejavu-fonts.github.io/) | Distribution-provided TTF | Bundled regular and bold Unicode PDF fonts; see `fonts/LICENSE-DejaVu.txt` | Bitstream Vera / DejaVu license |
| [JSZip](https://github.com/Stuk/jszip) | 3.10.1 | Read DOCX archive entries through bounded decompression | MIT (also offered under GPLv3) |
| [docx](https://github.com/dolanmiu/docx) | 9.6.1 | Generate editable Word documents | MIT |

Versions and CDN URLs are centralized in `web-demo/documents.js`. Retain the upstream license notices in delivered library bundles. Re-test imports and exports when updating versions. PDF.js's module and worker versions must match. Normal website asset requests and library downloads are separate from document processing; the document itself stays on the device.
