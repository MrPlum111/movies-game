import type { CreditRole } from "./types";

const DIRECTOR_JOBS = new Set(["Director"]);
const WRITER_JOBS = new Set([
  "Writer",
  "Screenplay",
  "Story",
  "Teleplay",
  "Characters",
]);
const PRODUCER_JOBS = new Set([
  "Producer",
  "Executive Producer",
  "Co-Producer",
  "Associate Producer",
]);

export function roleFromJob(job: string): CreditRole | null {
  if (DIRECTOR_JOBS.has(job)) return "directing";
  if (WRITER_JOBS.has(job)) return "writing";
  if (PRODUCER_JOBS.has(job)) return "producing";
  return null;
}

export function isLinkableCrewJob(job: string): boolean {
  return roleFromJob(job) !== null;
}

export function mergeRoles(existing: CreditRole[], next: CreditRole): CreditRole[] {
  if (existing.includes(next)) return existing;
  return [...existing, next];
}
