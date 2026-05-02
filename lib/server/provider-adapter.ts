import { createHash } from "node:crypto";

export type AnalysisProviderId = "openai" | "mock";

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

function getEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function safeStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
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
        object: JSON.parse(text) as T,
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

export function getAnalysisProvider(): AnalysisProvider {
  const configuredProvider = getEnv("ANALYSIS_PROVIDER");

  if (configuredProvider === "mock") {
    return new MockAnalysisProvider();
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
