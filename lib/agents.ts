import { countryPolicyProfiles } from "@/lib/mock-data";
import {
  ComparisonAgentResult,
  ComparisonRow,
  CountryPolicyProfile,
  PolicyAnalysisResult,
  ReportAgentResult,
  ResearchAgentResult,
  RiskLevel,
  SupportedCountry,
  WorkflowResult
} from "@/lib/types";

const SOURCE_BASIS = [
  "UN ESCAP RDTII initiative structure",
  "ESCAP RDTII 2.1 Guide, Pillar 6 scoring logic",
  "ESCAP coverage of Pillar 6: cross-border data policies"
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCountryProfile(country: SupportedCountry): CountryPolicyProfile {
  return structuredClone(countryPolicyProfiles[country]);
}

function toRiskLabel(restrictionScore: number): RiskLevel {
  if (restrictionScore >= 70) {
    return "High";
  }

  if (restrictionScore >= 45) {
    return "Moderate";
  }

  return "Low";
}

function calculateRestrictionScore(profile: CountryPolicyProfile) {
  const rdtii =
    profile.rdtiiStyleScore.banLocalProcessing * 38 +
    profile.rdtiiStyleScore.localStorage * 12 +
    profile.rdtiiStyleScore.infrastructureRequirement * 31 +
    profile.rdtiiStyleScore.conditionalFlowRegime * 12 +
    profile.rdtiiStyleScore.bindingAgreementGap * 8;

  return Math.min(100, Math.round(rdtii));
}

function compareMetricRows(
  countryA: CountryPolicyProfile,
  countryB: CountryPolicyProfile
): ComparisonRow[] {
  return [
    {
      metric: "Transfer model",
      countryA: countryA.dataTransferPolicy,
      countryB: countryB.dataTransferPolicy,
      insight: "This row explains how each market frames outbound or inbound data movement in the demo."
    },
    {
      metric: "Localization",
      countryA: countryA.localizationRules,
      countryB: countryB.localizationRules,
      insight: "Localization friction is usually the fastest way to spot infrastructure and operating cost gaps."
    },
    {
      metric: "Approval mechanism",
      countryA: countryA.approvalMechanism,
      countryB: countryB.approvalMechanism,
      insight: "Approval intensity reveals how much legal review and pre-launch sequencing a team may need."
    },
    {
      metric: "Business impact",
      countryA: countryA.businessImpact,
      countryB: countryB.businessImpact,
      insight: "This is an operating-cost proxy that a product or expansion team can act on quickly."
    },
    {
      metric: "Openness score",
      countryA: `${countryA.opennessScore}/100`,
      countryB: `${countryB.opennessScore}/100`,
      insight: "Higher openness scores suggest less friction for cross-border digital scaling."
    },
    {
      metric: "Risk level",
      countryA: countryA.riskLevel,
      countryB: countryB.riskLevel,
      insight: "The risk level combines policy restrictiveness with likely compliance complexity in this demo."
    }
  ];
}

export async function researchAgent(country: SupportedCountry): Promise<CountryPolicyProfile> {
  await wait(700);
  return getCountryProfile(country);
}

export async function policyAnalysisAgent(
  data: CountryPolicyProfile
): Promise<PolicyAnalysisResult> {
  await wait(900);

  const restrictionScore = calculateRestrictionScore(data);
  const riskLevel = toRiskLabel(restrictionScore);
  const complianceBurden =
    restrictionScore >= 70 ? "Heavy" : restrictionScore >= 45 ? "Managed" : "Lean";

  return {
    country: data.country,
    riskLevel,
    restrictionScore,
    opennessScore: data.opennessScore,
    complianceBurden,
    executiveSummary: `${data.country} shows a ${riskLevel.toLowerCase()}-risk cross-border data posture in this demo, combining an openness score of ${data.opennessScore}/100 with a restrictiveness score of ${restrictionScore}/100.`,
    strengths: [
      `Privacy framework signal: ${data.privacyFramework}`,
      `Strategic outlook: ${data.strategicOutlook}`
    ],
    watchpoints: [
      `Transfer friction: ${data.dataTransferPolicy}`,
      `Localization watchpoint: ${data.localizationRules}`,
      `Approval watchpoint: ${data.approvalMechanism}`
    ],
    recommendedActions: [
      "Map data categories before selecting cloud or routing architecture.",
      "Document transfer logic and third-party handling before market launch.",
      "Use a phased compliance checklist instead of treating cross-border data as a single issue."
    ]
  };
}

export async function comparisonAgent(
  countryA: SupportedCountry,
  countryB: SupportedCountry
): Promise<ComparisonAgentResult> {
  await wait(850);

  const profileA = getCountryProfile(countryA);
  const profileB = getCountryProfile(countryB);

  return {
    comparedCountries: [countryA, countryB],
    headline: `${countryA} and ${countryB} differ most clearly on transfer openness, localization expectations, and approval intensity.`,
    winnerOnOpenness:
      profileA.opennessScore >= profileB.opennessScore ? profileA.country : profileB.country,
    higherRiskCountry:
      calculateRestrictionScore(profileA) >= calculateRestrictionScore(profileB)
        ? profileA.country
        : profileB.country,
    rows: compareMetricRows(profileA, profileB)
  };
}

export async function reportAgent(results: {
  research: ResearchAgentResult;
  policyAnalysis: PolicyAnalysisResult[];
  comparison: ComparisonAgentResult | null;
}): Promise<ReportAgentResult> {
  await wait(800);

  const highestRiskScore = Math.max(...results.policyAnalysis.map((item) => item.restrictionScore));
  const overallRisk = toRiskLabel(highestRiskScore);
  const comparisonTable = results.comparison?.rows ?? [];
  const primaryAnalysis = results.policyAnalysis[0];

  const finalNarrative = results.comparison
    ? `The multi-agent workflow indicates that ${results.comparison.higherRiskCountry} carries the heavier cross-border compliance load in this scenario, while ${results.comparison.winnerOnOpenness} appears more open for scalable digital operations. ${primaryAnalysis.executiveSummary}`
    : `The workflow indicates a ${overallRisk.toLowerCase()}-risk posture for ${primaryAnalysis.country}. ${primaryAnalysis.executiveSummary}`;

  return {
    title: "Cross-Border Data Policy Multi-Agent Report",
    overallRisk,
    finalNarrative,
    comparisonTable,
    policyRecommendations: [
      "Design market entry plans around the strictest transfer pathway rather than the average case.",
      "Separate privacy, localization, and approval obligations into different workstreams for faster execution.",
      "Prioritize interoperable markets for pilot launches, then expand into higher-friction jurisdictions with localized controls.",
      "Keep this demo ready for an OpenAI-powered upgrade by preserving structured agent inputs and outputs."
    ]
  };
}

export async function runMultiAgentWorkflow(
  countryA: SupportedCountry,
  countryB?: SupportedCountry | null
): Promise<WorkflowResult> {
  const firstProfile = await researchAgent(countryA);
  const secondProfile = countryB ? await researchAgent(countryB) : null;

  const research: ResearchAgentResult = {
    profiles: secondProfile ? [firstProfile, secondProfile] : [firstProfile],
    summary: secondProfile
      ? `Research Agent assembled a Pillar 6-aligned policy snapshot for ${countryA} and ${countryB}.`
      : `Research Agent assembled a Pillar 6-aligned policy snapshot for ${countryA}.`,
    sourceBasis: SOURCE_BASIS
  };

  const policyAnalysis = [
    await policyAnalysisAgent(firstProfile),
    ...(secondProfile ? [await policyAnalysisAgent(secondProfile)] : [])
  ];

  const comparison = countryB ? await comparisonAgent(countryA, countryB) : null;

  const report = await reportAgent({
    research,
    policyAnalysis,
    comparison
  });

  return {
    input: {
      countryA,
      countryB
    },
    research,
    policyAnalysis,
    comparison,
    report,
    generatedAt: new Date().toISOString()
  };
}
