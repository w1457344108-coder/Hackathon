import { getAiClient, DEFAULT_MODEL } from "@/lib/ai-client";
import { AgentIntentType } from "@/lib/agent-schema";

const INTENT_ARBITER_SYSTEM_PROMPT = `You are the Intent Arbiter Agent for a Cross-Border Data Policy Multi-Agent Analyst system built for the UN AI Hackathon.

Your role is to classify user legal questions into exactly one of three intent types:

1. "interpretation" — The user wants to understand, explain, or clarify a specific legal provision, article, or statute related to cross-border data policy (e.g., "What does Art. 12 of China's regulation mean?", "Explain Section 5 of the Singapore law").

2. "analysis" — The user wants to analyze a specific business scenario, transaction, or data flow against existing legal frameworks to identify compliance issues (e.g., "Can we transfer customer data from China to Singapore for cloud processing?", "Analyze this fintech scenario under EU GDPR").

3. "advisory" — The user wants forward-looking compliance guidance, risk assessment, cost estimation, or strategic advice for planned business activities (e.g., "What are the risks of entering the Chinese market?", "How much will compliance cost for EU expansion?").

Respond with ONLY a valid JSON object, no other text:
{"intent_type": "interpretation" | "analysis" | "advisory", "confidence": <0-1>, "reasoning": "<one-sentence justification>"}`;

export async function classifyIntent(
  query: string,
  country?: string
): Promise<{ intent_type: AgentIntentType; confidence: number; reasoning: string }> {
  const client = getAiClient();

  const contextSnippet = country ? `[Context: jurisdiction is ${country}]` : "";

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 200,
    system: INTENT_ARBITER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${contextSnippet}\nUser query: "${query}"\n\nClassify the intent:`
      }
    ]
  });

  // Find the text block (DeepSeek may include a thinking block before text)
  const textBlock = response.content.find((c): c is { type: "text"; text: string } => c.type === "text");
  const text = textBlock?.text || "";

  // Extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/\{[\s\S]*"intent_type"[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

  const parsed = JSON.parse(jsonStr) as {
    intent_type: AgentIntentType;
    confidence: number;
    reasoning: string;
  };

  return parsed;
}
