/**
 * Derivation-layer verification for `patternTreatmentMap`.
 *
 * Pattern Treatment Map Wiring Sprint · Step 1. Proves the structured runtime
 * representation is a complete, structurally sound, pattern- and principle-faithful,
 * source-order-faithful, deterministic, drift-free derivation of the authoritative authored
 * corpus. The "no drift" case re-derives from the markdown and asserts the checked-in
 * generated artifact matches, so a stale artifact fails the suite instead of shipping. No
 * registry, source, contract, loader, module, or runtime path is touched here.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { patternTreatmentMapData } from "../generated/pattern-treatment-map.generated";
import { parsePatternTreatmentMap } from "./patternTreatmentMapParser";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = resolve(here, "../pattern-treatment-map.md");
const markdown = readFileSync(SOURCE_PATH, "utf8");

describe("patternTreatmentMap derivation", () => {
  const parsed = parsePatternTreatmentMap(markdown);

  it("PTMD-1 count fidelity: generated count equals authored association count", () => {
    const authoredLines = markdown
      .split(/\r?\n/)
      .filter((line) => /^-\s+\*\*.+?\*\*\s+—\s+.+$/.test(line));
    expect(parsed).toHaveLength(authoredLines.length);
    expect(patternTreatmentMapData).toHaveLength(authoredLines.length);
  });

  it("PTMD-2 structural integrity: every entry has exactly two non-empty string fields", () => {
    for (const entry of patternTreatmentMapData) {
      expect(Object.keys(entry).sort()).toEqual(["pattern", "principle"]);
      expect(typeof entry.pattern).toBe("string");
      expect(entry.pattern.trim().length).toBeGreaterThan(0);
      expect(typeof entry.principle).toBe("string");
      expect(entry.principle.trim().length).toBeGreaterThan(0);
    }
  });

  it("PTMD-3 pattern preservation: generated patterns match a fresh derivation exactly", () => {
    expect(patternTreatmentMapData.map((e) => e.pattern)).toEqual(
      parsed.map((e) => e.pattern),
    );
  });

  it("PTMD-4 principle preservation: generated principles match a fresh derivation exactly", () => {
    expect(patternTreatmentMapData.map((e) => e.principle)).toEqual(
      parsed.map((e) => e.principle),
    );
  });

  it("PTMD-5 source-order preservation: generated order matches authored order", () => {
    const authoredPairs = markdown
      .split(/\r?\n/)
      .map((line) => /^-\s+\*\*(.+?)\*\*\s+—\s+(.+?)\s*$/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => ({ pattern: m[1].trim(), principle: m[2].trim() }));
    expect(patternTreatmentMapData).toEqual(authoredPairs);
  });

  it("PTMD-6 determinism: repeated derivation yields identical output", () => {
    const again = parsePatternTreatmentMap(markdown);
    expect(again).toEqual(parsed);
  });

  it("PTMD-7 no drift: the generated artifact equals a fresh derivation", () => {
    expect(patternTreatmentMapData).toEqual(parsed);
  });
});
