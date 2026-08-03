/**
 * Minimal, library-agnostic schema contract. Any object exposing a `safeParse`
 * satisfies it — notably a Zod schema — so modules can bring their own schemas
 * without the validator depending on a specific validation library.
 */
export interface Schema<T> {
  safeParse(
    data: unknown,
  ): { success: true; data: T } | { success: false; error: unknown };
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: string[] };

/**
 * Validates model output against a {@link Schema}, independent of any AI
 * provider. It normalizes failures into a flat list of human-readable issues so
 * callers don't couple to a particular error type.
 */
export class SchemaValidator {
  /** Validates already-parsed data. */
  validate<T>(schema: Schema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);
    if (result.success) return { success: true, data: result.data };
    return { success: false, issues: this.describe(result.error) };
  }

  /** Parses JSON text (the typical raw model output), then validates it. */
  validateJson<T>(schema: Schema<T>, text: string): ValidationResult<T> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, issues: ["Response was not valid JSON"] };
    }
    return this.validate(schema, parsed);
  }

  /** Best-effort flattening of an unknown error into readable messages. */
  private describe(error: unknown): string[] {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (
        error as { issues?: Array<{ path?: unknown[]; message?: string }> }
      ).issues;
      if (Array.isArray(issues)) {
        return issues.map(
          (i) =>
            `${(i.path ?? []).join(".") || "(root)"}: ${i.message ?? "invalid"}`,
        );
      }
    }
    return [error instanceof Error ? error.message : String(error)];
  }
}
