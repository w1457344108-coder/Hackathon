import { NextRequest } from "next/server";
import { countryPolicyProfiles } from "@/lib/mock-data";
import { SupportedCountry } from "@/lib/types";

export const dynamic = "force-dynamic";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const advisoryScenarios: Record<string, {
  topic: string;
  costEstimate: string;
  chain: string[];
  conclusion: string;
  risk: string[];
  citations: string[];
}> = {
  China: {
    topic: "Market entry assessment for a foreign cloud service provider offering跨境 data processing to Chinese enterprise clients",
    costEstimate: "Estimated Year-1 compliance cost: $180,000-$350,000 (security assessment, local legal counsel, infrastructure adaptation, data classification system)",
    chain: [
      "Assess market access barriers: data localization requirements (P6_2) and infrastructure requirements (P6_3) create upfront compliance investment",
      "Evaluate transfer pathway: security assessment mechanism (P6_4) creates timeline uncertainty for service activation",
      "Estimate compliance burden: Heavy — requires dedicated legal and compliance team on the ground",
      "Consider alternative structures: joint venture with local partner may reduce regulatory friction",
      "Assess scalability: high compliance overhead reduces profitability for smaller-scale market entry"
    ],
    conclusion: "China presents a high-compliance-cost market entry scenario. The combination of local storage (P6_2), infrastructure (P6_3), and conditional flow (P6_4) requirements means new entrants should budget at least $250,000 for initial compliance setup and expect 6-12 months for regulatory approvals. Recommended approach: phased entry through a local partner, starting with non-sensitive data services.",
    risk: [
      "Security assessment timeline is unpredictable — no guaranteed processing window",
      "Data classification obligations require significant up-front legal analysis",
      "Regulatory changes can affect approved transfer mechanisms retroactively",
      "Local infrastructure requirements may necessitate capital expenditure on domestic servers"
    ],
    citations: ["China · Art. 12", "China · Sec. 5", "Pillar 6 · P6_2", "Pillar 6 · P6_3", "Pillar 6 · P6_4"]
  },
  Singapore: {
    topic: "Advisory for establishing a regional data processing hub in Singapore for ASEAN operations",
    costEstimate: "Estimated Year-1 compliance cost: $45,000-$85,000 (PDPA compliance program, contractual safeguards, data protection officer)",
    chain: [
      "Assess market openness: Singapore's open transfer environment (P6_5) supports hub strategies",
      "Evaluate infrastructure requirements: no local server mandate (P6_3: Open)",
      "Estimate compliance burden: Lean to Managed — well-documented accountability framework sufficient",
      "Consider regional connectivity: trade agreements facilitate cross-border flows to partner markets",
      "Assess scalability: low compliance overhead makes Singapore ideal as a regional hub"
    ],
    conclusion: "Singapore is the lowest-compliance-friction option in the Asia-Pacific region for a data processing hub. With no localization requirement, strong trade commitments (P6_5), and a mature accountability-based privacy framework, the estimated compliance cost is $45,000-$85,000. The primary obligation is implementing contractual safeguards and maintaining accountable transfer documentation. Recommended approach: establish hub under PDPA framework with SCCs for outbound transfers.",
    risk: [
      "Accountability documentation must be maintained and updated regularly",
      "Partner jurisdiction restrictions may still affect data flows to certain markets",
      "Future regulatory divergence could complicate regional hub operations"
    ],
    citations: ["Singapore · Para. 17", "Singapore · Chapter 8, Art. 4", "Pillar 6 · P6_5", "Pillar 6 · P6_4"]
  },
  Japan: {
    topic: "Advisory for a European AI company planning to use Japanese clinical data for model training",
    costEstimate: "Estimated Year-1 compliance cost: $95,000-$180,000 (APPI compliance, consent management, data protection impact assessment, cross-border transfer documentation)",
    chain: [
      "Assess data sensitivity: clinical data qualifies as sensitive personal information under APPI",
      "Evaluate transfer mechanism: consent plus equivalent protection required",
      "Consider sectoral overlay: health data regulations add compliance layers",
      "Estimate compliance burden: Managed — structured but manageable requirements",
      "Assess scalability: moderate compliance overhead with clear procedural pathways"
    ],
    conclusion: "Japan offers a moderate-compliance pathway for clinical AI training data. The key requirements are explicit consent for sensitive data, equivalent protection assurances, and health-sector-specific safeguards. Estimated Year-1 compliance cost: $95,000-$180,000. Recommended approach: implement APPI compliance program, secure explicit consent mechanisms, and document equivalent protection measures before transfer initiation.",
    risk: [
      "Sensitive data classification triggers enhanced consent obligations",
      "Health sector regulations may impose additional handling and storage requirements",
      "Adequacy framework reliance creates long-term regulatory dependency",
      "Patient consent withdrawal rights could affect data completeness"
    ],
    citations: ["Japan · Art. 24", "Japan · Sec. 28", "Japan · Guideline §3", "Pillar 6 · P6_4"]
  },
  "European Union": {
    topic: "Risk assessment for a US-based SaaS company expanding EU customer data processing operations",
    costEstimate: "Estimated Year-1 compliance cost: $120,000-$250,000 (GDPR Chapter V compliance, SCCs/BCRs, DPO appointment, TIA, local representative)",
    chain: [
      "Assess territorial scope: GDPR Art. 3 establishes broad extra-territorial reach",
      "Determine transfer mechanism: SCCs or BCRs for US-bound transfers",
      "Evaluate supplementary measures: required post-Schrems II for US transfers",
      "Estimate compliance burden: Managed to Heavy — significant documentation and governance required",
      "Consider local representation: Art. 27 requires local representative for non-EU entities"
    ],
    conclusion: "EU market entry requires substantial GDPR compliance investment. Estimated Year-1 cost: $120,000-$250,000, driven by Chapter V transfer obligations, SCC implementation, TIA documentation, and DPO appointment. For US-bound transfers, supplementary measures are likely needed post-Schrems II. Recommended approach: implement BCRs for long-term scalability or rely on SCCs with robust supplementary measures for near-term entry.",
    risk: [
      "Schrems II jurisprudence creates ongoing uncertainty for US-bound transfers",
      "TIA findings may be challenged by EU regulators",
      "BCR approval process can take 6-12 months",
      "Local representative obligation adds organizational overhead",
      "Fines up to 4% of global turnover for non-compliance"
    ],
    citations: ["European Union · Art. 44", "European Union · Art. 46", "European Union · Art. 49", "Pillar 6 · P6_4"]
  },
  "United States": {
    topic: "Advisory for a European fintech startup entering the US market with cross-border payment data processing",
    costEstimate: "Estimated Year-1 compliance cost: $75,000-$150,000 (multi-state privacy compliance, sectoral regulatory mapping, contract review, compliance personnel)",
    chain: [
      "Assess federal landscape: no comprehensive federal privacy regime — sectoral and state-level patchwork",
      "Map sectoral obligations: GLBA for financial data, state breach notification laws",
      "Evaluate state-level privacy laws: CCPA, CPA, and emerging state regimes",
      "Consider inbound EU data: GDPR Chapter V applies to EU customer data",
      "Estimate compliance burden: Managed — operational openness with compliance complexity from regulatory fragmentation"
    ],
    conclusion: "The US offers operational openness but regulatory fragmentation creates compliance complexity. Estimated Year-1 cost: $75,000-$150,000, driven by multi-state privacy law mapping, GLBA obligations for financial data, and GDPR Chapter V compliance for EU customer data. The absence of binding federal digital trade commitments creates a Pillar 6 gap (P6_5). Recommended approach: implement a comprehensive privacy program covering all applicable state and sectoral regimes, with GDPR Chapter V infrastructure for EU data.",
    risk: [
      "Multi-state compliance increases legal monitoring costs",
      "Absence of federal privacy law creates regulatory unpredictability",
      "GLBA obligations for financial data require specific compliance infrastructure",
      "EU inbound data creates dual-regime compliance burden",
      "State law divergence may increase as more states enact privacy legislation"
    ],
    citations: ["United States · Section 702", "United States · CCPA §1798.100", "United States · GLBA", "Pillar 6 · P6_5", "Pillar 6 · P6_3"]
  }
};

export async function POST(request: NextRequest) {
  await delay(1000);

  const body = await request.json();
  const country: string = body.country || "China";
  const query: string = body.query || "";

  const profile = countryPolicyProfiles[country as SupportedCountry] || countryPolicyProfiles.China;
  const advisory = advisoryScenarios[country] || advisoryScenarios.China;

  const businessImpact = profile.businessImpact;

  return Response.json({
    intent_type: "advisory",
    logic_chain: [
      `Advisory request: "${query || advisory.topic}"`,
      `Target jurisdiction: ${country}`,
      `Business impact assessment: ${businessImpact}`,
      ...advisory.chain
    ],
    conclusion: `${advisory.conclusion}\n\n${advisory.costEstimate}\n\nOverall business impact rating: ${businessImpact}. ` +
      `Openness score: ${profile.opennessScore}/100. Strategic outlook: ${profile.strategicOutlook}`,
    risks: advisory.risk,
    citations: advisory.citations
  });
}
