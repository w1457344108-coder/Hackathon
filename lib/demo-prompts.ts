export type DemoPromptMode = "regulation" | "case" | "advisory";
export type DemoJurisdiction = "China" | "Singapore";

export const demoPrompts: Record<DemoPromptMode, string> = {
  regulation:
    "Please explain the requirements under Article 38 of China’s Personal Information Protection Law for providing personal information overseas. This question corresponds to RDTII Pillar 6, Indicator 6.4 Conditional Flow Regimes.",
  case:
    "Please analyze an existing China-to-Singapore data transfer case.\n\nShopPilot AI operates in China as an AI customer support SaaS provider for e-commerce merchants. It transfers ordinary personal information of about 200,000 Chinese consumers per year to a Singapore analytics center for model optimization and service quality analysis. The case does not involve sensitive personal information, minors' data, medical data, financial account data, or officially identified important data.\n\nThis question focuses on RDTII Pillar 7, Indicator 7.4 Data Protection Impact Assessment / Data Protection Officer Requirements. Please also explain how this Pillar 7 issue links to Pillar 6, Indicator 6.4 Conditional Flow Regimes.",
  advisory:
    "Please provide a forward-looking legal advisory for a Singapore AI SaaS company planning to enter the Chinese market. The company plans to provide AI customer support tools for Chinese e-commerce merchants and route Chinese consumers’ customer support data to a Singapore analytics center for model training and service optimization. To move faster, the team is considering launching first, finishing the outbound transfer paperwork later, covering the product with its standard privacy policy, and sending raw chat logs plus contact details to Singapore. Please advise what the company should prepare before launch under RDTII Pillar 6 Conditional Flow Regimes and Pillar 7 domestic data protection obligations."
};

export function getDemoPromptForMode(mode: DemoPromptMode) {
  return demoPrompts[mode];
}

export function getDemoJurisdictionDefaults(mode: DemoPromptMode): {
  countryA: DemoJurisdiction;
  countryB: DemoJurisdiction;
} {
  if (mode === "case") {
    return {
      countryA: "China",
      countryB: "Singapore"
    };
  }

  return {
    countryA: "China",
    countryB: "Singapore"
  };
}
