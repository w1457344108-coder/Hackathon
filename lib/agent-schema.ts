export type AgentIntentType = "interpretation" | "analysis" | "advisory";

export interface AgentResponse {
  intent_type: AgentIntentType;
  logic_chain: string[];
  conclusion: string;
  risks: string[];
  citations: string[];
}

export interface AgentRequest {
  intent_type: AgentIntentType;
  country: string;
  query: string;
  context?: string;
}
