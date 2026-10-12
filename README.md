# Islam Nashaat — Career portfolio

One-page employment portfolio in English and Arabic:
https://islamnashaat03.github.io/my-portfolio/

Projects and contribution details, technical skills, leadership experience,
measured technical results, education, languages, recruitment contact and CV.
Six selected projects are shown initially; filters expose all 23 public projects.
Project details expand inline. No service pricing or sales pages are displayed.
Old project/service URLs redirect to the appropriate homepage section and are
excluded from indexing; the sitemap contains the two language homepages.

Python 3.12+, standard library only. Regenerate with `python build_portfolio.py`,
then run `python verify_portfolio.py` and `python verify_site_profiles.py`.
`SITE_PROFILE = 'career'` selects the presentation in `site_profiles.py`.
Set `PORTFOLIO_BASE_URL` when moving to a custom domain.

GitHub Pages publishes the repository root on `main`. The newer supplied CV
is retained as an unchanged binary PDF. The contact form uses the existing
Formspree endpoint; browser QA uses intercepted responses rather than sending
test enquiries.
