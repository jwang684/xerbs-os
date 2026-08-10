/**
 * Derivation-layer verification for `diagnosisPatternDefinitions`.
 *
 * Diagnosis Pattern Definitions Wiring Sprint · Step 1. Proves the structured runtime
 * representation is a complete, structurally sound, identity- and meaning-faithful,
 * source-order-faithful, deterministic, drift-free derivation of the authoritative
 * authored corpus. The "no drift" case re-derives from the markdown and asserts the
 * checked-in generated artifact matches, so a stale artifact fails the suite instead of
 * shipping. No registry, source, contract, loader, module, or runtime path is touched here.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { diagnosisPatternDefinitionsData } from "../generated/diagnosis-pattern-definitions.generated";
import { parseDiagnosisPatternDefinitions } from "./diagnosisPatternDefinitionsParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../diagnosis-pattern-definitions.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

describe("diagnosisPatternDefinitions derivation", () => {
  const parsed = parseDiagnosisPatternDefinitions(markdown);

  it("DPDD-1 count fidelity: generated count equals authored entry count", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\*\*.+?\*\*\s+—\s+.+$/.test(line));
    expect(parsed).toHaveLength(authoredLines.length);
    expect(diagnosisPatternDefinitionsData).toHaveLength(authoredLines.length);
  });

  it("DPDD-2 structural integrity: every entry has exactly two non-empty string fields", () => {
    for (const entry of diagnosisPatternDefinitionsData) {
      expect(Object.keys(entry).sort()).toEqual(["definition", "pattern"]);
      expect(typeof entry.pattern).toBe("string");
      expect(entry.pattern.trim().length).toBeGreaterThan(0);
      expect(typeof entry.definition).toBe("string");
      expect(entry.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("DPDD-3 identity preservation: referenced patterns are unique and match a fresh derivation", () => {
    const patterns = diagnosisPatternDefinitionsData.map((e) => e.pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
    expect(patterns).toEqual(parsed.map((e) => e.pattern));
  });

  it("DPDD-4 definition preservation: definitions match a fresh derivation exactly", () => {
    expect(diagnosisPatternDefinitionsData.map((e) => e.definition)).toEqual(
      parsed.map((e) => e.definition),
    );
  });

  it("DPDD-5 source-order preservation: generated order matches authored order", () => {
    const authoredPatterns = markdown
      .split(/\r?\n/)
      .map((line) => /^-\s+\*\*(.+?)\*\*\s+—\s+.+$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => m[1].trim());
    expect(diagnosisPatternDefinitionsData.map((e) => e.pattern)).toEqual(
      authoredPatterns,
    );
  });

  it("DPDD-6 determinism: repeated derivation yields identical output", () => {
    const again = parseDiagnosisPatternDefinitions(markdown);
    expect(again).toEqual(parsed);
  });

  it("DPDD-7 no drift: the generated artifact equals a fresh derivation", () => {
    expect(diagnosisPatternDefinitionsData).toEqual(parsed);
  });
});
