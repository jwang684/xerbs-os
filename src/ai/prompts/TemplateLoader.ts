import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads a prompt template body by name.
 *
 * The abstraction lets {@link PromptBuilder} stay agnostic to where templates
 * live (filesystem, DB, in-memory for tests). Implementations return the raw
 * template text; interpolation is the builder's job.
 */
export interface TemplateLoader {
  /** Returns the template body for `name`, or throws if it does not exist. */
  load(name: string): string;
}

/**
 * Loads templates from `src/ai/prompts/templates/<name>.md` and caches them.
 *
 * Note: resolved relative to this module. In a bundled runtime the templates
 * directory must be present alongside it (or a `baseDir` supplied) — a
 * deployment concern to settle when a real provider is wired in.
 */
export class FileTemplateLoader implements TemplateLoader {
  private readonly baseDir: string;
  private readonly cache = new Map<string, string>();

  constructor(baseDir?: string) {
    this.baseDir =
      baseDir ?? join(dirname(fileURLToPath(import.meta.url)), "templates");
  }

  load(name: string): string {
    const cached = this.cache.get(name);
    if (cached !== undefined) return cached;
    try {
      const body = readFileSync(join(this.baseDir, `${name}.md`), "utf8");
      this.cache.set(name, body);
      return body;
    } catch {
      throw new Error(`Prompt template not found: ${name}`);
    }
  }
}

/** An in-memory loader, primarily for tests and dynamic templates. */
export class InMemoryTemplateLoader implements TemplateLoader {
  private readonly templates = new Map<string, string>();

  register(name: string, body: string): this {
    this.templates.set(name, body);
    return this;
  }

  load(name: string): string {
    const body = this.templates.get(name);
    if (body === undefined) throw new Error(`Prompt template not found: ${name}`);
    return body;
  }
}
