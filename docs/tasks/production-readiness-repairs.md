# Production readiness repairs (2026-11-17)

## Intent

The production-readiness audit (`docs/production-readiness.html`) left these agent-fixable gaps for the Netlify release used by AIPH3 participants:

- Netlify build settings exist only in the Netlify UI, so a release cannot be reproduced from the repository.
- There is no written post-publish check, rollback procedure or recovery plan for the hosted site.
- A rendering failure leaves a participant with a blank page; nothing tells them how to keep their data or report the problem.

## Scope

1. `netlify.toml` with the build command and publish directory; Node version stays in `.nvmrc` (single source). Not added to the participant package: hosting remains optional and provider-independent for participants.
2. `docs/RELEASE.md` (maintainer/facilitator guide): how a release reaches Netlify, a post-publish smoke check, rollback through Netlify deploy history, plan B during a session and the decisions still open (alert recipient, incident owner, support channel).
3. Error screen: a React error boundary around routed page content in the shell. It keeps the header/navigation, explains the problem in Polish, offers a download of the current browser save and a retry, and tells the participant to send a screenshot and the file to the facilitator. Nothing is sent anywhere automatically. It reuses existing host recipes (`prototype-panel`, `prototype-form`, `PageTitle`, `Button`); no new visual family.

Out of scope: external error reporting services, Netlify UI changes, alert configuration and human decisions recorded in the audit.

## Acceptance criteria

- `npm run build` output is unchanged by `netlify.toml`; Netlify reads command `npm run build` and directory `dist`.
- A render error inside a page shows the error screen instead of a blank page; header and navigation remain usable; navigating to another page or pressing retry clears it.
- The download button saves the raw browser save when one exists (works even if in-memory state is the cause), and is absent when there is nothing saved.
- Keyboard: the screen's heading receives focus; buttons are reachable with Tab; works at 375 px and desktop.
- No external requests; no private free text logged.
- FEATURES.md documents the error screen; `./scripts/verify` steps pass (full gate needs Node 24).
