import type { z } from "zod";

import type {
  ExecutablePrescriptionSchema,
  PrescribedHerbSchema,
  PrescriptionEvidenceSchema,
  PrescriptionSchema,
} from "../schemas/PrescriptionSchema";

/**
 * The structured output of PrescriptionModule — ONE executable prescription (or
 * an explicit insufficient-evidence outcome), with its own reasoning and
 * evidence, plus an overall prescription confidence.
 *
 * Prescription is the EXECUTION layer and it CONVERGES: unlike the divergent
 * Diagnosis (`candidates[]`) and Formula (`treatmentHypotheses[]`) results, it
 * carries a single optional `prescription`, never an array of competing
 * prescriptions.
 *
 * Types are derived from {@link PrescriptionSchema} so the runtime schema is the
 * single source of truth (no drift between validation and types). See
 * `docs/clinical/prescription-specification.md` for the clinical contract.
 */
export type PrescriptionResult = z.infer<typeof PrescriptionSchema>;

/** The single executable prescription (named formula + composition + directions). */
export type ExecutablePrescription = z.infer<
  typeof ExecutablePrescriptionSchema
>;

/** One prescribed herb ({ name, quantity }). */
export type PrescribedHerb = z.infer<typeof PrescribedHerbSchema>;

/** A single traceable supporting/conflicting fact ({ source, text }). */
export type PrescriptionEvidence = z.infer<typeof PrescriptionEvidenceSchema>;
