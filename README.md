# NCAA Wrestling Bracket Builder

Astro + npm bracket builder ready for local development and GitHub Pages deployment.

## What it does

- Supports all NCAA weight classes (`125` through `285`)
- Uses true NCAA 32-man championship structure for each class
- Seeds first-round matchups in NCAA order (`1v32`, `16v17`, `8v25`, `9v24`, `5v28`, `12v21`, `4v29`, `13v20`, `3v30`, `14v19`, `6v27`, `11v22`, `7v26`, `10v23`, `2v31`, `15v18`)
- Lets users type entrants manually or import entrants from files
- Provides winner dropdowns for every round through the final
- Saves progress in browser `localStorage`
- Exports picks as JSON or plain text
- Imports prior JSON exports (entrants + picks)
- Imports NCAA bracket PDFs and prefills seeded wrestlers by weight class where detected

## UI layout

- Top controls are organized into cards for:
  - Weight class + reset actions
  - Import actions (JSON and PDF)
  - Export actions (JSON and text)

## Import behavior

- PDF import expects seeded championship text in the style of NCAA bracket PDFs (for example, entries like `(1) Wrestler Name (SCHOOL)`).
- Imported entrants update the selected weight classes and reset picks for those classes so downstream round choices stay valid.
- JSON import can restore saved entrants and picks for each weight class.

## Local development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Then open the local URL shown in your terminal (typically `http://localhost:4321`).

## Build

```bash
npm run build
```

The static output goes to `dist/`.

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy.yml` to auto-deploy on pushes to `main`.

1. Push this repo to GitHub.
2. In GitHub, open `Settings` -> `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Keep your default branch as `main` (or update the workflow branch if different).

The Astro config auto-detects the repository name during GitHub Actions builds and sets the correct base path for project pages.

After the first successful workflow run, your site will be live at:

- `https://<your-github-username>.github.io/<your-repo-name>/`
