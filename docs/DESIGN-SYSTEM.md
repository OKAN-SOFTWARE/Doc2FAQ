# Doc2FAQ design system

I use a light, approachable **paper-and-answers** visual style throughout
Doc2FAQ: the product homepage, browser demo, and local Java workspace. The
design keeps document processing straightforward without making the interface
feel like another generic developer tool.

## Principles

1. An original document mascot that gives Doc2FAQ its own identity.
2. Warm cream and cool off-white backgrounds, ink-dark outlines, offset shadows.
3. Coral for primary actions, yellow for highlights, mint for positive states.
4. Oversized, confident headings; concise, accessible helper text.
5. Direct workflow: import → generate/extract → review → export.
6. Real functionality first: responsive controls, visible keyboard focus,
   sufficient text contrast, and reduced-motion support.
7. A **What's new** section that makes it clear which version is available
   to download and which features are still in development.
8. Keep right-click, text selection, keyboard shortcuts, and developer tools
   available. Blocking browser controls is not a security measure; sensitive
   work requires proper safeguards where it is processed and stored.

## Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Ink | `#202b34` | Text, outlines and offset shadows |
| Cool paper | `#f0f3f1` | Page background |
| Warm paper | `#fffefa` | Panels and inputs |
| Coral | `#f7a088` | Main actions and emphasis |
| Yellow | `#f8d77b` | Badges and hero art |
| Mint | `#a8d6c8` | Review and success accents |

I maintain the homepage in `website/` and the Java app's theme in
`src/main/resources/static/retro.css`. The generated browser demo uses that
same stylesheet. HTML element IDs and JavaScript adapters must stay aligned so
that visual changes do not interrupt document import, FAQ review, or PDF/DOCX
export.

I created Doc2FAQ's mascot and visual identity for this project. The layout
draws on illustrated, editorial-style interfaces without reusing another
product's branding, artwork, or code.

## Local build

```sh
node scripts/build-website.mjs
node scripts/verify-website-build.mjs
```

The build produces `website-dist/` with:

- `index.html` — marketing/product homepage
- `styles.css` — homepage design tokens and components
- `demo/` — fully interactive browser demo generated from shared app sources

I publish **the contents** of `website-dist/` to `/projects/doc2faq/` on my
portfolio website, leaving the other projects intact. Relative links allow
the homepage and demo to work from the same subdirectory.
