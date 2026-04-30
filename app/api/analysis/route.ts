import { NextRequest } from "next/server";
import { countryPolicyProfiles } from "@/lib/mock-data";
import { SupportedCountry } from "@/lib/types";

export const dynamic = "force-dynamic";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const scenarioCases: Record<string, {
  scenario: string;
  issues: string[];
  chain: string[];
  conclusion: string;
  risk: string[];
  citations: string[];
}> = {
  China: {
    scenario: "A fintech company plans to transfer customer transaction data from its China-based servers to a cloud platform in Singapore for AI-driven fraud analysis.",
    issues: [
      "Transaction data may qualify as 'important data' under the Data Security Law",
      "Cross-border transfer of personal information requires security assessment",
      "Cloud outsourcing may trigger local infrastructure requirements"
    ],
    chain: [
      "Classify data: customer transaction data falls under both personal information and potentially important data",
      "Determine transfer mechanism: security assessment required for important data exports",
      "Assess infrastructure: China's infrastructure requirements (P6_3) may mandate local processing capabilities",
      "Evaluate conditional flow: Art. 12 security review creates ex-ante approval gate (P6_4)",
      "Apply localization rules: Sec. 5 local storage requirement (P6_2) applies to critical information infrastructure"
    ],
    conclusion: "Under China's regulatory framework, the proposed transfer faces a restrictive environment. The data likely requires a formal security assessment before export, and local storage obligations may necessitate maintaining a domestic copy. The overall Pillar 6 risk profile is High, driven primarily by conditional flow (P6_4) and local storage (P6_2) indicators.",
    risk: [
      "Security assessment process may delay market entry by 3-6 months",
      "Dual infrastructure (local + cloud) increases operational costs",
      "Data classification uncertainty creates legal exposure",
      "Regulatory changes may affect ongoing transfer mechanisms"
    ],
    citations: ["China · Art. 12", "China · Sec. 5", "China · Art. 38", "Pillar 6 · P6_4", "Pillar 6 · P6_2"]
  },
  Singapore: {
    scenario: "A regional e-commerce company wants to consolidate user profile data from Singapore operations into a centralized data lake in Japan.",
    issues: [
      "Transfer accountability obligation under PDPA",
      "Contractual safeguards needed for outbound personal data",
      "No broad localization requirement, but documentation required"
    ],
    chain: [
      "Identify applicable framework: PDPA accountability regime",
      "Assess transfer mechanism: contractual safeguards and organizational controls",
      "Evaluate binding commitments: digital economy chapter supports data flows (P6_5)",
      "Verify localization: no general local storage mandate (P6_2: Open)",
      "Conclude that transfers are permissible with documented accountability measures"
    ],
    conclusion: "Singapore's framework permits the proposed transfer with moderate compliance overhead. The key requirement is documented accountability: the transferring organization must ensure comparable protection standards. No localization barrier exists, and trade commitments support cross-border flows. Pillar 6 risk profile is Low to Moderate.",
    risk: [
      "Accountability documentation must be maintained and auditable",
      "Third-party vendor contracts must include equivalent protection clauses",
      "Future regulatory changes could narrow the open transfer environment"
    ],
    citations: ["Singapore · Para. 17", "Singapore · Chapter 8, Art. 4", "Pillar 6 · P6_5", "Pillar 6 · P6_4"]
  },
  Japan: {
    scenario: "A healthcare technology firm wants to transfer patient diagnostic data from Japan to a research partner in the European Union.",
    issues: [
      "Consent requirements under APPI for sensitive health data",
      "Equivalent protection standard for foreign transfers",
      "Sector-specific obligations for medical data"
    ],
    chain: [
      "Identify applicable framework: APPI with sector-specific health data rules",
      "Classify data: diagnostic records qualify as sensitive personal information",
      "Assess transfer mechanism: consent plus equivalent protection measures",
      "Evaluate adequacy: EU adequacy framework may facilitate transfers",
      "Apply sectoral rules: health data may require additional safeguards"
    ],
    conclusion: "Japan's framework allows the transfer but with meaningful compliance steps. Patient diagnostic data requires explicit consent and equivalent protection assurances. The EU-Japan adequacy arrangement may facilitate the transfer, but health-sector-specific obligations add an additional compliance layer. Pillar 6 risk profile is Moderate.",
    risk: [
      "Sensitive data classification triggers heightened consent requirements",
      "Health sector regulations may impose additional data handling obligations",
      "Adequacy framework changes could affect long-term transfer sustainability"
    ],
    citations: ["Japan · Art. 24", "Japan · Sec. 28", "Japan · Guideline §3", "Pillar 6 · P6_4"]
  },
  "European Union": {
    scenario: "A cloud services provider wants to transfer employee HR data from its EU headquarters to a global HR platform hosted in the United States.",
    issues: [
      "Chapter V transfer restriction under GDPR",
      "SCCs or BCRs needed as transfer mechanism",
      "Supplementary measures may be required for US transfers"
    ],
    chain: [
      "Identify applicable framework: GDPR Chapter V (Art. 44-49)",
      "Determine transfer mechanism: SCCs are the most practical pathway",
      "Assess adequacy: no general US adequacy finding for this context",
      "Evaluate supplementary measures: required if SCCs alone are insufficient",
      "Apply binding commitments: BCRs could be an alternative for multinational groups"
    ],
    conclusion: "The proposed transfer triggers GDPR Chapter V obligations. Standard Contractual Clauses (SCCs) are the most practical mechanism, but a Transfer Impact Assessment (TIA) is required and supplementary measures may be needed given the US as destination. Pillar 6 risk profile is Moderate, reflecting conditional flow (P6_4) rather than restriction.",
    risk: [
      "SCCs alone may not suffice — supplementary measures could be required",
      "TIA must document the legal assessment and may face regulatory scrutiny",
      "Schrems-type challenges could invalidate transfer mechanisms",
      "Ongoing monitoring of adequacy developments is necessary"
    ],
    citations: ["European Union · Art. 44", "European Union · Art. 46", "European Union · Art. 49", "Pillar 6 · P6_4"]
  },
  "United States": {
    scenario: "A SaaS company wants to aggregate customer analytics data from US operations with subsidiary data in Europe for a unified AI training pipeline.",
    issues: [
      "No comprehensive federal privacy regime creates compliance patchwork",
      "State-level laws (CCPA, CPA, etc.) impose varying obligations",
      "Inbound data from EU triggers GDPR Chapter V reverse obligations"
    ],
    chain: [
      "Assess domestic framework: sectoral and state-level patchwork rather than unified regime",
      "Evaluate outbound transfers: generally open at federal level (P6_5 gap)",
      "Assess inbound EU data: GDPR Chapter V applies to EU-origin data",
      "Consider sectoral rules: HIPAA for health, GLBA for financial data",
      "Map to Pillar 6: high operational openness with binding commitment gap (P6_5)"
    ],
    conclusion: "The US presents an operationally open environment for domestic outbound data, but the lack of binding federal digital trade commitments creates a Pillar 6 binding commitment gap (P6_5). Inbound data from the EU triggers GDPR compliance obligations. Sectoral and state-level variation increases compliance complexity. Pillar 6 risk profile is Moderate.",
    risk: [
      "Patchwork state laws increase compliance cost for multi-state operations",
      "Absence of federal privacy law creates regulatory unpredictability",
      "EU inbound data requires GDPR Chapter V compliance infrastructure",
      "Sectoral obligations (HIPAA, GLBA, COPPA) add vertical compliance layers"
    ],
    citations: ["United States · Section 702", "United States · CCPA §1798.100", "Pillar 6 · P6_5", "Pillar 6 · P6_3"]
  }
};

export async function POST(request: NextRequest) {
  await delay(800);

  const body = await request.json();
  const country: string = body.country || "China";
  const query: string = body.query || "";

  const profile = countryPolicyProfiles[country as SupportedCountry] || countryPolicyProfiles.China;
  const mockCase = scenarioCases[country] || scenarioCases.China;

  const restrictionScore =
    profile.rdtiiStyleScore.banLocalProcessing * 38 +
    profile.rdtiiStyleScore.localStorage * 12 +
    profile.rdtiiStyleScore.infrastructureRequirement * 31 +
    profile.rdtiiStyleScore.conditionalFlowRegime * 12 +
    profile.rdtiiStyleScore.bindingAgreementGap * 8;

  return Response.json({
    intent_type: "analysis",
    logic_chain: [
      `Received query: "${query || mockCase.scenario}"`,
      `Jurisdiction identified: ${country}`,
      ...mockCase.chain
    ],
    conclusion: mockCase.conclusion + ` Restriction score: ${Math.min(100, restrictionScore)}/100. Openness score: ${profile.opennessScore}/100.`,
    risks: mockCase.risk,
    citations: mockCase.citations
  });
}
