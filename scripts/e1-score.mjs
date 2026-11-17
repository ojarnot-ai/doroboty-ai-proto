#!/usr/bin/env node
// Scores one E1 session from a scenario export (/#/app/settings → export).
// Invitation = stage `interview_invited`; the recruiter's sentence = notes written on stage changes.
//
// Usage: node scripts/e1-score.mjs <export.json> [outcomes=facilitator/e1/outcomes.json]
// The outcomes file is facilitator-only and git-ignored; see scripts/e1-scenarios.mjs.
import fs from "node:fs";

const [exportFile, outcomesFile = "facilitator/e1/outcomes.json"] = process.argv.slice(2);
if (!exportFile) {
  console.error("Usage: node scripts/e1-score.mjs <export.json> [outcomes.json]");
  process.exit(1);
}
const state = JSON.parse(fs.readFileSync(exportFile, "utf8"));
const { jobs, outcomes } = JSON.parse(fs.readFileSync(outcomesFile, "utf8"));
const byId = new Map(outcomes.map((o) => [o.applicationId, o]));
const RANDOM_HITS = (3 * 3) / 8;

const report = Object.entries(jobs).map(([code, title]) => {
  const apps = state.applications.filter((a) => byId.get(a.id)?.job === code);
  const changes = apps.flatMap((a) => a.events.slice(1).map((e) => Date.parse(e.at)));
  const invited = apps
    .map((a) => ({ a, invite: a.events.find((e) => e.stage === "interview_invited") }))
    .filter((x) => x.invite)
    .sort((x, y) => x.invite.at.localeCompare(y.invite.at))
    .map(({ a, invite }) => ({
      candidate: a.candidateName,
      invitedAt: invite.at,
      continuedInReality: byId.get(a.id).continued,
      notes: a.events
        .slice(1)
        .map((e) => e.note)
        .filter(Boolean),
    }));
  return {
    job: code,
    title,
    version: apps.some((a) => a.ownership) ? "B (z polami)" : "A (dzisiejsza)",
    invitedCount: invited.length,
    hits: invited.filter((x) => x.continuedInReality).length,
    randomHitsFor3: RANDOM_HITS,
    minutesFromFirstToLastChange: changes.length
      ? Math.round((Math.max(...changes) - Math.min(...changes)) / 6000) / 10
      : null,
    invited,
  };
});
console.log(JSON.stringify(report, null, 2));
