// PatentSale — commercialization stage definitions + helpers.
// Shown as a labeled badge on marketplace cards, detail, and admin lists.

export type PatentStage =
  | "research"
  | "prototype"
  | "pilot"
  | "commercial"
  | "market-ready"
  | "licensing";

export const STAGES: { value: PatentStage; label: string; description: string }[] = [
  { value: "research", label: "Research", description: "Early-stage; the invention is documented but not yet reduced to practice in a commercial context." },
  { value: "prototype", label: "Prototype", description: "A working prototype exists; feasibility is demonstrated but not yet at pilot scale." },
  { value: "pilot", label: "Pilot", description: "Pilot deployments or small-scale trials are underway or available." },
  { value: "commercial", label: "Commercial", description: "Commercial application is established; the technology is in active use or ready for it." },
  { value: "market-ready", label: "Market Ready", description: "Fully de-risked for commercialization; turnkey for licensees and assignees." },
  { value: "licensing", label: "Licensing", description: "Available for licensing; licensing terms are defined or negotiable." },
];

export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.value, s])) as Record<
  PatentStage,
  { value: PatentStage; label: string; description: string }
>;

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return "Unspecified";
  return STAGE_MAP[stage as PatentStage]?.label || stage;
}

export function stageDescription(stage: string | null | undefined): string {
  if (!stage) return "";
  return STAGE_MAP[stage as PatentStage]?.description || "";
}

// Tailwind classes for the stage badge — blue family, darker = more mature.
export function stageBadgeClass(stage: string | null | undefined): string {
  switch (stage) {
    case "research":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40";
    case "prototype":
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40";
    case "pilot":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40";
    case "commercial":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700/50";
    case "market-ready":
      return "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/40";
    case "licensing":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
