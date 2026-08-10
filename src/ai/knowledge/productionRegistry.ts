import type {
  KnowledgeContract,
  KnowledgeRegistryEntry,
  KnowledgeSource,
} from "./KnowledgeRegistry";
import { diagnosisPatternCatalogContract } from "./contracts/diagnosisPatternCatalogContract";
import { diagnosisPatternDefinitionsContract } from "./contracts/diagnosisPatternDefinitionsContract";
import { formulaCatalogContract } from "./contracts/formulaCatalogContract";
import { formulaDefinitionCatalogContract } from "./contracts/formulaDefinitionCatalogContract";
import { formulaDefinitionsContract } from "./contracts/formulaDefinitionsContract";
import { herbCatalogContract } from "./contracts/herbCatalogContract";
import { patternTreatmentMapContract } from "./contracts/patternTreatmentMapContract";
import { prescriptionFormulaDefinitionsContract } from "./contracts/prescriptionFormulaDefinitionsContract";
import { treatmentFormulaMapContract } from "./contracts/treatmentFormulaMapContract";
import { diagnosisPatternCatalogSource } from "./sources/diagnosisPatternCatalogSource";
import { diagnosisPatternDefinitionsSource } from "./sources/diagnosisPatternDefinitionsSource";
import { formulaCatalogSource } from "./sources/formulaCatalogSource";
import { formulaDefinitionCatalogSource } from "./sources/formulaDefinitionCatalogSource";
import { formulaDefinitionsSource } from "./sources/formulaDefinitionsSource";
import { herbCatalogSource } from "./sources/herbCatalogSource";
import { patternTreatmentMapSource } from "./sources/patternTreatmentMapSource";
import { prescriptionFormulaDefinitionsSource } from "./sources/prescriptionFormulaDefinitionsSource";
import { treatmentFormulaMapSource } from "./sources/treatmentFormulaMapSource";

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
  {
    identifier: "diagnosisPatternDefinitions",
    source: diagnosisPatternDefinitionsSource,
    contract: diagnosisPatternDefinitionsContract,
  },
  {
    identifier: "diagnosisPatternCatalog",
    source: diagnosisPatternCatalogSource,
    contract: diagnosisPatternCatalogContract,
  },
  {
    identifier: "formulaDefinitions",
    source: formulaDefinitionsSource,
    contract: formulaDefinitionsContract,
  },
  {
    identifier: "patternTreatmentMap",
    source: patternTreatmentMapSource,
    contract: patternTreatmentMapContract,
  },
  {
    identifier: "prescriptionFormulaDefinitions",
    source: prescriptionFormulaDefinitionsSource,
    contract: prescriptionFormulaDefinitionsContract,
  },
  {
    identifier: "treatmentFormulaMap",
    source: treatmentFormulaMapSource,
    contract: treatmentFormulaMapContract,
  },
  {
    identifier: "formulaCatalog",
    source: formulaCatalogSource,
    contract: formulaCatalogContract,
  },
  {
    identifier: "formulaDefinitionCatalog",
    source: formulaDefinitionCatalogSource,
    contract: formulaDefinitionCatalogContract,
  },
  {
    identifier: "herbCatalog",
    source: herbCatalogSource,
    contract: herbCatalogContract,
  },
];
