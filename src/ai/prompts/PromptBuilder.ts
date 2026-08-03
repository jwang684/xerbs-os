import type { AIContext } from "../types/AIContext";
import type { KnowledgeBundle } from "../types/Knowledge";
import type { TemplateLoader } from "./TemplateLoader";

/** Inputs available to a template when building a prompt. */
export interface PromptInput {
  context: AIContext;
  knowledge?: KnowledgeBundle;
  /** Extra, module-specific variables exposed to the template. */
  variables?: Record<string, unknown>;
}

/**
 * Builds a final prompt string: it loads a named template through a
 * {@link TemplateLoader} and injects values from the {@link AIContext}, loaded
 * knowledge, and module variables.
 *
 * It owns no prompt text and no medical knowledge — only template lookup (via
 * the loader) and `{{dotted.path}}` substitution. Missing variables fail fast so
 * a malformed prompt is never sent to a provider.
 */
export class PromptBuilder {
  constructor(private readonly loader: TemplateLoader) {}

  build(templateName: string, input: PromptInput): string {
    const template = this.loader.load(templateName);

    const scope: Record<string, unknown> = {
      ...(input.variables ?? {}),
      context: input.context,
      knowledge: input.knowledge ?? input.context.knowledge,
      results: input.context.results,
    };

    return template.replace(
      /\{\{\s*([\w.]+)\s*\}\}/g,
      (_match, path: string) => {
        const value = getPath(scope, path);
        if (value === undefined || value === null) {
          throw new Error(
            `Missing prompt variable "${path}" for template "${templateName}"`,
          );
        }
        return typeof value === "string" ? value : JSON.stringify(value);
      },
    );
  }
}

/** Resolves a dotted path against a nested object, returning undefined if absent. */
function getPath(scope: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, scope);
}
