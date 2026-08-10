import type { KnowledgeRegistryEntry } from "./KnowledgeRegistry";
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
 * inventory of requestable knowledge interfaces. All nine interfaces are now
 * wired with a real source and structural contract; serving a future interface
 * means adding an entry here (with its source, contract, and content) — never
 * changing the loader (Registry Evolution Principle, §10a).
 *
 * The identifier strings below are Knowledge-Layer vocabulary and legitimately
 * live here; the loader mechanism remains entirely generic and unaware of them.
 */

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
