import type {
  KnowledgeContract,
  KnowledgeRegistryEntry,
  KnowledgeSource,
} from "./KnowledgeRegistry";

/**
 * The production knowledge inventory — the single source of truth (Knowledge
 * Layer) mapping each opaque identifier to its source and validation contract.
 *
 * Per the frozen Registry Completeness Rule (§3a), the registry is the COMPLETE
 * inventory of requestable knowledge interfaces, independent of authored content:
 * every interface a module may request has exactly one entry here, even while its
 * curated content is still empty. Registry and content are distinct concerns —
 * the registry is complete now; content is populated later, per identifier,
 * without any loader change (Registry Evolution Principle, §10a).
 *
 * The identifier strings below are Knowledge-Layer vocabulary and legitimately
 * live here; the loader mechanism remains entirely generic and unaware of them.
 */

/**
 * Source for an interface whose curated content is not yet authored: it yields
 * nothing. The loader surfaces "nothing" as absent knowledge (Option B).
 */
const emptySource: KnowledgeSource = () => undefined;

/**
 * Placeholder validation contract used until each interface's real structural
 * contract is authored. Absence of content is a valid "empty" outcome (value
 * `undefined`), which the loader treats as absent knowledge — never fabricated.
 * Any present-but-uncontracted content is refused, so unvalidated content can
 * never be served. When content is authored, each entry adopts its own contract.
 */
const unauthoredContract: KnowledgeContract = (raw) =>
  raw === undefined || raw === null
    ? { valid: true, value: undefined }
    : {
        valid: false,
        issues: ["no validation contract authored for this interface yet"],
      };

/** A complete registry entry whose content is pending authoring (source + contract present). */
function pending(identifier: string): KnowledgeRegistryEntry {
  return { identifier, source: emptySource, contract: unauthoredContract };
}

export const productionKnowledgeRegistry: readonly KnowledgeRegistryEntry[] = [
  pending("diagnosisPatternDefinitions"),
  pending("formulaDefinitions"),
  pending("patternTreatmentMap"),
  pending("prescriptionFormulaDefinitions"),
  pending("treatmentFormulaMap"),
  pending("formulaCatalog"),
  pending("herbCatalog"),
];
