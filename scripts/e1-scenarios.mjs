#!/usr/bin/env node
// Builds the two counterbalanced E1 scenario files (see docs/tasks/e1-ownership-fields.md).
//
// Reuses the frozen E1 dataset of the vault prototype `prototypes/e3-panel-firmy/index.html`
// (16 applications, fixed seed 42, scope fields split mechanically from the raw answer).
// Selection and splitting are NOT reimplemented here; this script only maps that JSON to stateSchema.
//
// Usage: node scripts/e1-scenarios.mjs <path/to/e3-panel-firmy/index.html> [outDir=docs/case/e1] [outcomesDir=facilitator/e1]
// Output: scenario-pola-K.json, scenario-pola-Z.json in outDir (import in /#/app/settings);
//         outcomes.json in outcomesDir — facilitator only, git-ignored, never committed,
//         never shipped in the participant package and never imported into the app.
import fs from "node:fs";
import path from "node:path";

const [source, outDir = "docs/case/e1", outcomesDir = "facilitator/e1"] = process.argv.slice(2);
if (!source) {
  console.error(
    "Usage: node scripts/e1-scenarios.mjs <e3-panel-firmy/index.html> [outDir] [outcomesDir]",
  );
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const marketplace = read("src/features/prototype/data/marketplace.json");
const people = read("src/features/prototype/data/people.json");

const html = fs.readFileSync(source, "utf8");
const match = html.match(/const ADS = (\[.*?\]);\s*\n/s);
if (!match) throw new Error("E1 dataset (const ADS = [...]) not found in " + source);
const ads = JSON.parse(match[1]);

const EMPLOYER_ID = "employer-brightlabs";
const company = people.find((p) => p.id === EMPLOYER_ID).companyId;
const JOB_META = {
  K: {
    slug: "e1-wdrozenia-ai-katalog-produktow",
    summary: "Wdrażaj rozwiązania AI w zespole utrzymującym katalog produktów.",
    publishedAt: "2026-06-03T09:00:00.000Z",
  },
  Z: {
    slug: "e1-wdrozenia-ai-obsluga-zgloszen",
    summary: "Prowadź wdrożenia AI w obsłudze zgłoszeń klientów.",
    publishedAt: "2026-06-05T09:00:00.000Z",
  },
};
const remote = { biuro: "onsite", hybrydowo: "hybrid", zdalnie: "remote" };

function salary(text) {
  const [min, max] = text
    .match(/([\d,]+)–([\d,]+)/)
    .slice(1)
    .map((x) => Math.round(Number(x.replace(",", ".")) * 1000));
  const b2b = text.includes("B2B");
  return {
    salaryMin: min,
    salaryMax: max,
    salaryCurrency: "PLN",
    salaryPeriod: "month",
    salaryKind: b2b ? "net" : "gross",
    contract: b2b ? "b2b" : "employment",
  };
}

const jobs = ads.map((ad) => {
  const meta = JOB_META[ad.code];
  const pay = salary(ad.salary);
  return {
    id: `e1-job-${ad.code.toLowerCase()}`,
    slug: meta.slug,
    companyId: company,
    title: ad.title,
    summary: meta.summary,
    description: `${ad.location} · ${ad.mode} · ${ad.salary.replace("tys,", "tys.")} miesięcznie.\n\nOgłoszenie testowe scenariusza E1. Treść ogłoszenia i aplikacji pochodzi z syntetycznych danych kursowych.`,
    category: "apply",
    function: "operations",
    remoteStatus: remote[ad.mode] ?? "hybrid",
    locations: [ad.location],
    seniority: ad.seniority,
    contract: pay.contract,
    salaryMin: pay.salaryMin,
    salaryMax: pay.salaryMax,
    salaryCurrency: pay.salaryCurrency,
    salaryPeriod: pay.salaryPeriod,
    salaryKind: pay.salaryKind,
    publicationStatus: "published",
    publishedAt: meta.publishedAt,
    expiryAt: "2026-12-31T23:59:00.000Z",
    verificationStatus: "editorial",
  };
});

// Deterministic list order per job, so continued applications are not grouped first.
function shuffled(list, seed) {
  const out = [...list];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const candidates = [];
const outcomes = [];
const baseApplications = [];
ads.forEach((ad, adIndex) => {
  const job = jobs[adIndex];
  shuffled(ad.cands, 42 + adIndex).forEach((c, i) => {
    const key = c.id.replace(/^app-/, "");
    const summary = `Deklarowane doświadczenie: ${c.seniority}.`;
    const cv = "CV nie jest częścią scenariusza E1. Oceń kandydata na podstawie aplikacji.";
    candidates.push({
      id: `e1-candidate-${key}`,
      role: "candidate",
      name: c.name,
      headline: `Kandydat · ${ad.code}`,
      bio: "Syntetyczna osoba scenariusza E1.",
      location: ad.location,
      cv,
      exampleScore: c.score,
      exampleSummary: summary,
    });
    const at = new Date(Date.parse(job.publishedAt) + (i + 1) * 3_600_000).toISOString();
    baseApplications.push({
      code: ad.code,
      application: {
        id: `e1-application-${key}`,
        candidateId: `e1-candidate-${key}`,
        jobId: job.id,
        companyId: company,
        jobTitle: job.title,
        candidateName: c.name,
        cv,
        answer: c.text,
        sourceNotes: "",
        generatedAnswer: "",
        score: c.score,
        summary,
        stage: "submitted",
        events: [{ stage: "submitted", at, note: "" }],
      },
      ownership: { mine: c.mine, team: c.team, result: c.result },
    });
    outcomes.push({
      applicationId: `e1-application-${key}`,
      sourceApplicationId: c.id,
      job: ad.code,
      candidateName: c.name,
      continued: c.outcome === "continue",
    });
  });
});

function scenario(fieldsOn) {
  return {
    version: 1,
    activePersonId: EMPLOYER_ID,
    companies: marketplace.companies,
    jobs: [...marketplace.jobs, ...jobs],
    people: [...people, ...candidates],
    applications: baseApplications.map(({ code, application, ownership }) =>
      code === fieldsOn ? { ...application, ownership } : application,
    ),
    saved: [],
    drafts: [],
  };
}

fs.mkdirSync(outDir, { recursive: true });
for (const code of ["K", "Z"]) {
  const file = path.join(outDir, `scenario-pola-${code}.json`);
  fs.writeFileSync(file, JSON.stringify(scenario(code), null, 2) + "\n");
  console.log("wrote", file);
}
const legend = Object.fromEntries(jobs.map((j, i) => [ads[i].code, j.title]));
fs.mkdirSync(outcomesDir, { recursive: true });
fs.writeFileSync(
  path.join(outcomesDir, "outcomes.json"),
  JSON.stringify({ jobs: legend, outcomes }, null, 2) + "\n",
);
console.log("wrote", path.join(outcomesDir, "outcomes.json"));
