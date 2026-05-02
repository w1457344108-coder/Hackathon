import { createHash } from "node:crypto";

export type AnalysisProviderId = "openai" | "deepseek" | "mock";

export interface StructuredGenerationRequest<T> {
  schemaName: string;
  schemaDescription: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
  maxOutputTokens?: number;
  temperature?: number;
  fallback?: T;
}

export interface StructuredGenerationResult<T> {
  ok: boolean;
  object: T;
  providerId: AnalysisProviderId;
  model: string | null;
  usedFallback: boolean;
  errorMessage?: string;
}

export interface AnalysisProvider {
  id: AnalysisProviderId;
  model: string | null;
  generateStructuredObject<T>(
    request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>>;
}

interface OpenAIResponseOutputText {
  type: "output_text";
  text: string;
}

interface OpenAIResponseMessage {
  type: "message";
  role: string;
  content?: OpenAIResponseOutputText[];
}

interface OpenAIResponsesApiResponse {
  error?: {
    message?: string;
  };
  output?: OpenAIResponseMessage[];
}

interface DeepSeekChatCompletionResponse {
  error?: {
    message?: string;
  };
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function getEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function safeStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseStructuredJson<T>(text: string): T {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fencedMatch ? fencedMatch[1] : trimmed) as T;
}

function createFallbackResult<T>(
  request: StructuredGenerationRequest<T>,
  providerId: AnalysisProviderId,
  model: string | null,
  errorMessage?: string
): StructuredGenerationResult<T> {
  if (request.fallback === undefined) {
    throw new Error(
      errorMessage ?? "Structured generation failed and no fallback payload was provided."
    );
  }

  return {
    ok: false,
    object: request.fallback,
    providerId,
    model,
    usedFallback: true,
    errorMessage
  };
}

function extractResponseText(payload: OpenAIResponsesApiResponse) {
  const messageItems = payload.output ?? [];
  const textChunks = messageItems.flatMap((item) =>
    item.type === "message"
      ? (item.content ?? [])
          .filter((contentItem) => contentItem.type === "output_text")
          .map((contentItem) => contentItem.text)
      : []
  );

  return textChunks.join("\n").trim();
}

function buildOpenAIRequestBody<T>(request: StructuredGenerationRequest<T>, model: string) {
  const schemaHash = createHash("sha1").update(safeStringify(request.schema)).digest("hex");

  return {
    model,
    input: request.input,
    instructions: request.instructions,
    max_output_tokens: request.maxOutputTokens ?? 1400,
    temperature: request.temperature ?? 0.2,
    text: {
      format: {
        type: "json_schema",
        name: `${request.schemaName}-${schemaHash.slice(0, 10)}`,
        description: request.schemaDescription,
        strict: true,
        schema: request.schema
      }
    }
  };
}

function getDeepSeekThinkingConfig() {
  const thinkingType = getEnv("DEEPSEEK_THINKING") ?? "disabled";

  if (thinkingType !== "enabled" && thinkingType !== "disabled") {
    return { type: "disabled" };
  }

  return { type: thinkingType };
}

function getDeepSeekReasoningEffort() {
  const reasoningEffort = getEnv("DEEPSEEK_REASONING_EFFORT");

  if (reasoningEffort === "max") {
    return "max";
  }

  return "high";
}

function buildDeepSeekRequestBody<T>(request: StructuredGenerationRequest<T>, model: string) {
  const jsonInstructions = [
    request.instructions,
    "",
    "Return only valid JSON. Do not include markdown, commentary, or explanatory prose.",
    "The JSON object must conform to this schema description:",
    request.schemaDescription,
    "",
    "JSON schema:",
    safeStringify(request.schema),
    "",
    "Example JSON output shape:",
    request.fallback === undefined ? "{}" : safeStringify(request.fallback)
  ].join("\n");

  return {
    model,
    messages: [
      {
        role: "system",
        content: jsonInstructions
      },
      {
        role: "user",
        content: request.input
      }
    ],
    response_format: {
      type: "json_object"
    },
    max_tokens: request.maxOutputTokens ?? 1400,
    temperature: request.temperature ?? 0.2,
    stream: false,
    thinking: getDeepSeekThinkingConfig(),
    reasoning_effort: getDeepSeekReasoningEffort()
  };
}

class MockAnalysisProvider implements AnalysisProvider {
  id: AnalysisProviderId = "mock";
  model: string | null = null;

  async generateStructuredObject<T>(
    request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>> {
    return createFallbackResult(
      request,
      this.id,
      this.model,
      "No live model provider is configured. Returned structured fallback payload."
    );
  }
}

class OpenAIAnalysisProvider implements AnalysisProvider {
  id: AnalysisProviderId = "openai";
  model: string | null;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = getEnv("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    this.apiKey = apiKey;
    this.baseUrl = getEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
    this.model = getEnv("OPENAI_MODEL") ?? "gpt-5.2";
  }

  async generateStructuredObject<T>(
    request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildOpenAIRequestBody(request, this.model ?? "gpt-5.2"))
      });

      const payload = (await response.json()) as OpenAIResponsesApiResponse;

      if (!response.ok) {
        return createFallbackResult(
          request,
          this.id,
          this.model,
          payload.error?.message ?? `OpenAI Responses API returned ${response.status}.`
        );
      }

      const text = extractResponseText(payload);

      if (!text) {
        return createFallbackResult(
          request,
          this.id,
          this.model,
          "OpenAI Responses API returned no structured text output."
        );
      }

      return {
        ok: true,
        object: parseStructuredJson<T>(text),
        providerId: this.id,
        model: this.model,
        usedFallback: false
      };
    } catch (error) {
      return createFallbackResult(
        request,
        this.id,
        this.model,
        error instanceof Error ? error.message : "Unknown OpenAI provider error."
      );
    }
  }
}

class DeepSeekAnalysisProvider implements AnalysisProvider {
  id: AnalysisProviderId = "deepseek";
  model: string | null;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = getEnv("DEEPSEEK_API_KEY");

    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }

    this.apiKey = apiKey;
    this.baseUrl = getEnv("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com";
    this.model = getEnv("DEEPSEEK_MODEL") ?? "deepseek-v4-pro";
  }

  async generateStructuredObject<T>(
    request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildDeepSeekRequestBody(request, this.model ?? "deepseek-v4-pro"))
      });

      const payload = (await response.json()) as DeepSeekChatCompletionResponse;

      if (!response.ok) {
        return createFallbackResult(
          request,
          this.id,
          this.model,
          payload.error?.message ?? `DeepSeek Chat Completions API returned ${response.status}.`
        );
      }

      const text = payload.choices?.[0]?.message?.content?.trim() ?? "";

      if (!text) {
        return createFallbackResult(
          request,
          this.id,
          this.model,
          "DeepSeek Chat Completions API returned no structured message content."
        );
      }

      return {
        ok: true,
        object: parseStructuredJson<T>(text),
        providerId: this.id,
        model: this.model,
        usedFallback: false
      };
    } catch (error) {
      return createFallbackResult(
        request,
        this.id,
        this.model,
        error instanceof Error ? error.message : "Unknown DeepSeek provider error."
      );
    }
  }
}

export function getAnalysisProvider(): AnalysisProvider {
  const configuredProvider = getEnv("ANALYSIS_PROVIDER");

  if (configuredProvider === "mock") {
    return new MockAnalysisProvider();
  }

  if (configuredProvider === "deepseek" || getEnv("DEEPSEEK_API_KEY")) {
    try {
      return new DeepSeekAnalysisProvider();
    } catch {
      return new MockAnalysisProvider();
    }
  }

  if (configuredProvider === "openai" || getEnv("OPENAI_API_KEY")) {
    try {
      return new OpenAIAnalysisProvider();
    } catch {
      return new MockAnalysisProvider();
    }
  }

  return new MockAnalysisProvider();
}
