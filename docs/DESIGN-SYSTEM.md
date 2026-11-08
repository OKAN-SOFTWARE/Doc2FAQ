# Doc2FAQ design system — approved November 2026

Doc2FAQ uses the light, playful **paper-and-answers** visual identity for its
product homepage, hosted browser demo, and local Java workspace. This direction
was approved by project owner Okan Tiktas for future versions of Doc2FAQ.

## Principles

1. A friendly original document mascot (not another project's copyrighted logo).
2. Warm cream and cool off-white backgrounds, ink-dark outlines, offset shadows.
3. Coral for primary actions, yellow for highlights, mint for positive states.
4. Oversized, confident headings; concise, accessible helper text.
5. Direct workflow: import → generate/extract → review → export.
6. Real functionality first: responsive controls, visible keyboard focus,
   sufficient text contrast, and reduced-motion support.

## Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Ink | `#202b34` | Text, outlines and offset shadows |
| Cool paper | `#f0f3f1` | Page background |
| Warm paper | `#fffefa` | Panels and inputs |
| Coral | `#f7a088` | Main actions and emphasis |
| Yellow | `#f8d77b` | Badges and hero art |
| Mint | `#a8d6c8` | Review and success accents |

The homepage source is `website/`; the Java app's theme override is
`src/main/resources/static/retro.css`. The generated browser demo reuses the
same stylesheet. Keep the HTML fields/IDs and JavaScript adapters aligned so
styling changes cannot break document import, FAQ review or PDF/DOCX export.

Do not copy Shepherd.js logos, illustration assets, text, or code; Doc2FAQ's
visuals and mascot are original work inspired only by the broad illustrated,
outlined presentation style.

## Local build

```sh
node scripts/build-website.mjs
node scripts/verify-website-build.mjs
```

This produces ignored `website-dist/` with:

- `index.html` — marketing/product homepage
- `styles.css` — homepage design tokens and components
- `demo/` — fully interactive browser demo generated from shared app sources

Upload **the contents** of `website-dist/` to `/projects/doc2faq/` on the
portfolio host. Leave the rest of the portfolio intact. The root homepage and
demo use relative URLs to work under the `/projects/doc2faq/` subdirectory.
