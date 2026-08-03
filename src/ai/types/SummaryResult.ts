import type { z } from "zod";

import type {
  EvidenceItemSchema,
  MissingInformationItemSchema,
  SummaryFindingSchema,
  SummaryPriority,
  SummarySchema,
} from "../schemas/SummarySchema";

/**
 * The structured output of SummaryModule — the organized, highlighted, and
 * traceable synthesis of an AssessmentResult, prepared as clean evidence for
 * DiagnosisModule.
 *
 * Types are derived from {@link SummarySchema} so the runtime schema is the
 * single source of truth (no drift between validation and types). See
 * `docs/clinical/summary-specification.md` for the clinical contract.
 */
export type SummaryResult = z.infer<typeof SummarySchema>;

/** One consolidated, prioritized, evidence-linked finding within a summary. */
export type SummaryFinding = z.infer<typeof SummaryFindingSchema>;

/** A single traceable supporting fact ({ source, text }). */
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

/** A single piece of not-provided information ({ field, reason? }). */
export type MissingInformationItem = z.infer<typeof MissingInformationItemSchema>;

/** Salience ranking for a finding ("high" | "medium" | "low"). */
export type SummaryPriorityLevel = z.infer<typeof SummaryPriority>;
