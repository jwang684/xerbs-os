import type { AIContext } from "../types/AIContext";
import type { KnowledgeBundle } from "../types/Knowledge";

/** A named prompt template. Template text is supplied by callers, not here. */
export interface PromptTemplate {
  key: string;
  /** Template body with `{{dotted.path}}` placeholders. */
  template: string;
}

/** Where {@link PromptBuilder} looks up templates by key. */
export interface TemplateStore {
  get(key: string): PromptTemplate | undefined;
}

/** Inputs available to a template when building a prompt. */
export interface PromptInput {
  context: AIContext;
  knowledge?: KnowledgeBundle;
  /** Extra, module-specific variables exposed to the template. */
  variables?: Record<string, unknown>;
}

/** A simple in-memory template store. Starts empty; ships no templates. */
export class InMemoryTemplateStore implements TemplateStore {
  private readonly templates = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): this {
    this.templates.set(template.key, template);
    return this;
  }

  get(key: string): PromptTemplate | undefined {
    return this.templates.get(key);
  }
}

/**
 * Builds a final prompt string by looking up a template and injecting values
 * from the {@link AIContext}, loaded knowledge, and module variables.
 *
 * It owns no prompt text and no medical knowledge — only the mechanics of
 * template lookup and `{{path}}` substitution. Missing variables fail fast so a
 * malformed prompt is never sent to a provider.
 */
export class PromptBuilder {
  constructor(private readonly store: TemplateStore) {}

  build(templateKey: string, input: PromptInput): string {
    const template = this.store.get(templateKey);
    if (!template) throw new Error(`Prompt template not found: ${templateKey}`);

    const scope: Record<string, unknown> = {
      ...(input.variables ?? {}),
      context: input.context,
      knowledge: input.knowledge ?? input.context.knowledge,
      results: input.context.results,
    };

    return template.template.replace(
      /\{\{\s*([\w.]+)\s*\}\}/g,
      (_match, path: string) => {
        const value = getPath(scope, path);
        if (value === undefined || value === null) {
          throw new Error(
            `Missing prompt variable "${path}" for template "${templateKey}"`,
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
