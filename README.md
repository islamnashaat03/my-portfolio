# Islam Nashaat — Portfolio

Bilingual portfolio: https://islamnashaat03.github.io/my-portfolio/

Regenerate with `python build_portfolio.py` and validate with `python verify_portfolio.py`.

TaskFlow is an AI-assisted React portfolio and learning project. Its source is in
[`apps/taskflow`](apps/taskflow), and its static production build is served from
[`taskflow/`](https://islamnashaat03.github.io/my-portfolio/taskflow/). The app stores
data in the current browser and supports JSON backups. Guided rebuilding and
understanding of the implementation are in progress.

For TaskFlow development, run `npm ci` and `npm run dev` inside `apps/taskflow`.
Run `npm run publish:assets` there to update the checked-in demo before publishing. Keep
`images/screens/taskflow.webp` in sync with the real interface, then regenerate
and validate the bilingual portfolio from the repository root.
