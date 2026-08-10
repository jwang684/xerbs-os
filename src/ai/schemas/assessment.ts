import { z } from "zod";

/** How the patient characterizes a symptom's intensity (as reported). */
export const SymptomSeverity = z.enum(["mild", "moderate", "severe", "unknown"]);

/**
 * A single reported symptom, organized into structured fields. Every field is a
 * faithful restatement of what the patient reported — no interpretation.
 */
export const ReportedSymptomSchema = z.object({
  /** Short symptom name/label, in the patient's terms (e.g. "frontal headache"). */
  name: z.string(),
  /** How long it has been present, if stated (e.g. "2 weeks"). */
  duration: z.string().optional(),
  /** How/when it began, if stated (e.g. "gradual", "after a cold"). */
  onset: z.string().optional(),
  /** Reported intensity; "unknown" when not stated. */
  severity: SymptomSeverity.default("unknown"),
  /** Aggravating/relieving factors, timing, or other reported detail. */
  notes: z.string().optional(),
});

/**
 * Output schema for the AssessmentModule — a high-quality, structured intake.
 *
 * It ORGANIZES the patient's reported information; it does not diagnose,
 * interpret, or recommend anything. Arrays default to empty so partial intakes
 * still validate, and unknown keys are stripped so the schema extends without
 * breaking.
 */
export const AssessmentSchema = z.object({
  /** The patient's main reason for the visit, in their own words. */
  chiefComplaint: z.string(),
  /** Structured list of reported symptoms with their reported attributes. */
  presentingSymptoms: z.array(ReportedSymptomSchema).default([]),
  /** A concise, factual narrative summary of the reported findings. */
  symptomSummary: z.string(),
  /** Reported history relevant to the visit: conditions, medications, allergies. */
  relevantHistory: z.array(z.string()).default([]),
  /** Reported findings that may warrant urgent attention; empty if none. */
  redFlags: z.array(z.string()).default([]),
  /** Information a clinician would likely want but that was not provided. */
  dataGaps: z.array(z.string()).default([]),
  /** How complete/clear the provided information is (0–1); a data-quality signal. */
  confidence: z.number().min(0).max(1),
});

export type ReportedSymptom = z.infer<typeof ReportedSymptomSchema>;
export type AssessmentResult = z.infer<typeof AssessmentSchema>;
