import type { Application } from "./model";

type Ownership = NonNullable<Application["ownership"]>;

const fields: { key: keyof Ownership; label: string }[] = [
  { key: "mine", label: "Moja część" },
  { key: "team", label: "Zespół" },
  { key: "result", label: "Rezultat" },
];

const EMPTY = "nie podano";

/** Candidate-written scope fields shown before the submitted answer (E1, idea I2). */
export function OwnershipFields({ ownership }: { ownership: Ownership }) {
  return (
    <dl className="ownership-fields">
      {fields.map(({ key, label }) => {
        const value = ownership[key].trim();
        return (
          <div key={key} className="ownership-field">
            <dt>{label}</dt>
            <dd data-empty={value ? undefined : ""}>{value || EMPTY}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** One-line excerpt for list cards; full text stays in the detail view. */
export function ownershipExcerpt(ownership: Ownership, max = 220) {
  const value = ownership.mine.trim();
  if (!value) return EMPTY;
  return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;
}
