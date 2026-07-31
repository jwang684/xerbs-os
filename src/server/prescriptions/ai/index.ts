import OpenAI from "openai";

import { FakePrescriptionProvider } from "./fake-prescription-provider";
import { OpenAiPrescriptionProvider } from "./openai-prescription-provider";
import type { PrescriptionProvider } from "./prescription-provider";

export * from "./prescription-provider";

/**
 * Selects the prescription provider from AI_PROVIDER. Separate from the
 * diagnosis provider factory; swapping providers changes only this file.
 */
export function getPrescriptionProvider(): PrescriptionProvider {
  const which = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

  switch (which) {
    case "fake":
      return new FakePrescriptionProvider();
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }
      const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      return new OpenAiPrescriptionProvider(new OpenAI({ apiKey }), model);
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${which}`);
  }
}
