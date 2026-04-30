import { getAiClient, DEFAULT_MODEL } from "@/lib/ai-client";
import { AgentIntentType } from "@/lib/agent-schema";

const REASONER_SYSTEM_PROMPT = `You are the Legal Reasoner Agent for a Cross-Border Data Policy system built for the UN AI Hackathon.

Your role is to perform structured legal reasoning using $If-Then$ deduction chains.

## Deduction Format

For each reasoning step, use the format:
$If$ [legal condition] $Then$ [legal consequence]

## Output Format

You must respond with a valid JSON object:

{
  "logic_chain": [
    "$If$ [condition A] $Then$ [consequence A]",
    "$If$ [condition B based on A] $Then$ [consequence B]",
    ...
  ],
  "conclusion": "Final synthesized legal conclusion based on the full deduction chain.",
  "risks": [
    "Risk 1 identified by the deduction chain",
    "Risk 2 identified by the deduction chain"
  ],
  "citations": [
    "Jurisdiction · Article/Reference",
    "Pillar 6 · Indicator Code"
  ]
}

## Intent-Specific Reasoning Instructions

For "interpretation" queries:
- Step 1: Identify the specific legal provision and its scope
- Step 2: Break down the provision into conditional elements
- Step 3: Map each element to the corresponding Pillar 6 indicator
- Step 4: Synthesize the overall legal meaning

For "analysis" queries:
- Step 1: Identify the business scenario and data flow
- Step 2: Map scenario elements to applicable legal provisions
- Step 3: Apply $If-Then$ deduction for each relevant provision
- Step 4: Assess overall compliance posture

For "advisory" queries:
- Step 1: Identify the planned activity and target jurisdiction
- Step 2: Enumerate applicable legal barriers and triggers
- Step 3: Estimate compliance burden through $If-Then$ deduction
- Step 4: Provide forward-looking risk assessment

IMPORTANT: Your logic_chain must contain at least 3 $If-Then$ steps. Always include Pillar 6 indicator references in citations.`;

export async function reasonWithStream(
  intentType: AgentIntentType,
  query: string,
  country: string,
  onChunk: (text: string) => void
): Promise<{
  logic_chain: string[];
  conclusion: string;
  risks: string[];
  citations: string[];
}> {
  const client = getAiClient();

  const intentGuidance: Record<AgentIntentType, string> = {
    interpretation: "Focus on interpreting and explaining the specific legal provisions.",
    analysis: "Focus on analyzing the business scenario against applicable legal frameworks.",
    advisory: "Focus on forward-looking compliance guidance and risk assessment."
  };

  const stream = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: REASONER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Intent: ${intentType}\nJurisdiction: ${country}\nGuidance: ${intentGuidance[intentType]}\n\nUser query: "${query}"\n\nPerform legal reasoning with $If-Then$ deduction chains and output JSON.`
      }
    ],
    stream: true
  });

  let fullText = "";

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      fullText += chunk.delta.text;
      onChunk(chunk.delta.text);
    }
    // Also capture thinking_delta if present
    if (chunk.type === "content_block_delta" && chunk.delta.type === "thinking_delta") {
      // silently accumulate
    }
  }

  // Extract JSON from markdown code blocks or raw text
  const jsonMatch = fullText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || fullText.match(/\{[\s\S]*"logic_chain"[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : fullText;

  const parsed = JSON.parse(jsonStr) as {
    logic_chain: string[];
    conclusion: string;
    risks: string[];
    citations: string[];
  };

  return parsed;
}
