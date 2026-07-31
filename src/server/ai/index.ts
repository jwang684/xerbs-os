import OpenAI from "openai";

import { FakeDiagnosisProvider } from "./fake-provider";
import { OpenAiDiagnosisProvider } from "./openai-provider";
import type { DiagnosisProvider } from "./provider";

export * from "./provider";

/**
 * Selects the diagnosis provider from the AI_PROVIDER env var. This is the only
 * place that knows about concrete providers; the service depends on the
 * DiagnosisProvider interface, so adding/swapping a provider changes only here.
 */
export function getDiagnosisProvider(): DiagnosisProvider {
  const which = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

  switch (which) {
    case "fake":
      return new FakeDiagnosisProvider();
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }
      const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      return new OpenAiDiagnosisProvider(new OpenAI({ apiKey }), model);
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${which}`);
  }
}
