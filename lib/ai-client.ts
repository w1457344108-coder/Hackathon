import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAiClient(): Anthropic {
  if (!client) {
    const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com/anthropic";
    const apiKey = process.env.ANTHROPIC_AUTH_TOKEN || "";

    if (!apiKey) {
      throw new Error("ANTHROPIC_AUTH_TOKEN is not set");
    }

    client = new Anthropic({ baseURL, apiKey });
  }
  return client;
}

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "deepseek-v4-flash[1m]";
