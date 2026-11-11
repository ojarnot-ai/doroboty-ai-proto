import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseState } from "./storage";
import { initialState, stateSchema } from "./model";

const root = path.resolve(import.meta.dirname, "../../..");
const dir = path.join(root, "docs/case/e1");
// Facilitator-only, git-ignored; absent in fresh checkouts, CI and participant packages.
const outcomesFile = path.join(root, "facilitator/e1/outcomes.json");
const jobTitles: Record<string, string> = {
  K: "Specjalista/ka ds. wdrożeń AI – katalog produktów",
  Z: "Starszy specjalista/ka ds. wdrożeń AI – obsługa zgłoszeń",
};

describe("E1 scenarios", () => {
  for (const code of ["K", "Z"]) {
    it(`scenario with fields on job ${code} imports and keeps version A unchanged`, () => {
      const raw = fs.readFileSync(path.join(dir, `scenario-pola-${code}.json`), "utf8");
      const state = parseState(raw);
      const titleById = new Map(state.jobs.map((job) => [job.id, job.title]));
      const e1 = state.applications.filter((a) => a.id.startsWith("e1-application-"));
      expect(e1).toHaveLength(16);
      for (const a of e1) {
        const title = titleById.get(a.jobId);
        expect(Object.values(jobTitles)).toContain(title);
        expect(Boolean(a.ownership)).toBe(title === jobTitles[code]);
        expect(a.stage).toBe("submitted");
      }
      for (const title of Object.values(jobTitles))
        expect(e1.filter((a) => titleById.get(a.jobId) === title)).toHaveLength(8);
      // Real outcomes never travel inside the importable state.
      expect(raw).not.toMatch(/continue|reject|continued/);
    });
  }

  it("keeps real outcomes out of the shipped case folder", () => {
    expect(fs.readdirSync(dir).sort()).toEqual(["scenario-pola-K.json", "scenario-pola-Z.json"]);
  });

  it.skipIf(!fs.existsSync(outcomesFile))(
    "has 3 continued of 8 per job in the facilitator file",
    () => {
      const outcomes = JSON.parse(fs.readFileSync(outcomesFile, "utf8")) as {
        jobs: Record<string, string>;
        outcomes: { applicationId: string; job: string; continued: boolean }[];
      };
      expect(outcomes.jobs).toEqual(jobTitles);
      for (const code of Object.keys(outcomes.jobs)) {
        const job = outcomes.outcomes.filter((o) => o.job === code);
        expect(job).toHaveLength(8);
        expect(job.filter((o) => o.continued)).toHaveLength(3);
      }
    },
  );

  it("keeps saves without ownership valid", () => {
    expect(stateSchema.parse(initialState()).applications[0].ownership).toBeUndefined();
  });
});
