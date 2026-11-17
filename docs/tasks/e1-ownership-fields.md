# E1 — ownership fields in the employer workspace

Status: implemented on branch `e1/ownership-fields` (2026-11-11); `main` keeps the previous version. Source plan: Supersprint week 2, experiment E1 (idea I2, opportunity OP1) in the AIPH3 Super Brain vault, `3-Projects/doroboty-ai/supersprint/tydzien-2-ponowny-zakup/experiments/bet-pack.md`.

## Intent

Test whether recruiters, seeing three candidate-written fields — "Moja część", "Zespół", "Rezultat" — at the top of an application, choose more accurately whom to invite. The test covers only the invitation decision. It does not test whether candidates fill the fields honestly or whether employers repurchase.

Task per participant (6–8 recruiters, ~30 min): for each of two jobs, invite 3 of 8 applicants and write one sentence about what each invited person did themselves. One job shows version A (today: answer after the assistant + Match Score), the other version B (fields on top, the same answer and Match Score below).

## Scope

- Employer candidate list `/#/app/kandydaci` (EMP-07): in version B the card shows a short "Moja część" excerpt above the score and summary.
- Employer application detail `/#/app/kandydaci/:id` (EMP-08): in version B the Answer tab shows the three fields first, then the submitted answer. **Match Score stays visible, below the fields** (human decision 2026-11-11).
- Out of scope for E1: candidate application form `/#/aplikuj/:slug` (CAN-09). Three fields there belong to E2.

## Decisions

1. **No variant switch.** Version is a property of the data: applications with ownership fields render them, applications without them render as today. Fits the repository rule against hidden local switches and experiment metadata (OPS-02, OPS-05, CAN-11).
2. **Reuse the existing E1 dataset, do not rebuild it** (human decision 2026-11-11). The 16 applications (2 jobs × 3 continued + 5 rejected, fixed seed 42, fields split mechanically from the raw answer, nothing added) are already frozen as JSON in the vault prototype `3-Projects/doroboty-ai/prototypes/e3-panel-firmy/index.html`, built by its `build_data.py`. A small converter reads that JSON and maps it to this app's `stateSchema`; selection and splitting logic are not reimplemented.
3. **Counterbalancing through two importable scenario files.** File 1: fields on job K; file 2: fields on job Z. Half of the participants get each file. Import/reset already exist (SYS-10, CAN-17).
4. **Measurement on existing mechanics.** Invitation = stage change to `interview_invited` (via `reviewed`); the one sentence = recruiter note; order and time of choices come from stage history in the exported scenario JSON. True first-conversation outcomes stay in a separate facilitator file, never in the app state. A script scores hits from the export.

## Data mapping (converter)

- Company: both jobs belong to the BrightLabs persona (Karolina Wiśniewska); the vault company names Obieg Labs / Splot Studio are dropped. Job titles and texts are already fictional.
- Jobs: two new published jobs with the vault titles, category `apply`, seniority junior / senior, local salary data.
- People: 16 synthetic candidate personas (fictional names from the dataset), `cv` minimum 20 chars of synthetic text, `exampleScore` = the dataset score.
- Applications: `answer` = `application_answer_final`, `score` = rounded `match_score`, stage `submitted`, one `submitted` event; for the version B job additionally `ownership: { mine, team, result }`. Empty field renders "nie podano".
- The demo `application-example` is not included in the E1 scenarios.

## Model change

Add an optional `ownership` object (`mine`, `team`, `result`, plain text) to `applicationSchema`. Optional keeps version-1 saves and imports valid; no version bump.

## Risks and open points

- 16 extra candidate personas will appear in the person picker. Acceptable for a facilitated session; filter later if it confuses participants.
- The course data are synthetic and many applications share identical text with different outcomes, so hits mostly measure whether the recruiter separates own-scope answers from generic ones, not interview predictability (same limit as the vault prototype).
- The app has no candidate writing assistant (CAN-12 removed); version A's "after assistant" text is prepared data, not a live assistant.

## Acceptance criteria (for the later implementation)

- Version A applications look exactly as today; version B applications show the three fields above the answer and the score below them, on list and detail, desktop and mobile (320px), keyboard accessible, Poster People design system.
- Both scenario files import without validation errors; reset restores the default scenario.
- Inviting, notes and history work unchanged; the export contains everything needed to score hits; no outcome is visible in the UI.
- FEATURES.md updated (EMP-07, EMP-08, model); `./scripts/verify` passes; separate review pass.

## Implementation and validation (2026-11-11)

- Model: optional `ownership` on applications. UI: `ownership-fields.tsx`, `application-record.tsx`, employer list in `workspace.tsx`, styles in `records.css`.
- Scenarios: `node scripts/e1-scenarios.mjs <vault>/3-Projects/doroboty-ai/prototypes/e3-panel-firmy/index.html` wrote `docs/case/e1/scenario-pola-K.json`, `scenario-pola-Z.json` and the facilitator-only `facilitator/e1/outcomes.json`. Scoring: `node scripts/e1-score.mjs <export.json>`.
- Session links: `#/app/kandydaci?q=katalog` (job K) and `#/app/kandydaci?q=obsługa` (job Z).
- Executed: prettier check, design-system file integrity (67 files), lint, typecheck, 31 unit tests (4 new in `e1-scenarios.test.ts`), baseline packet verify, production build — all passed.
- Not executed: agent-kit check requires Node 24 (machine has Node 26); Playwright e2e needs a provisioned Chromium, which is missing and was not installed. `./scripts/verify` therefore did not complete.
- Screenshots before/after (local, git-ignored): `artifacts/e1-ownership-fields/przed/` and `artifacts/e1-ownership-fields/po/`, 1280 and 390 px, taken with system Chrome.
- Data note: some source answers name a different area than the job (e.g. "obsługa zgłoszeń" under job K); this comes from the synthetic course data and is kept unchanged.

## Follow-up: keep real outcomes out of Git and the participant package (2026-11-17)

Intent: the readiness audit found that `docs/case/e1/outcomes.json` (real first-conversation outcomes) sat in the unpushed E1 commit of a public fork, and `scripts/package-participant.mjs` copies all of `docs/case` into the participant package.

Acceptance: outcomes live only in git-ignored `facilitator/e1/`; no commit that will be pushed contains them; `docs/case/e1` holds only the two importable scenarios; tests pass in a fresh checkout without the facilitator file; the participant package contains no outcomes file.

Done: the scenario script writes outcomes to `facilitator/e1/` (third argument), the score script reads it by default, `.gitignore` excludes `facilitator/`, the unit test derives the job split from the scenario itself, asserts the shipped folder contents and runs the outcome-count check only when the facilitator file exists. The unpushed E1 commit was amended so the file never enters history.
