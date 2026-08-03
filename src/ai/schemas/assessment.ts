import { z } from "zod";

/**
 * Output schema for the AssessmentModule.
 *
 * Intentionally small: the assessment only ORGANIZES clinical findings — it does
 * not diagnose, interpret, or recommend anything. Add fields here as the module
 * grows; unknown keys are stripped, so extending it is non-breaking.
 */
export const AssessmentSchema = z.object({
  /** The patient's main reason for the visit, in their own terms. */
  chiefComplaint: z.string(),
  /** A concise, factual summary of reported symptoms/findings (no interpretation). */
  symptomSummary: z.string(),
  /** Reported findings that may warrant urgent attention; empty if none. */
  redFlags: z.array(z.string()).default([]),
  /** How complete/clear the provided information is (0–1), not a medical judgment. */
  confidence: z.number().min(0).max(1),
});

export type AssessmentResult = z.infer<typeof AssessmentSchema>;
