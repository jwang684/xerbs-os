import type { KnowledgeBundle, KnowledgeRequest } from "../types/Knowledge";

/**
 * Loads domain knowledge (questionnaires, symptoms, herbs, formulas) for a run.
 *
 * This is the seam between the AI foundation and the (future) knowledge base:
 * modules declare what they need via a {@link KnowledgeRequest}; the loader
 * returns a {@link KnowledgeBundle}. Implementations decide the source (files,
 * DB, remote) — none of that leaks into the engine or modules.
 */
export interface KnowledgeLoader {
  /** Loads only the slices requested; an empty request loads nothing. */
  load(request?: KnowledgeRequest): Promise<KnowledgeBundle>;
  loadQuestionnaires(): Promise<unknown>;
  loadSymptoms(): Promise<unknown>;
  loadHerbs(): Promise<unknown>;
  loadFormulas(): Promise<unknown>;
}

/**
 * A no-op loader that returns empty knowledge. It defines the contract and lets
 * the engine run end to end without a knowledge base. It hardcodes no medical
 * data — a real loader replaces it later.
 */
export class StubKnowledgeLoader implements KnowledgeLoader {
  async load(request: KnowledgeRequest = {}): Promise<KnowledgeBundle> {
    const bundle: KnowledgeBundle = {};
    if (request.questionnaires) bundle.questionnaires = await this.loadQuestionnaires();
    if (request.symptoms) bundle.symptoms = await this.loadSymptoms();
    if (request.herbs) bundle.herbs = await this.loadHerbs();
    if (request.formulas) bundle.formulas = await this.loadFormulas();
    return bundle;
  }

  loadQuestionnaires(): Promise<unknown> {
    return Promise.resolve([]);
  }
  loadSymptoms(): Promise<unknown> {
    return Promise.resolve([]);
  }
  loadHerbs(): Promise<unknown> {
    return Promise.resolve([]);
  }
  loadFormulas(): Promise<unknown> {
    return Promise.resolve([]);
  }
}
