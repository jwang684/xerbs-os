import { AssessmentSchema, type AssessmentResult } from "../schemas/assessment";
import type { AIContext } from "../types/AIContext";
import { BaseModule } from "./BaseModule";

/** Serializes a context input for prompt injection (never undefined). */
function toJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

/**
 * The first executable AI module: it ORGANIZES a patient's reported information
 * into a structured {@link AssessmentResult}.
 *
 * It strictly does NOT diagnose, interpret, or recommend herbs/formulas/
 * treatment — those are other (future) modules. It reads the inputs from the
 * {@link AIContext} (patient, visit, questionnaire, history, tongue), renders the
 * `assessment` prompt, and validates the model output against
 * {@link AssessmentSchema}. Provider, model, and tunables come from the injected
 * services/config — nothing is hardcoded here.
 */
export class AssessmentModule extends BaseModule<AssessmentResult> {
  readonly name = "assessment";
  protected readonly templateKey = "assessment";
  protected readonly outputSchema = AssessmentSchema;

  /** Exposes the patient inputs to the prompt as JSON (safe when absent). */
  protected variables(context: AIContext): Record<string, unknown> {
    return {
      patient: toJson(context.patient),
      visit: toJson(context.visit),
      questionnaire: toJson(context.questionnaire),
      history: toJson(context.history),
      tongue: toJson(context.tongue),
    };
  }
}
