import { NextRequest } from "next/server";
import { countryPolicyProfiles } from "@/lib/mock-data";
import { SupportedCountry } from "@/lib/types";

export const dynamic = "force-dynamic";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockInterpretations: Record<string, {
  articles: string[];
  logic: string[];
}> = {
  China: {
    articles: ["Art. 12", "Sec. 5", "Art. 38"],
    logic: [
      "Identify applicable legal framework: Personal Information Protection Law (PIPL) and Data Security Law (DSL)",
      "Determine data classification level: personal information vs. important data",
      "Assess cross-border transfer mechanism: security assessment, standard contract, or certification",
      "Map obligation to Pillar 6 indicator: conditional flow regime (P6_4)",
      "Conclude that Art. 12 requires a security review before outbound transfer of important datasets"
    ]
  },
  Singapore: {
    articles: ["Chapter 8, Art. 4", "Para. 17", "Sec. 26"],
    logic: [
      "Identify applicable framework: Personal Data Protection Act (PDPA) and Digital Economy Cooperation Chapter",
      "Assess transfer mechanism: accountability-based approach with contractual safeguards",
      "Evaluate binding commitments: trade agreement provisions enable cross-border data flows",
      "Map to Pillar 6 indicator: binding commitment (P6_5) and conditional flow (P6_4)",
      "Conclude that transfers are permitted with organizational safeguards and contractual protections"
    ]
  },
  Japan: {
    articles: ["Art. 24", "Sec. 28", "Guideline §3"],
    logic: [
      "Identify applicable framework: Act on Protection of Personal Information (APPI)",
      "Assess adequacy framework: reciprocity-based transfer mechanism",
      "Evaluate sector-specific obligations: financial and telecommunications sectors",
      "Map to Pillar 6 indicator: conditional flow regime (P6_4)",
      "Conclude that transfers require consent or equivalent protection measures"
    ]
  },
  "European Union": {
    articles: ["Art. 44", "Art. 46", "Art. 49"],
    logic: [
      "Identify applicable framework: General Data Protection Regulation (GDPR) Chapter V",
      "Assess transfer mechanism: adequacy decision, SCCs, or BCRs",
      "Evaluate supplementary measures required for third-country transfers",
      "Map to Pillar 6 indicator: conditional flow regime (P6_4)",
      "Conclude that a registered establishment within the EEA triggers full Chapter V obligations"
    ]
  },
  "United States": {
    articles: ["Section 702", "EO 12333", "CCPA §1798.100"],
    logic: [
      "Identify applicable framework: sectoral privacy laws and state-level regulations",
      "Assess federal data transfer posture: no comprehensive federal privacy regime",
      "Evaluate sector-specific controls: healthcare (HIPAA), financial (GLBA), children (COPPA)",
      "Map to Pillar 6 indicator: binding commitment gap (P6_5)",
      "Conclude that operational openness is high but sectoral patchwork creates compliance complexity"
    ]
  }
};

export async function POST(request: NextRequest) {
  await delay(600);

  const body = await request.json();
  const country: string = body.country || "China";

  const profile = countryPolicyProfiles[country as SupportedCountry] || countryPolicyProfiles.China;
  const mock = mockInterpretations[country] || mockInterpretations.China;
  const selectedArticle = mock.articles[0];

  return Response.json({
    intent_type: "interpretation",
    logic_chain: mock.logic,
    conclusion: `Under ${country}'s legal framework, Article ${selectedArticle} establishes a ${
      profile.riskLevel === "High" ? "restrictive" : profile.riskLevel === "Moderate" ? "conditional" : "permissive"
    } cross-border data transfer regime classified as ${
      profile.rdtiiStyleScore.conditionalFlowRegime >= 0.5 ? "Pillar 6.4 (Conditional Flow Regime)" : "Pillar 6.5 (Binding Commitment)"
    }. The provision requires ${profile.approvalMechanism.toLowerCase()} before outbound transfers of regulated data categories.`,
    risks: [
      `Non-compliance may result in sanctions under ${country}'s enforcement framework`,
      `Transfer restrictions could increase operational costs by requiring local infrastructure`,
      `Regulatory uncertainty around data classification thresholds creates legal risk`,
      `Cross-border contract enforcement may be limited without recognized transfer mechanisms`
    ],
    citations: mock.articles.map((a) => `${country} · ${a}`)
  });
}
