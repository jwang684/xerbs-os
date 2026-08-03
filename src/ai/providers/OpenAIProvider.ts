import OpenAI from "openai";

import type { AIProvider, GenerateRequest, GenerateResult } from "./AIProvider";

export interface OpenAIProviderOptions {
  apiKey?: string;
  /** Default model id used when a request does not specify one. */
  model?: string;
  baseURL?: string;
  /** Injectable client (tests). Typed loosely so no SDK type leaks to callers. */
  client?: unknown;
}

/**
 * OpenAI implementation of {@link AIProvider}, using the Responses API.
 *
 * This is the ONLY place the OpenAI SDK is used; the rest of the framework sees
 * just the {@link AIProvider} contract. It maps the vendor-neutral
 * {@link GenerateRequest} onto OpenAI's request shape and returns the raw text
 * (validation happens upstream in the module via the schema).
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model?: string;

  constructor(options: OpenAIProviderOptions = {}) {
    this.client =
      (options.client as OpenAI | undefined) ??
      new OpenAI({ apiKey: options.apiKey, baseURL: options.baseURL });
    this.model = options.model;
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const model =
      (request.options?.model as string | undefined) ?? this.model;
    if (!model) {
      throw new Error(
        "OpenAIProvider: no model configured (set OPENAI_MODEL or provide one via AIConfig)",
      );
    }

    const response = await this.client.responses.create({
      model,
      input: request.prompt,
      instructions: request.system,
      temperature: request.temperature,
      max_output_tokens: request.maxTokens,
      ...(request.responseFormat === "json"
        ? { text: { format: { type: "json_object" as const } } }
        : {}),
    });

    return {
      text: response.output_text ?? "",
      metadata: { model: response.model, usage: response.usage ?? undefined },
    };
  }
}
