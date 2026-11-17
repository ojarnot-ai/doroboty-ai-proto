# Releasing the hosted prototype

Maintainer and facilitator guide for the Netlify site used in AIPH3 sessions. Participants do not need hosting; this file is not part of the participant package.

- Site: https://darling-puppy-6c9229.netlify.app/
- Source: `main` of this repository. Build settings live in [netlify.toml](../netlify.toml) (`npm run build`, publish `dist`); Node comes from `.nvmrc`. A `NODE_VERSION` variable set in the Netlify UI would override `.nvmrc`; leave it unset.
- Pull requests get a Netlify deploy preview (`deploy-preview-<PR>--darling-puppy-6c9229.netlify.app`).
- Readiness evidence: [production-readiness.html](production-readiness.html).

## Release

1. Open a pull request to `main`. Wait for the CI workflow (`./scripts/verify` on Node 24) and check the deploy preview.
2. Merge. Netlify publishes `main` automatically.
3. Run the smoke check below on the production URL.

GitHub disables Actions in new forks. Enable them once under the repository's Actions tab, otherwise pull requests merge without CI.

## Smoke check after publishing (about 5 minutes)

Use a private browser window so the check starts from the default scenario.

1. Home page loads over HTTPS; `http://` redirects to `https://`.
2. `/#/auth/sign-in` → "Wejdź jako Anna Kowalska" → open an offer → submit an application.
3. "Wejdź jako Karolina Wiśniewska" → Kandydaci → open the application → set "W przeglądzie" → reload; the stage stays.
4. Open a copied deep link (for example `/#/oferty`) in a new tab; it renders without a redirect error.
5. Profile → "Pobierz CV (PDF)" downloads a PDF.
6. Browser developer tools: no console errors and no requests to other domains (Netlify's own `/.netlify/scripts/hud` on the same domain is expected).

If any step fails, roll back first and investigate afterwards.

## Rollback

1. Netlify → this project → Deploys.
2. Open the last deploy that passed the smoke check → "Publish deploy".
3. Repeat the smoke check. Fix forward with a new pull request; while a rolled-back deploy is published, check Netlify's deploy list to confirm whether later merges are published automatically again.

Netlify's interface changes over time; confirm the current labels in its documentation if they differ.

## During a session (plan B)

- Site down or broken and rollback does not help: participants run the prototype locally (`npm ci`, `npm run dev`) following [PARTICIPANT_GUIDE.md](PARTICIPANT_GUIDE.md).
- A participant sees the error screen ("Coś poszło nie tak"): they download their save, send it with a screenshot to the facilitator, then continue or reset in settings. The file is the last save written to the browser; if saving had failed, the latest in-memory changes are not in it (export from settings while the app still works). Nothing is sent automatically; the browser console shows the technical error.
- A completely blank page (the error screen only covers page content, not the header or app start-up): open settings (`/#/app/settings`) and export or reset; if that page is blank too, switch to the local run.

## Open decisions

Record the answers here and in the readiness report:

- Who reacts during a session and how participants reach them (incident owner and support channel).
- Who receives Netlify deploy-failure notifications.
- Expected number of participants and sessions (capacity check against Netlify's free-plan limits).
