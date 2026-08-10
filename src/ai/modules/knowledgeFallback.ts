import type { KnowledgeBundle } from "../types/Knowledge";

/**
 * Option B graceful fallback — a MODULE-tier concern, deliberately not in the
 * framework (the framework transports knowledge; it never fills defaults).
 *
 * Reads an opaque knowledge identifier from the (possibly absent) bundle and
 * returns a prompt-ready string. When the identifier is absent — which is always
 * the case today, since {@link import("../knowledge/KnowledgeLoader").StubKnowledgeLoader}
 * supplies nothing — it returns `"(none provided)"`, so module behaviour is
 * identical whether or not knowledge exists. When a future loader supplies
 * content, a string is passed through unchanged and any other value is serialized
 * into the prompt.
 */
export function knowledgeOrNone(
  knowledge: KnowledgeBundle | undefined,
  identifier: string,
): string {
  const value = knowledge?.[identifier];
  if (value === undefined || value === null) return "(none provided)";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
