import { countryPolicyProfiles } from "@/lib/mock-data";
import {
  buildAiSuggestedTerms,
  buildSearchProfile,
  filterEvidenceByCountries,
  mockEvidenceRecords,
  preferredSourceOptions,
  toQueryBuilderOutput
} from "@/lib/mock-evidence";
import type { EvidenceRecord } from "@/lib/pillar6-schema";
import type {
  AgentResult,
  AuditCitationItem,
  AuditCitationOutput,
  ComparisonAgentResult,
  ComparisonRow,
  CountryPolicyProfile,
  DemoNarrative,
  DocumentReaderOutput,
  IndicatorMappingOutput,
  IntentArbiterOutput,
  LegalReasonerOutput,
  LegalTaskType,
  MainlineAgentResults,
  MappedEvidenceItem,
  PillarId,
  Pillar6IndicatorEnum,
  PolicyAnalysisResult,
  QueryBuilderOutput,
  ReasoningUncertaintyLevel,
  RebuttalAgentOutput,
  RebuttalIssueType,
  RebuttalReviewItem,
  RebuttalReviewStatus,
  RiskCostQuantifierOutput,
  ReportAgentResult,
  ResearchAgentResult,
  RiskLevel,
  RiskSummary,
  SupportingAgentResults,
  SupportedCountry,
  WorkflowAgentId,
  WorkflowAgentTrace,
  WorkflowResult
} from "@/lib/types";
import { getAnalysisProvider } from "@/lib/server/provider-adapter";
import { resolveEvidenceContext } from "@/lib/server/source-pipeline";
import { buildUploadedDocumentQuery } from "@/lib/server/uploaded-documents";
import type { UploadedDocumentContext } from "@/lib/server/uploaded-documents";
import {
  applyPiplArticle38DemoOverride,
  isPiplArticle38DemoQuery
} from "@/lib/pipl-article38-demo";
import {
  applyShopPilotCaseDemoOverride,
  isShopPilotCaseDemoQuery
} from "@/lib/shop-pilot-case-demo";
import {
  applySingaporeAiAdvisoryDemoOverride,
  isSingaporeAiAdvisoryDemoQuery
} from "@/lib/singapore-ai-advisory-demo";

const SOURCE_BASIS = ["Official legal and regulatory source URLs selected for the requested jurisdiction(s)"];

const ALL_PILLAR6_INDICATORS: Pillar6IndicatorEnum[] = [
  "P6_1_BAN_LOCAL_PROCESSING",
  "P6_2_LOCAL_STORAGE",
  "P6_3_INFRASTRUCTURE",
  "P6_4_CONDITIONAL_FLOW",
  "P6_5_BINDING_COMMITMENT"
];

const TASK_LABELS: Record<LegalTaskType, string> = {
  "regulation-interpretation": "Regulation Interpretation",
  "case-analysis": "Case Analysis",
  "forward-looking-advisory": "Forward-looking Advisory"
};

const DEFAULT_DEMO_BUSINESS_SCENARIO =
  "Demo review of a manually imported legal evidence block for cross-border data compliance.";

const P6_INDICATOR_NUMBER_BY_CODE: Record<Pillar6IndicatorEnum, string> = {
  P6_1_BAN_LOCAL_PROCESSING: "6.1",
  P6_2_LOCAL_STORAGE: "6.2",
  P6_3_INFRASTRUCTURE: "6.3",
  P6_4_CONDITIONAL_FLOW: "6.4",
  P6_5_BINDING_COMMITMENT: "6.5"
};

export function classifyLegalTaskType(value?: string | null): LegalTaskType {
  const normalized = (value ?? "").toLowerCase();

  if (normalized.includes("case")) {
    return "case-analysis";
  }

  if (
    normalized.includes("forward") ||
    normalized.includes("advisory") ||
    normalized.includes("consult") ||
    normalized.includes("planned") ||
    normalized.includes("future")
  ) {
    return "forward-looking-advisory";
  }

  return "regulation-interpretation";
}

function extractSelectedScope(userQuery: string): {
  selectedPillarId: PillarId;
  selectedIndicatorId: string;
  scopeConfirmed: boolean;
} {
  const normalized = userQuery.toLowerCase();
  const explicitMatch = normalized.match(/pillar\s*(6|7)[\s\S]{0,40}?indicator\s*((?:6|7)\.\d+)/i);
  const indicatorOnlyMatch = normalized.match(/(?:indicator|指标)\s*((?:6|7)\.\d+)/i);
  const bareIndicatorMatch = normalized.match(/\b(6|7)\.(\d+)\b/);
  const selectedIndicatorId =
    explicitMatch?.[2] ?? indicatorOnlyMatch?.[1] ?? bareIndicatorMatch?.[0] ?? "6.4";
  const pillarDigit = explicitMatch?.[1] ?? selectedIndicatorId.split(".")[0];
  const selectedPillarId: PillarId = pillarDigit === "7" ? "P7" : "P6";

  return {
    selectedPillarId,
    selectedIndicatorId,
    scopeConfirmed:
      normalized.includes("pillar") || normalized.includes("indicator") || /\b(6|7)\.\d+\b/.test(normalized)
  };
}

function toPillarId(value: string | undefined): PillarId | null {
  const normalized = (value ?? "").toLowerCase();

  if (normalized.includes("7") || normalized === "p7") {
    return "P7";
  }

  if (normalized.includes("6") || normalized === "p6") {
    return "P6";
  }

  return null;
}

function getRecordIndicatorId(record: EvidenceRecord): string {
  return P6_INDICATOR_NUMBER_BY_CODE[record.indicatorCode] ?? record.indicator;
}

function evidenceMatchesScope(record: EvidenceRecord, pillarId: PillarId, indicatorId: string) {
  const recordPillarId = toPillarId(record.pillar) ?? "P6";
  const normalizedIndicator = indicatorId.toLowerCase();
  const recordIndicatorId = getRecordIndicatorId(record).toLowerCase();
  const recordIndicatorText = `${record.indicator} ${record.indicatorCode}`.toLowerCase();

  return (
    recordPillarId === pillarId &&
    (recordIndicatorId === normalizedIndicator || recordIndicatorText.includes(normalizedIndicator))
  );
}

function getTaskIntent(input: {
  taskType: LegalTaskType;
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  userQuery: string;
}) {
  const countries = input.countryB
    ? `${input.countryA} and ${input.countryB}`
    : input.countryA;

  if (input.taskType === "case-analysis") {
    return `Analyze this existing case by extracting facts, identifying the data flow, and matching the facts to Pillar 6 legal evidence for ${countries}. User question: ${input.userQuery}`;
  }

  if (input.taskType === "forward-looking-advisory") {
    return `Assess this planned or future market-entry activity by forecasting cross-border data barriers, readiness risks, and compliance steps under Pillar 6 for ${countries}. User question: ${input.userQuery}`;
  }

  return `Explain the relevant Pillar 6 regulation, legal rule, or policy indicator for ${countries}, including source location, legal elements, plain-language meaning, and evidence limits. User question: ${input.userQuery}`;
}

function getTaskSearchTerms(taskType: LegalTaskType) {
  if (taskType === "case-analysis") {
    return [
      "existing business facts",
      "data flow",
      "data category",
      "compliance assessment",
      "legal issues"
    ];
  }

  if (taskType === "forward-looking-advisory") {
    return [
      "planned market entry",
      "legal barriers",
      "risk forecast",
      "operational readiness",
      "pre-launch compliance"
    ];
  }

  return [
    "legal text",
    "regulation meaning",
    "rule elements",
    "official source",
    "plain language explanation"
  ];
}

export function getLegalReasonerInstructions(taskType: LegalTaskType) {
  const commonRules = [
    "Use only the supplied evidence, retrieved legal text, source URLs, and uploaded documents.",
    "Do not invent statutes, article numbers, legal obligations, regulator names, URLs, or citations.",
    "Prefer original legal text and official sources over summaries, methodology pages, or database descriptions.",
    "Distinguish exact legal text, regulator or statute text, policy summaries, and inferred legal effect.",
    "Never rely on or mention other pillars unless the source itself is being rejected as out of scope.",
    "Only analyze the selected pillarId and selectedIndicatorId provided in the input.",
    "Every legalFinding must include at least one evidenceId and at least one passageId from the supplied passages.",
    "If exact clause-level legal text is unavailable, state that limitation explicitly inside the conclusion or legalEffect field and stop short of claiming a specific statutory rule."
  ].join(" ");

  if (taskType === "case-analysis") {
    return [
      "You are a legal case analysis agent for the selected cross-border data policy indicator.",
      "Task type: Case Analysis.",
      commonRules,
      "Treat the user scenario as an existing or current business operation.",
      "First extract Case Facts Identified, then identify assumptions and missing facts.",
      "Map the facts only to the user-selected indicator.",
      "For each legal finding, make the conclusion case-specific and explain the Compliance Risk Assessment in legalEffect.",
      "Required analytical coverage: Case Facts Identified, Assumptions and Missing Facts, Relevant Pillar 6 Issues, Country-by-Country Analysis, Compliance Risk Assessment, Evidence Match, Practical Next Steps, Limits."
    ].join("\n");
  }

  if (taskType === "forward-looking-advisory") {
    return [
      "You are a forward-looking legal advisory agent for the selected cross-border data policy indicator.",
      "Task type: Forward-looking Advisory.",
      commonRules,
      "Treat the user scenario as a planned or future activity, not an existing case.",
      "Do not present uncertain future risks as confirmed legal violations.",
      "Focus on Potential Legal Barriers, Forward-Looking Risk Forecast, market-entry readiness, transfer mechanisms, approvals, localization, and operational prerequisites.",
      "For each legal finding, make the conclusion planning-oriented and explain launch impact, caution signals, or human-review needs in legalEffect.",
      "Required analytical coverage: Planned Activity Under Review, Key Planning Assumptions, Potential Legal Barriers, Forward-Looking Risk Forecast, Country-by-Country Readiness Review, Compliance Roadmap, Go / Caution / Stop Signals, Evidence and Citations, Limits."
    ].join("\n");
  }

  return [
    "You are a legal interpretation agent for the selected cross-border data policy indicator.",
    "Task type: Regulation Interpretation.",
    commonRules,
    "Treat the user question as a request to explain a specific law, regulation, clause, policy indicator, or legal requirement.",
    "Locate the Legal Source Located, then explain the Rule Explanation, Legal Elements, legal exceptions, and application limits.",
    "For each legal finding, make the conclusion rule-focused and explain what the rule means in legalEffect.",
    "Required analytical coverage: Direct Answer, Legal Source Located, Rule Explanation, Legal Elements, Application to the User's Question, Confidence and Limits, Citations."
  ].join("\n");
}

export function getReportAgentInstructions(taskType: LegalTaskType) {
  const commonRules = [
    "Produce a concise, evidence-aware final answer for a Pillar 6 cross-border data policy workflow.",
    "Do not invent jurisdictions, evidence, source claims, legal citations, or business facts.",
    "Use supplied legal findings and source records as the authority base.",
    "The final answer must explicitly reuse the userQuery's material facts when the user supplied them.",
    "If a prompt mentions data type, business purpose, vendor role, service type, or transfer route, the answer must discuss those facts directly.",
    "If the evidence is only row-level database, page-level, or incomplete, say so clearly.",
    "Do not mention other pillars unless you are explicitly explaining that the system excluded them as out of scope.",
    "Return modeSections with the required headings. finalNarrative should be a readable serialization of those modeSections."
  ].join(" ");

  if (taskType === "case-analysis") {
    return [
      commonRules,
      "This is Case Analysis. The finalNarrative must be tailored to the user's existing facts and must not read like a generic country-risk memo.",
      "Required sections inside finalNarrative: Case Facts Identified; Assumptions and Missing Facts; Relevant Pillar 6 Issues; Country-by-Country Analysis; Compliance Risk Assessment; Evidence Match; Practical Next Steps; Limits.",
      "Case Facts Identified must name the concrete data type, business purpose, transfer route, and likely actor roles if they appear in userQuery.",
      "Policy recommendations must be case-specific compliance actions."
    ].join("\n");
  }

  if (taskType === "forward-looking-advisory") {
    return [
      commonRules,
      "This is Forward-looking Advisory. The finalNarrative must focus on future planning, potential barriers, readiness, and launch risk.",
      "Required sections inside finalNarrative: Planned Activity Under Review; Key Planning Assumptions; Potential Legal Barriers; Forward-Looking Risk Forecast; Country-by-Country Readiness Review; Compliance Roadmap; Go / Caution / Stop Signals; Evidence and Citations; Limits.",
      "Potential Legal Barriers and Compliance Roadmap must mention the planned service, sensitive data category, cloud or vendor setup, and pre-launch sequencing when they appear in userQuery.",
      "Policy recommendations must be staged pre-launch actions."
    ].join("\n");
  }

  return [
    commonRules,
    "This is Regulation Interpretation. The finalNarrative must explain the rule itself before discussing business impact.",
    "Required sections inside finalNarrative: Direct Answer; Legal Source Located; Rule Explanation; Legal Elements; Application to the User's Question; Confidence and Limits; Citations.",
    "Legal Elements must break the rule into conditions, permissions, restrictions, exceptions, approval or contract paths, and evidence limits when available.",
    "Policy recommendations must focus on how to verify, apply, and document the interpreted rule."
  ].join("\n");
}

// ── Report fallback helpers ──────────────────────────

type ModeSpecificReportSection = {
  heading: string;
  body: string;
};

type ModeSpecificReportFallback = {
  title: string;
  finalNarrative: string;
  modeSections: ModeSpecificReportSection[];
  policyRecommendations: string[];
};

function serializeModeSections(sections: ModeSpecificReportSection[]) {
  return sections.map((section) => `${section.heading}: ${section.body}`).join("\n\n");
}

function compactList(values: string[]) {
  return values.filter(Boolean).join("; ");
}

function inferScenarioSignals(userQuery: string) {
  const normalized = userQuery.toLowerCase();
  const signals: string[] = [];

  if (normalized.includes("employee") || normalized.includes("hr")) {
    signals.push("employee HR data");
  }

  if (normalized.includes("payroll")) {
    signals.push("payroll processing");
  }

  if (normalized.includes("health")) {
    signals.push("health data, which may require heightened sensitivity review");
  }

  if (normalized.includes("ai")) {
    signals.push("AI-enabled service or analytics");
  }

  if (normalized.includes("cloud")) {
    signals.push("cloud infrastructure or cloud vendor setup");
  }

  if (normalized.includes("personal")) {
    signals.push("personal data or personal information");
  }

  if (normalized.includes("pipl")) {
    signals.push("PIPL outbound-transfer rule");
  }

  return signals;
}

export function buildModeSpecificReportFallback(input: {
  taskType: LegalTaskType;
  userQuery: string;
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  overallRisk: RiskLevel;
  evidenceSummary: string;
  sourceLimit: string;
  evidenceLabels: string[];
  sourceUrls: string[];
}): ModeSpecificReportFallback {
  const countries = input.countryB ? `${input.countryA} and ${input.countryB}` : input.countryA;
  const transferRoute = input.countryB
    ? `${input.countryA} to ${input.countryB}`
    : input.countryA;
  const signals = inferScenarioSignals(input.userQuery);
  const signalText = signals.length
    ? `Key facts detected: ${compactList(signals)}.`
    : "No specific data category, business purpose, or actor role was explicit in the user question.";
  const evidenceText = input.evidenceLabels.length
    ? compactList(input.evidenceLabels)
    : "No citation-ready evidence label was returned.";
  const sourceText = input.sourceUrls.length
    ? compactList(input.sourceUrls)
    : "No source URL was returned.";

  if (input.taskType === "case-analysis") {
    const modeSections = [
      {
        heading: "Case Facts Identified",
        body: `The existing case described by the user is: "${input.userQuery}" The working transfer route is ${transferRoute}. ${signalText} The answer should treat the organisation as a data exporter/controller, the destination-side entity as recipient or processor where applicable, and verify those roles before final legal sign-off.`
      },
      {
        heading: "Assumptions and Missing Facts",
        body: "Confirm the precise exporter, recipient, processor/controller allocation, employee notice or consent status, contractual transfer mechanism, retention period, and whether payroll data contains sensitive employee attributes."
      },
      {
        heading: "Relevant Pillar 6 Issues",
        body: "The case should be mapped to cross-border transfer conditions, comparable-protection duties, localization or infrastructure restrictions, approval triggers, and any binding-commitment mechanism reflected in the retrieved Pillar 6 evidence."
      },
      {
        heading: "Country-by-Country Analysis",
        body: input.evidenceSummary
      },
      {
        heading: "Compliance Risk Assessment",
        body: `Overall risk is ${input.overallRisk}. The risk should be judged against the actual data category, transfer route, business purpose, and actor roles rather than only the country score.`
      },
      {
        heading: "Evidence Match",
        body: evidenceText
      },
      {
        heading: "Practical Next Steps",
        body: "Map the data flow, confirm whether the employment or payroll context changes the legal basis, put the transfer mechanism and processor obligations into contract, verify comparable-protection requirements, and prepare the record for human legal review."
      },
      {
        heading: "Limits",
        body: input.sourceLimit
      }
    ];

    return {
      title: "Case Analysis - Pillar 6 Cross-Border Data Review",
      finalNarrative: serializeModeSections(modeSections),
      modeSections,
      policyRecommendations: [
        "Build a case fact matrix covering data type, exporter, recipient, processor/controller roles, transfer purpose, and transfer route.",
        "Confirm the contract or transfer mechanism that provides comparable protection before continuing the existing transfer.",
        "Escalate missing facts and any employee-data sensitivity issues to human legal review."
      ]
    };
  }

  if (input.taskType === "forward-looking-advisory") {
    const modeSections = [
      {
        heading: "Planned Activity Under Review",
        body: `The planned activity described by the user is: "${input.userQuery}" The working planning corridor is ${transferRoute}. ${signalText}`
      },
      {
        heading: "Key Planning Assumptions",
        body: "Confirm the launch country, hosting country, data categories, whether health or other sensitive data is involved, whether AI analytics uses identifiable data, the vendor model, and whether any onward transfer will occur."
      },
      {
        heading: "Potential Legal Barriers",
        body: "Potential barriers include transfer-condition compliance, comparable protection or consent requirements, sensitive-data review, cloud-vendor contract controls, localization or infrastructure restrictions, and regulator approval or documentation triggers if the facts cross those thresholds."
      },
      {
        heading: "Forward-Looking Risk Forecast",
        body: `Overall risk is ${input.overallRisk}. ${input.evidenceSummary} Health, AI, and cloud facts should be treated as pre-launch risk multipliers until the exact data architecture is confirmed.`
      },
      {
        heading: "Country-by-Country Readiness Review",
        body: `For ${countries}, compare the stricter transfer pathway, the receiving-country protection standard, and operational controls needed before production launch.`
      },
      {
        heading: "Compliance Roadmap",
        body: "Before launch: map data flows, classify health and personal data, confirm whether data can be de-identified, select a lawful transfer mechanism, draft cloud/vendor clauses, prepare notices and consents if needed, verify source citations, and schedule human legal review."
      },
      {
        heading: "Go / Caution / Stop Signals",
        body: "Go only if the transfer mechanism, sensitive-data handling, vendor contract, and citation trail are confirmed. Use Caution if source evidence is guidance-level. Stop for human review if approval, localization, or sensitive-data triggers remain unresolved."
      },
      {
        heading: "Evidence and Citations",
        body: `${evidenceText}. Source URLs: ${sourceText}`
      },
      {
        heading: "Limits",
        body: input.sourceLimit
      }
    ];

    return {
      title: "Forward-Looking Advisory - Pillar 6 Launch Readiness Review",
      finalNarrative: serializeModeSections(modeSections),
      modeSections,
      policyRecommendations: [
        "Create a pre-launch compliance roadmap before launch, with separate workstreams for data classification, transfer mechanism, cloud-vendor controls, and human legal review.",
        "Treat health data, AI analytics, and cross-border cloud hosting as heightened planning risks until the architecture and lawful basis are confirmed.",
        "Use the strictest selected jurisdiction's transfer path as the launch gate rather than relying on the lower-risk country alone."
      ]
    };
  }

  const modeSections = [
    {
      heading: "Direct Answer",
      body: `The user asked: "${input.userQuery}" The answer must explain the relevant Pillar 6 rule for ${countries} using the cited source rather than only a country-risk score.`
    },
    {
      heading: "Legal Source Located",
      body: evidenceText
    },
    {
      heading: "Rule Explanation",
      body: input.evidenceSummary
    },
    {
      heading: "Legal Elements",
      body: "Break the rule into legal elements: covered data, exporter or organisation duties, recipient obligations, transfer conditions or requirements, exceptions or exemptions, approval/security-review/contract paths, and evidence limits."
    },
    {
      heading: "Application to the User's Question",
      body: `Apply those conditions to the ${transferRoute} data-flow direction and the facts stated in the user question before making any compliance decision. ${signalText}`
    },
    {
      heading: "Confidence and Limits",
      body: `Overall risk is ${input.overallRisk}. ${input.sourceLimit}`
    },
    {
      heading: "Citations",
      body: sourceText
    }
  ];

  return {
    title: "Regulation Interpretation - Pillar 6 Rule Explanation",
    finalNarrative: serializeModeSections(modeSections),
    modeSections,
    policyRecommendations: [
      "Verify the exact article, clause, or regulator paragraph before relying on the rule.",
      "Document each legal element separately from the business impact.",
      "Escalate any missing statute text or article-level citation before presenting the interpretation as final legal authority."
    ]
  };
}

// ── Document Reader Agent Instructions ──────────────────────────

export function getDocumentReaderInstructions(): string {
  return [
    "You are a Document Reader Agent for a demo cross-border data policy workflow.",
    "Your task is to convert raw legal material (statutes, regulations, guidance documents) into structured, citation-ready passages.",
    "",
    "For each source provided:",
    "1. Extract and normalize the legal text into clean plain-text passages.",
    "2. Split into logical citation-ready units by natural legal boundaries (article, section, clause).",
    "3. Preserve all citation anchors, section numbers, and article references exactly as written.",
    "4. Maintain source URL and law title as provenance for every passage.",
    "",
    "Output a list of LegalPassage objects:",
    "- passageId: unique identifier for this extracted passage",
    "- evidenceId: unique identifier for this passage",
    "- sourceId: reference back to the original source",
    "- lawTitle: full name of the law/regulation (verbatim)",
    "- jurisdiction: jurisdiction of the legal source",
    "- pillarId and indicatorId: user-selected scope passed from Agent1",
    "- citationRef: specific article/section reference (e.g. 'Art. 12', 'Sec. 5.2')",
    "- sourceUrl: direct URL to the source",
    "- text: the extracted legal text passage (verbatim, no summarization)",
    "",
    "Important constraints:",
    "- Do NOT summarize, interpret, or add commentary — extract verbatim text only.",
    "- Preserve original legal language exactly, including numbering and punctuation.",
    "- If the original text contains defined terms, keep them as-is.",
    "- If parsing fails (OCR errors, garbled HTML, unreachable URL), return error type 'PARSE_FAILED'.",
    "- Each passage must be independently citable on its own."
  ].join("\n");
}

// ── Indicator Mapping Agent Instructions ──────────────────────────

export function getIndicatorMappingInstructions(): string {
  return [
    "You are an Indicator Mapping Agent for the demo workflow.",
    "Do not infer a new Pillar or indicator from the legal text.",
    "Your task is only to copy the user-specified selectedPillarId and selectedIndicatorId onto every passage.",
    "",
    "For each passage:",
    "1. Preserve evidenceId and passageId.",
    "2. Set pillarId to the selectedPillarId.",
    "3. Set indicatorId to the selectedIndicatorId.",
    "4. Use this exact mappingReason: 'Mapped according to the user-specified Pillar and indicator for this demo workflow.'",
    "",
    "Output a list of MappedEvidenceItem objects:",
    "- evidenceId: references the source passage",
    "- passageId: references the extracted passage",
    "- pillarId: selected Pillar ID",
    "- indicatorId: selected indicator ID",
    "- mappingReason: brief justification for the mapping",
    "- citationRef: the original citation reference",
    "",
    "Important constraints:",
    "- Do not override the user-selected Pillar or indicator.",
    "- Do not drop a passage only because the text could fit another indicator."
  ].join("\n");
}

// ── Risk & Cost Quantifier Agent Instructions ──────────────────────────

export function getRiskCostInstructions(taskType: LegalTaskType): string {
  const commonRules = [
    "You are a Risk & Business Impact Agent for the demo workflow.",
    "Your task is to convert completed mainline legal findings for the selected indicator into business-facing risk and impact signals.",
    "Translate legal complexity into actionable business intelligence.",
    "",
    "For each set of findings, assess risk level by indicator type and review status:",
    "- P6_1_BAN_LOCAL_PROCESSING and P6_2_LOCAL_STORAGE → higher baseline risk",
    "- P6_3_INFRASTRUCTURE and P6_4_CONDITIONAL_FLOW → moderate baseline risk",
    "- P6_5_BINDING_COMMITMENT → lower baseline risk (positive signal for cross-border flow)",
    "- Unapproved or low-confidence evidence → add one risk level penalty",
    "",
    "Determine uncertainty level:",
    "- 'High': any evidence needs human review",
    "- 'High': any rebuttal review marks a legal finding unsupported or weakly supported",
    "- 'Moderate': infrastructure or conditional flow indicators present",
    "- 'Low': all evidence is approved and straightforward",
    "",
    "Output a RiskSummary with:",
    "- riskLevel: 'Low' | 'Moderate' | 'High'",
    "- riskSummary: concise risk explanation for only the selected indicator",
    "- businessImpactSummary: narrative summary of what this means for business operations",
    "- uncertaintyLevel: 'Low' | 'Moderate' | 'High'",
    "- humanReviewNeeded: boolean"
  ].join("\n");

  if (taskType === "case-analysis") {
    return [
      commonRules,
      "Context: This is a Case Analysis — treat the business scenario as an EXISTING operation.",
      "Risk assessment must reflect current compliance gaps and immediate remediation costs.",
      "businessImpactSummary should describe what the business needs to fix NOW."
    ].join("\n");
  }

  if (taskType === "forward-looking-advisory") {
    return [
      commonRules,
      "Context: This is a Forward-looking Advisory — treat the business scenario as a PLANNED activity.",
      "Risk assessment should focus on launch readiness and pre-market barriers.",
      "businessImpactSummary should describe what the business needs to prepare BEFORE entering the market."
    ].join("\n");
  }

  return [
    commonRules,
    "Context: This is a Regulation Interpretation — focus on the cost of compliance with the interpreted rule.",
    "Risk assessment reflects the rule's intrinsic restrictiveness, not a specific business case.",
    "businessImpactSummary should describe the general compliance burden created by the rule itself."
  ].join("\n");
}

// ── Audit View & Citation Agent Instructions ──────────────────────────

export function getAuditCitationInstructions(): string {
  return [
    "You are an Audit View & Citation Agent for cross-border data policy under Pillar 6.",
    "Your task is to link mainline legal findings back to citation-ready evidence, verbatim source text, and reviewer context.",
    "You are the system's main defense against hallucination — every AI claim must remain visibly anchored in legal text.",
    "",
    "For each legal finding:",
    "1. Match the finding to its corresponding document-reader passage using evidenceId.",
    "2. Extract the verbatim source text that supports the AI's claim (exact quote in quotation marks).",
    "3. Record extractedClaim (what the AI concluded) alongside originalLegalText (what the law actually says).",
    "4. Determine traceabilityStatus:",
    "   - 'Complete': all links in the chain (finding → passage → source text → citation) are solid",
    "   - 'Needs Human Review': any link is weak, missing, or the underlying evidence is not approved",
    "5. Generate a traceabilityNote explaining the state of the evidence chain.",
    "6. Preserve reviewer context (reviewerNote, reviewStatus) from the evidence records.",
    "",
    "Output an AuditCitationOutput with:",
    "- auditItems: array of AuditCitationItem objects",
    "  - Each includes: evidenceId, sourceId, conclusionId, jurisdiction, indicatorId, lawTitle, citationRef,",
    "    sourceUrl, sourceLocator, sourceStrength, traceabilityTier, originalLegalText, verbatimSnippet,",
    "    extractedClaim, legalEffect, relevanceReason, traceabilityStatus, traceabilityNote,",
    "    humanReviewNeeded, reviewerNote, reviewStatus",
    "- coverageSummary: { totalFindings, linkedFindings, needsReviewCount }",
    "",
    "Important constraints:",
    "- The verbatimSnippet MUST be an exact quote from the source text, clearly enclosed in quotation marks.",
    "- Never fabricate or approximate citations — if the evidence chain is broken, say so in traceabilityNote.",
    "- If a finding references evidence that is missing from the passage set, still try to link it but mark as 'Needs Human Review'.",
    "- Every audit item should be independently reviewable by a law student without cross-referencing other tools.",
    "",
    "Traceability note guidelines:",
    "- If humanReviewNeeded: 'The evidence chain is linked, but a reviewer should confirm the excerpt and citation before export.'",
    "- If reviewStatus is not 'Approved': 'The legal text is linked successfully, but the underlying evidence record still needs reviewer confirmation.'",
    "- If complete: 'The legal claim, source text, and citation are fully linked for reviewer inspection.'"
  ].join("\n");
}

export function getRebuttalAgentInstructions(): string {
  return [
    "You are a rebuttal-style legal review agent for a demo cross-border data policy workflow.",
    "Your task is to challenge each legal finding before it reaches audit and export.",
    "Use only the provided legal findings, evidence records, citations, source URLs, and document-reader passages.",
    "",
    "For each legal finding:",
    "1. Check whether every cited evidenceId exists in the evidence set.",
    "2. Check whether the cited legal text can support the finding's conclusion and legalEffect.",
    "3. Flag overclaims, missing citations, wrong indicator mappings, and insufficient evidence.",
    "4. Return one status:",
    "   - Supported: citation chain exists and the claim is proportionate to the cited text.",
    "   - Weakly Supported: citation exists, but the claim needs human review or narrower wording.",
    "   - Unsupported: citation is missing, broken, or cannot support the claim.",
    "",
    "Never invent new legal sources or citations. If support is weak, propose a narrower revision.",
    "Output a RebuttalAgentOutput with reviews and a count summary."
  ].join("\n");
}

const WORKFLOW_AGENT_ORDER: WorkflowAgentId[] = [
  "intent-arbiter",
  "document-reader",
  "indicator-mapping",
  "legal-reasoner",
  "rebuttal-agent",
  "risk-cost-quantifier",
  "audit-citation",
  "legal-review-export"
];

const agentNames: Record<WorkflowAgentId, string> = {
  "intent-arbiter": "Intent Arbiter Agent",
  "query-builder": "Query Builder Agent",
  "document-reader": "Document Reader Agent",
  "indicator-mapping": "Indicator Mapping Agent",
  "legal-reasoner": "Legal Reasoner Agent",
  "rebuttal-agent": "Rebuttal Review Agent",
  "risk-cost-quantifier": "Risk & Cost Quantifier Agent",
  "audit-citation": "Audit View & Citation Agent",
  "legal-review-export": "Legal Review & Export Agent"
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEvidenceRecord(evidenceId: string, evidenceRecords: EvidenceRecord[]) {
  return evidenceRecords.find((record) => record.evidenceId === evidenceId);
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildLegalFindingsFallback(
  mappedEvidence: MappedEvidenceItem[],
  evidenceRecords: EvidenceRecord[]
): LegalReasonerOutput {
  return {
    legalFindings: mappedEvidence.flatMap((item) => {
      const record = getEvidenceRecord(item.evidenceId, evidenceRecords);

      if (!record) {
        return [];
      }

      return [
        {
          conclusionId: `CON-${record.evidenceId}`,
          jurisdiction: record.country,
          pillarId: item.pillarId,
          indicatorId: item.indicatorId,
          conclusion: record.aiExtraction,
          legalEffect: record.riskImplication,
          evidenceIds: [record.evidenceId],
          passageIds: [item.passageId]
        }
      ];
    })
  };
}

function getRebuttalStatus(
  finding: LegalReasonerOutput["legalFindings"][number],
  evidenceRecords: EvidenceRecord[],
  passages: DocumentReaderOutput["passages"]
): RebuttalReviewStatus {
  if (finding.evidenceIds.length === 0) {
    return "Unsupported";
  }

  const hasMissingEvidence = finding.evidenceIds.some(
    (evidenceId) => !getEvidenceRecord(evidenceId, evidenceRecords)
  );
  const hasMissingPassage = finding.evidenceIds.some(
    (evidenceId) => !passages.some((passage) => passage.evidenceId === evidenceId)
  );

  if (hasMissingEvidence || hasMissingPassage) {
    return "Unsupported";
  }

  const needsReview = finding.evidenceIds.some(
    (evidenceId) => getEvidenceRecord(evidenceId, evidenceRecords)?.reviewStatus !== "Approved"
  );

  return needsReview ? "Weakly Supported" : "Supported";
}

function getRebuttalIssueType(status: RebuttalReviewStatus): RebuttalIssueType | undefined {
  if (status === "Unsupported") {
    return "Missing Citation";
  }

  if (status === "Weakly Supported") {
    return "Insufficient Evidence";
  }

  return undefined;
}

function buildRebuttalNote(
  finding: LegalReasonerOutput["legalFindings"][number],
  status: RebuttalReviewStatus
) {
  if (status === "Supported") {
    return `The finding ${finding.conclusionId} is linked to available evidence and can proceed to citation audit.`;
  }

  if (status === "Weakly Supported") {
    return `The finding ${finding.conclusionId} has a citation chain, but a legal reviewer should confirm the cited text before relying on the conclusion.`;
  }

  return `The finding ${finding.conclusionId} is missing a usable citation chain and should not be exported without revision.`;
}

function buildRebuttalFallback(input: {
  legalFindings: LegalReasonerOutput["legalFindings"];
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
}): RebuttalAgentOutput {
  const reviews: RebuttalReviewItem[] = input.legalFindings.map((finding) => {
    const status = getRebuttalStatus(finding, input.evidenceRecords, input.passages);
    const issueType = getRebuttalIssueType(status);
    const suggestedRevision =
      status === "Supported"
        ? undefined
        : `Narrow the conclusion to the exact cited text for ${finding.evidenceIds.join(", ") || "the available evidence"} and require human legal review.`;

    return {
      conclusionId: finding.conclusionId,
      status,
      issueType,
      rebuttalNote: buildRebuttalNote(finding, status),
      citedEvidenceIds: finding.evidenceIds,
      suggestedRevision
    };
  });

  return {
    reviews,
    summary: {
      supportedCount: reviews.filter((review) => review.status === "Supported").length,
      weaklySupportedCount: reviews.filter((review) => review.status === "Weakly Supported").length,
      unsupportedCount: reviews.filter((review) => review.status === "Unsupported").length,
      humanReviewNeeded: reviews.some((review) => review.status !== "Supported")
    }
  };
}

function buildRelevanceReason(indicatorId: string) {
  switch (indicatorId) {
    case "P6_1_BAN_LOCAL_PROCESSING":
    case "6.1":
      return "Directly addresses local processing or offshore processing restrictions.";
    case "P6_2_LOCAL_STORAGE":
    case "6.2":
      return "Directly addresses domestic storage or localization obligations.";
    case "P6_3_INFRASTRUCTURE":
    case "6.3":
      return "Directly affects infrastructure design, hosting, or regulator-access architecture.";
    case "P6_4_CONDITIONAL_FLOW":
    case "6.4":
      return "Directly describes transfer conditions, approvals, or safeguard gates.";
    case "P6_5_BINDING_COMMITMENT":
    case "6.5":
      return "Directly describes treaty or agreement-based support for cross-border data flows.";
    default:
      return `Directly addresses the user-specified indicator ${indicatorId}.`;
  }
}

function getRelevanceBand(record: (typeof mockEvidenceRecords)[number]) {
  if (
    record.indicatorCode === "P6_3_INFRASTRUCTURE" ||
    record.reviewStatus === "Pending Review" ||
    record.confidence < 0.75
  ) {
    return "Borderline" as const;
  }

  return "Direct Match" as const;
}

function buildRelevanceReviewerPrompt(record: (typeof mockEvidenceRecords)[number]) {
  if (record.indicatorCode === "P6_3_INFRASTRUCTURE") {
    return "Confirm this passage really affects cross-border infrastructure design, not only domestic supervision.";
  }

  if (record.reviewStatus !== "Approved") {
    return "Spot-check whether this passage should stay in scope before using it in audit or export.";
  }

  return "This passage is a strong Pillar 6 fit and can move into audit packaging.";
}

function getCostDrivers(
  findings: LegalReasonerOutput["legalFindings"],
  evidenceRecords: EvidenceRecord[]
) {
  const drivers = new Set<string>();

  findings.forEach((finding) => {
    switch (finding.indicatorId) {
      case "P6_1_BAN_LOCAL_PROCESSING":
      case "6.1":
        drivers.add("local processing architecture");
        drivers.add("duplicated operating model");
        break;
      case "P6_2_LOCAL_STORAGE":
      case "6.2":
        drivers.add("domestic storage infrastructure");
        drivers.add("data residency controls");
        break;
      case "P6_3_INFRASTRUCTURE":
      case "6.3":
        drivers.add("cloud and hosting redesign");
        drivers.add("regulator-access engineering");
        break;
      case "P6_4_CONDITIONAL_FLOW":
      case "6.4":
        drivers.add("approval preparation burden");
        drivers.add("transfer assessment lead time");
        break;
      case "P6_5_BINDING_COMMITMENT":
      case "6.5":
        drivers.add("treaty exception analysis");
        drivers.add("cross-border governance documentation");
        break;
      default:
        drivers.add(`business controls for indicator ${finding.indicatorId}`);
        break;
    }

    if (
      finding.evidenceIds.some(
        (evidenceId) => getEvidenceRecord(evidenceId, evidenceRecords)?.reviewStatus !== "Approved"
      )
    ) {
      drivers.add("additional legal review time");
    }
  });

  return [...drivers];
}

function needsHumanReview(
  findings: LegalReasonerOutput["legalFindings"],
  evidenceRecords: EvidenceRecord[]
) {
  return findings.some((finding) =>
    finding.evidenceIds.some(
      (evidenceId) => getEvidenceRecord(evidenceId, evidenceRecords)?.reviewStatus !== "Approved"
    )
  );
}

function getUncertaintyLevel(
  findings: LegalReasonerOutput["legalFindings"],
  evidenceRecords: EvidenceRecord[]
): ReasoningUncertaintyLevel {
  if (needsHumanReview(findings, evidenceRecords)) {
    return "High";
  }

  if (
    findings.some(
      (finding) =>
        finding.indicatorId === "P6_3_INFRASTRUCTURE" ||
        finding.indicatorId === "P6_4_CONDITIONAL_FLOW" ||
        finding.indicatorId === "6.3" ||
        finding.indicatorId === "6.4"
    )
  ) {
    return "Moderate";
  }

  return "Low";
}

function buildTraceabilityNote(input: {
  reviewStatus: string;
  humanReviewNeeded: boolean;
  sourceLocator?: string;
  sourceStrength?: EvidenceRecord["sourceStrength"];
  traceabilityTier?: EvidenceRecord["traceabilityTier"];
}) {
  const details = [
    input.sourceLocator ? `Locator: ${input.sourceLocator}.` : null,
    input.sourceStrength ? `Source strength: ${input.sourceStrength}.` : null,
    input.traceabilityTier ? `Traceability tier: ${input.traceabilityTier}.` : null
  ]
    .filter(Boolean)
    .join(" ");

  if (input.humanReviewNeeded) {
    return `The evidence chain is linked, but a reviewer should confirm the excerpt and citation before export. ${details}`.trim();
  }

  if (input.reviewStatus !== "Approved") {
    return `The legal text is linked successfully, but the underlying evidence record still needs reviewer confirmation. ${details}`.trim();
  }

  return `The legal claim, source text, and citation are fully linked for reviewer inspection. ${details}`.trim();
}

function summarizeOperationalImpact(
  findings: LegalReasonerOutput["legalFindings"],
  riskLevel: RiskLevel,
  uncertaintyLevel: ReasoningUncertaintyLevel
) {
  const dominantIndicators = [...new Set(findings.map((finding) => finding.indicatorId))];
  const dominantPillars = [...new Set(findings.map((finding) => finding.pillarId))].join(", ");
  const summary = `The current legal findings indicate a ${riskLevel.toLowerCase()} operational risk posture for ${dominantPillars || "the selected pillar"} indicator ${dominantIndicators.join(", ")}.`;
  const qualifier =
    uncertaintyLevel === "High"
      ? " Several conclusions still need human confirmation before business teams should rely on them."
      : uncertaintyLevel === "Moderate"
        ? " Business planning can proceed, but teams should validate exceptions and trigger conditions."
        : " The resulting risk picture is relatively stable for planning and cost discussion.";

  return `${summary}${qualifier}`;
}

function success<T>(
  agentId: AgentResult<T>["agentId"],
  data: T,
  message: string,
  downstreamAgent?: AgentResult<T>["downstreamAgent"]
): AgentResult<T> {
  return {
    status: "success",
    agentId,
    data,
    message,
    downstreamAgent
  };
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
      insight: "This row explains how each market frames outbound or inbound data movement in the current analysis."
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
      insight: "The risk level combines policy restrictiveness with likely compliance complexity in the current analysis."
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
    executiveSummary: `${data.country} shows a ${riskLevel.toLowerCase()}-risk cross-border data posture, combining an openness score of ${data.opennessScore}/100 with a restrictiveness score of ${restrictionScore}/100.`,
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
  evidenceRecords: EvidenceRecord[];
  legalFindings: LegalReasonerOutput["legalFindings"];
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
}): Promise<ReportAgentResult> {
  await wait(800);

  const taskType = results.taskType ?? classifyLegalTaskType(results.businessScenario);
  const highestRiskScore = Math.max(...results.policyAnalysis.map((item) => item.restrictionScore));
  const overallRisk = toRiskLabel(highestRiskScore);
  const comparisonTable = results.comparison?.rows ?? [];
  const primaryAnalysis = results.policyAnalysis[0];
  const provider = getAnalysisProvider();
  const findingSummaries = results.legalFindings.slice(0, 3).map((finding) => {
    const evidenceLabel = finding.evidenceIds
      .map((evidenceId) => getEvidenceRecord(evidenceId, results.evidenceRecords))
      .filter(Boolean)
      .map((record) => `${record?.lawTitle} (${record?.citation})`)
      .join("; ");

    return {
      jurisdiction: finding.jurisdiction,
      conclusion: finding.conclusion,
      legalEffect: finding.legalEffect,
      evidence: evidenceLabel
    };
  });
  const clauseLevelEvidenceRetrieved =
    results.evidenceRecords.length > 0 &&
    results.evidenceRecords.some((record) => record.sourceType === "Statute");
  const evidenceSummary = findingSummaries.length
    ? findingSummaries
        .map((finding) => `${finding.jurisdiction}: ${finding.conclusion} ${finding.legalEffect}`)
        .join(" ")
    : primaryAnalysis.executiveSummary;
  const sourceLimit = clauseLevelEvidenceRetrieved
    ? "At least one retrieved source is row-level or legal-text-level evidence."
    : "The available sources are still mainly guidance, policy, or summary-level evidence and need human review before being treated as exact clause authority.";
  const fallbackReport = buildModeSpecificReportFallback({
    taskType,
    userQuery: results.userQuery,
    countryA: primaryAnalysis.country,
    countryB: results.comparison?.comparedCountries.find(
      (country) => country !== primaryAnalysis.country
    ),
    overallRisk,
    evidenceSummary,
    sourceLimit,
    evidenceLabels: findingSummaries.map((finding) => finding.evidence).filter(Boolean),
    sourceUrls: results.evidenceRecords.slice(0, 4).map((record) => record.sourceUrl)
  });

  const structuredReport = await provider.generateStructuredObject<{
    title: string;
    finalNarrative: string;
    modeSections: ModeSpecificReportSection[];
    policyRecommendations: string[];
  }>({
    schemaName: "pillar6_report",
    schemaDescription: `Judge-facing Pillar 6 report summary for the current ${TASK_LABELS[taskType]} run.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "finalNarrative", "modeSections", "policyRecommendations"],
      properties: {
        title: { type: "string" },
        finalNarrative: { type: "string" },
        modeSections: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["heading", "body"],
            properties: {
              heading: { type: "string" },
              body: { type: "string" }
            }
          }
        },
        policyRecommendations: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    instructions: getReportAgentInstructions(taskType),
    input: JSON.stringify({
      taskType,
      taskLabel: TASK_LABELS[taskType],
      businessScenario: results.businessScenario,
      userQuery: results.userQuery,
      researchSummary: results.research.summary,
      policyAnalysis: results.policyAnalysis,
      comparison: results.comparison,
      overallRisk,
      legalFindings: findingSummaries,
      clauseLevelEvidenceRetrieved
    }),
    fallback: {
      title: fallbackReport.title,
      finalNarrative: fallbackReport.finalNarrative,
      modeSections: fallbackReport.modeSections,
      policyRecommendations: fallbackReport.policyRecommendations
    }
  });
  const normalizedModeSections =
    structuredReport.object.modeSections?.length > 0
      ? structuredReport.object.modeSections
      : fallbackReport.modeSections;
  const sectionNarrative = serializeModeSections(normalizedModeSections);
  const narrativeContainsUserFact =
    inferScenarioSignals(results.userQuery).some((signal) =>
      sectionNarrative.toLowerCase().includes(signal.split(",")[0].toLowerCase())
    ) || sectionNarrative.includes(results.userQuery);
  const finalNarrative = narrativeContainsUserFact
    ? sectionNarrative
    : serializeModeSections([
        {
          heading: "User Question Anchoring",
          body: `The analysis is anchored to the user question: "${results.userQuery}"`
        },
        ...normalizedModeSections
      ]);

  return {
    title: structuredReport.object.title,
    overallRisk,
    finalNarrative,
    modeSections: normalizedModeSections,
    comparisonTable,
    policyRecommendations: structuredReport.object.policyRecommendations
  };
}

export function intentArbiterAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
}): AgentResult<IntentArbiterOutput> {
  const taskType = input.taskType ?? classifyLegalTaskType(input.businessScenario);
  const workflowMode = taskType;
  const selectedScope = extractSelectedScope(input.userQuery);
  const businessScenario = input.businessScenario?.trim() || DEFAULT_DEMO_BUSINESS_SCENARIO;

  return success(
    "intent-arbiter",
    {
      normalizedIntent: getTaskIntent({
        taskType,
        countryA: input.countryA,
        countryB: input.countryB,
        userQuery: input.userQuery
      }),
      workflowMode,
      taskType,
      selectedPillarId: selectedScope.selectedPillarId,
      selectedIndicatorId: selectedScope.selectedIndicatorId,
      businessScenario,
      scopeConfirmed: selectedScope.scopeConfirmed,
      focusIndicators: [`${selectedScope.selectedPillarId}:${selectedScope.selectedIndicatorId}`]
    },
    `Intent normalized as ${TASK_LABELS[taskType]} and routed to ${selectedScope.selectedPillarId} indicator ${selectedScope.selectedIndicatorId}.`,
    "document-reader"
  );
}

export async function documentReaderAgent(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  selectedPillarId: PillarId;
  selectedIndicatorId: string;
}): Promise<AgentResult<DocumentReaderOutput>> {
  const provider = getAnalysisProvider();
  const scopedEvidenceRecords = filterEvidenceByCountries(
    input.evidenceRecords,
    input.countryA,
    input.countryB ?? ""
  ).filter((record) => evidenceMatchesScope(record, input.selectedPillarId, input.selectedIndicatorId));

  const fallbackPassages = scopedEvidenceRecords.map((record, index) => ({
    passageId: `PASS-${record.evidenceId}-${index + 1}`,
    evidenceId: record.evidenceId,
    sourceId: `SRC-${record.evidenceId}`,
    lawTitle: record.lawTitle,
    jurisdiction: record.country,
    pillarId: input.selectedPillarId,
    indicatorId: input.selectedIndicatorId,
    citationRef: record.sourceLocator
      ? `${record.citation} (${record.sourceLocator})`
      : record.citation,
    sourceUrl: record.sourceUrl,
    text: record.originalLegalText
  }));

  const structResult = await provider.generateStructuredObject<DocumentReaderOutput>({
    schemaName: "demo_legal_passages",
    schemaDescription: "Structured legal passages extracted from the current manually imported evidence set.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["passages"],
      properties: {
        passages: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "passageId",
              "evidenceId",
              "sourceId",
              "lawTitle",
              "jurisdiction",
              "pillarId",
              "indicatorId",
              "citationRef",
              "sourceUrl",
              "text"
            ],
            properties: {
              passageId: { type: "string" },
              evidenceId: { type: "string" },
              sourceId: { type: "string" },
              lawTitle: { type: "string" },
              jurisdiction: { type: "string" },
              pillarId: { type: "string", enum: ["P6", "P7"] },
              indicatorId: { type: "string" },
              citationRef: { type: "string" },
              sourceUrl: { type: "string" },
              text: { type: "string" }
            }
          }
        }
      }
    },
    instructions: getDocumentReaderInstructions(),
    input: JSON.stringify({
      sourceCount: scopedEvidenceRecords.length,
      sources: scopedEvidenceRecords.map((record) => ({
        sourceId: `SRC-${record.evidenceId}`,
        evidenceId: record.evidenceId,
        lawTitle: record.lawTitle,
        jurisdiction: record.country,
        pillarId: input.selectedPillarId,
        indicatorId: input.selectedIndicatorId,
        sourceType: record.sourceType,
        sourceUrl: record.sourceUrl,
        relevanceNote: buildRelevanceReason(input.selectedIndicatorId)
      })),
      evidenceLookup: scopedEvidenceRecords.map((r) => ({
        evidenceId: r.evidenceId,
        lawTitle: r.lawTitle,
        citation: r.citation,
        sourceLocator: r.sourceLocator,
        originalLegalText: r.originalLegalText
      }))
    }),
    fallback: { passages: fallbackPassages }
  });

  return success(
    "document-reader",
    { passages: structResult.object.passages },
    "Scoped evidence records normalized into citation-ready legal passages.",
    "indicator-mapping"
  );
}

export async function indicatorMappingAgent(input: {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  selectedPillarId: PillarId;
  selectedIndicatorId: string;
}): Promise<AgentResult<IndicatorMappingOutput>> {
  const provider = getAnalysisProvider();

  const fallbackMapped: MappedEvidenceItem[] = input.passages.flatMap((passage) => {
    const record = input.evidenceRecords.find((item) => item.evidenceId === passage.evidenceId);

    if (!record) {
      return [];
    }

    return [
      {
        evidenceId: record.evidenceId,
        passageId: passage.passageId,
        pillarId: input.selectedPillarId,
        indicatorId: input.selectedIndicatorId,
        mappingReason:
          "Mapped according to the user-specified Pillar and indicator for this demo workflow.",
        citationRef: record.sourceLocator
          ? `${record.citation} (${record.sourceLocator})`
          : record.citation
      }
    ];
  });

  const structResult = await provider.generateStructuredObject<IndicatorMappingOutput>({
    schemaName: "demo_indicator_mapping",
    schemaDescription: "Legal passages tagged with the user-selected demo Pillar and indicator.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["mappedEvidence"],
      properties: {
        mappedEvidence: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["evidenceId", "passageId", "pillarId", "indicatorId", "mappingReason", "citationRef"],
            properties: {
              evidenceId: { type: "string" },
              passageId: { type: "string" },
              pillarId: { type: "string", enum: ["P6", "P7"] },
              indicatorId: { type: "string" },
              mappingReason: { type: "string" },
              citationRef: { type: "string" }
            }
          }
        }
      }
    },
    instructions: getIndicatorMappingInstructions(),
    input: JSON.stringify({
      passageCount: input.passages.length,
      passages: input.passages.map((p) => ({
        passageId: p.passageId,
        evidenceId: p.evidenceId,
        lawTitle: p.lawTitle,
        pillarId: input.selectedPillarId,
        indicatorId: input.selectedIndicatorId,
        citationRef: p.citationRef,
        sourceUrl: p.sourceUrl,
        text: p.text
      })),
      evidenceContext: input.evidenceRecords.map((r) => ({
        evidenceId: r.evidenceId,
        country: r.country,
        lawTitle: r.lawTitle,
        citation: r.citation,
        selectedPillarId: input.selectedPillarId,
        selectedIndicatorId: input.selectedIndicatorId
      }))
    }),
    fallback: { mappedEvidence: fallbackMapped }
  });

  return success(
    "indicator-mapping",
    { mappedEvidence: structResult.object.mappedEvidence },
    "Legal passages tagged with the user-specified demo Pillar and indicator.",
    "legal-reasoner"
  );
}

export async function legalReasonerAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  mappedEvidence: MappedEvidenceItem[];
}): Promise<AgentResult<LegalReasonerOutput>> {
  const taskType = input.taskType ?? classifyLegalTaskType(input.businessScenario);
  const provider = getAnalysisProvider();
  const evidencePayload = input.mappedEvidence.flatMap((item) => {
    const record = getEvidenceRecord(item.evidenceId, input.evidenceRecords);

    if (!record) {
      return [];
    }

    return [
      {
        evidenceId: record.evidenceId,
        passageId: item.passageId,
        jurisdiction: record.country,
        pillarId: item.pillarId,
        indicatorId: item.indicatorId,
        lawTitle: record.lawTitle,
        citationRef: record.citation,
        sourceUrl: record.sourceUrl,
        sourceLocator: record.sourceLocator,
        sourceStrength: record.sourceStrength,
        traceabilityTier: record.traceabilityTier,
        excerpt: record.verbatimSnippet,
        originalLegalText: record.originalLegalText,
        analystNote: record.aiExtraction,
        legalEffectHint: record.riskImplication,
        mappingReason: item.mappingReason,
        reviewStatus: record.reviewStatus,
        confidence: record.confidence
      }
    ];
  });

  const fallback = buildLegalFindingsFallback(input.mappedEvidence, input.evidenceRecords);
  const structuredReasoning = await provider.generateStructuredObject<LegalReasonerOutput>({
    schemaName: "demo_legal_findings",
    schemaDescription: "Structured legal findings grounded in manually imported evidence.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["legalFindings"],
      properties: {
        legalFindings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "conclusionId",
              "jurisdiction",
              "pillarId",
              "indicatorId",
              "conclusion",
              "legalEffect",
              "evidenceIds",
              "passageIds"
            ],
            properties: {
              conclusionId: { type: "string" },
              jurisdiction: { type: "string" },
              pillarId: { type: "string", enum: ["P6", "P7"] },
              indicatorId: { type: "string" },
              conclusion: { type: "string" },
              legalEffect: { type: "string" },
              evidenceIds: {
                type: "array",
                items: { type: "string" }
              },
              passageIds: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        }
      }
    },
    instructions: getLegalReasonerInstructions(taskType),
    input: JSON.stringify({
      countries: dedupeStrings([input.countryA, input.countryB ?? ""]),
      taskType,
      taskLabel: TASK_LABELS[taskType],
      businessScenario: input.businessScenario,
      userQuery: input.userQuery,
      passages: input.passages,
      mappedEvidence: evidencePayload
    }),
    fallback
  });
  const legalFindings = structuredReasoning.object.legalFindings.flatMap((finding, index) => {
    const validEvidenceIds = finding.evidenceIds.filter((evidenceId) =>
      input.evidenceRecords.some((record) => record.evidenceId === evidenceId)
    );
    const fallbackFinding = fallback.legalFindings[index];
    const normalizedEvidenceIds =
      validEvidenceIds.length > 0 ? validEvidenceIds : fallbackFinding?.evidenceIds ?? [];
    const validPassageIds = (finding.passageIds ?? []).filter((passageId) =>
      input.passages.some((passage) => passage.passageId === passageId)
    );
    const normalizedPassageIds =
      validPassageIds.length > 0
        ? validPassageIds
        : fallbackFinding?.passageIds ??
          input.mappedEvidence
            .filter((item) => normalizedEvidenceIds.includes(item.evidenceId))
            .map((item) => item.passageId);

    if (normalizedEvidenceIds.length === 0 || normalizedPassageIds.length === 0) {
      return [];
    }

    return [
      {
        ...finding,
        conclusionId: finding.conclusionId || fallbackFinding?.conclusionId || `CON-${index + 1}`,
        jurisdiction: finding.jurisdiction || fallbackFinding?.jurisdiction || input.countryA,
        pillarId: finding.pillarId || fallbackFinding?.pillarId || input.mappedEvidence[0]?.pillarId || "P6",
        indicatorId:
          finding.indicatorId || fallbackFinding?.indicatorId || input.mappedEvidence[0]?.indicatorId || "6.4",
        legalEffect: finding.legalEffect || fallbackFinding?.legalEffect || "",
        conclusion: finding.conclusion || fallbackFinding?.conclusion || "",
        evidenceIds: normalizedEvidenceIds,
        passageIds: normalizedPassageIds
      }
    ];
  });

  return success(
    "legal-reasoner",
    {
      legalFindings: legalFindings.length > 0 ? legalFindings : fallback.legalFindings
    },
    "Evidence-backed legal findings generated for downstream risk and audit agents.",
    "rebuttal-agent"
  );
}

export async function rebuttalAgent(input: {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  legalFindings: LegalReasonerOutput["legalFindings"];
}): Promise<AgentResult<RebuttalAgentOutput>> {
  const provider = getAnalysisProvider();
  const fallback = buildRebuttalFallback(input);

  const structResult = await provider.generateStructuredObject<RebuttalAgentOutput>({
    schemaName: "pillar6_rebuttal_review",
    schemaDescription: "Rebuttal-style verification of Pillar 6 legal findings against cited evidence.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["reviews", "summary"],
      properties: {
        reviews: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["conclusionId", "status", "rebuttalNote", "citedEvidenceIds"],
            properties: {
              conclusionId: { type: "string" },
              status: {
                type: "string",
                enum: ["Supported", "Weakly Supported", "Unsupported"]
              },
              issueType: {
                type: "string",
                enum: ["Missing Citation", "Overclaim", "Wrong Indicator", "Insufficient Evidence"]
              },
              rebuttalNote: { type: "string" },
              citedEvidenceIds: {
                type: "array",
                items: { type: "string" }
              },
              suggestedRevision: { type: "string" }
            }
          }
        },
        summary: {
          type: "object",
          additionalProperties: false,
          required: [
            "supportedCount",
            "weaklySupportedCount",
            "unsupportedCount",
            "humanReviewNeeded"
          ],
          properties: {
            supportedCount: { type: "number" },
            weaklySupportedCount: { type: "number" },
            unsupportedCount: { type: "number" },
            humanReviewNeeded: { type: "boolean" }
          }
        }
      }
    },
    instructions: getRebuttalAgentInstructions(),
    input: JSON.stringify({
      legalFindings: input.legalFindings,
      passages: input.passages.map((passage) => ({
        evidenceId: passage.evidenceId,
        sourceId: passage.sourceId,
        lawTitle: passage.lawTitle,
        citationRef: passage.citationRef,
        sourceUrl: passage.sourceUrl,
        text: passage.text
      })),
      evidenceRecords: input.evidenceRecords.map((record) => ({
        evidenceId: record.evidenceId,
        indicatorCode: record.indicatorCode,
        lawTitle: record.lawTitle,
        citation: record.citation,
        sourceUrl: record.sourceUrl,
        originalLegalText: record.originalLegalText,
        reviewStatus: record.reviewStatus,
        confidence: record.confidence
      }))
    }),
    fallback
  });

  return success(
    "rebuttal-agent",
    structResult.object,
    "Legal findings challenged against cited evidence before audit and export.",
    "risk-cost-quantifier"
  );
}

export async function runMainlineAgents(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
}): Promise<MainlineAgentResults> {
  const intentArbiter = intentArbiterAgent(input);
  const documentReader = await documentReaderAgent({
    evidenceRecords: input.evidenceRecords,
    countryA: input.countryA,
    countryB: input.countryB,
    selectedPillarId: intentArbiter.data?.selectedPillarId ?? "P6",
    selectedIndicatorId: intentArbiter.data?.selectedIndicatorId ?? "6.4"
  });
  const indicatorMapping = await indicatorMappingAgent({
    evidenceRecords: input.evidenceRecords,
    passages: documentReader.data?.passages ?? [],
    selectedPillarId: intentArbiter.data?.selectedPillarId ?? "P6",
    selectedIndicatorId: intentArbiter.data?.selectedIndicatorId ?? "6.4"
  });
  const legalReasoner = await legalReasonerAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    businessScenario: intentArbiter.data?.businessScenario ?? input.businessScenario,
    taskType: input.taskType ?? intentArbiter.data?.taskType,
    userQuery: input.userQuery,
    evidenceRecords: input.evidenceRecords,
    passages: documentReader.data?.passages ?? [],
    mappedEvidence: indicatorMapping.data?.mappedEvidence ?? []
  });

  return {
    intentArbiter,
    documentReader,
    indicatorMapping,
    legalReasoner
  };
}

export function queryBuilderAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
  intent: IntentArbiterOutput;
}): AgentResult<QueryBuilderOutput> {
  const taskType = input.taskType ?? input.intent.taskType ?? classifyLegalTaskType(input.businessScenario);
  const p6FocusIndicators = input.intent.focusIndicators.filter((indicator): indicator is Pillar6IndicatorEnum =>
    ALL_PILLAR6_INDICATORS.includes(indicator as Pillar6IndicatorEnum)
  );
  const preferredSources = preferredSourceOptions.filter((source) => {
    if (p6FocusIndicators.includes("P6_5_BINDING_COMMITMENT")) {
      return true;
    }

    return source !== "International agreement database";
  });

  const profile = buildSearchProfile({
    jurisdiction: input.countryA,
    businessScenario: input.businessScenario,
    plainLanguageQuery: input.userQuery,
    aiGeneratedTerms: [
      buildAiSuggestedTerms(input.countryA, input.businessScenario),
      ...getTaskSearchTerms(taskType)
    ].join(", "),
    lawStudentTerms: input.countryB
      ? `${input.countryB} transfer pathway, comparison evidence, ${TASK_LABELS[taskType]}`
      : `transfer mechanism, regulator approval, ${TASK_LABELS[taskType]}`,
    exclusionTerms: "tax data, telecom tariffs, customs duty",
    preferredSources,
    focusIndicators: p6FocusIndicators.length > 0 ? p6FocusIndicators : ALL_PILLAR6_INDICATORS,
    normalizedIntent: input.intent.normalizedIntent
  });

  return success(
    "query-builder",
    toQueryBuilderOutput(profile),
    "Bypass query plan retained for future Legal Term Wiki and source retrieval expansion."
  );
}

export async function riskCostQuantifierAgent(input: {
  evidenceRecords: EvidenceRecord[];
  jurisdiction: SupportedCountry;
  taskType?: LegalTaskType;
  businessScenario: string;
  legalFindings: LegalReasonerOutput["legalFindings"];
  rebuttalReview?: RebuttalAgentOutput | null;
}): Promise<AgentResult<RiskCostQuantifierOutput>> {
  const taskType = input.taskType ?? classifyLegalTaskType(input.businessScenario);
  const provider = getAnalysisProvider();

  const highestRiskFinding = input.legalFindings.reduce<number>((current, finding) => {
    const score =
      finding.indicatorId === "P6_1_BAN_LOCAL_PROCESSING" ||
      finding.indicatorId === "P6_2_LOCAL_STORAGE" ||
      finding.indicatorId === "6.1" ||
      finding.indicatorId === "6.2"
        ? 3
        : finding.indicatorId === "P6_3_INFRASTRUCTURE" ||
            finding.indicatorId === "P6_4_CONDITIONAL_FLOW" ||
            finding.indicatorId === "6.3" ||
            finding.indicatorId === "6.4"
          ? 2
          : 1;
    const reviewPenalty = finding.evidenceIds.some(
      (evidenceId) => getEvidenceRecord(evidenceId, input.evidenceRecords)?.reviewStatus !== "Approved"
    )
      ? 1
      : 0;

    return Math.max(current, score + reviewPenalty);
  }, 0);

  const fallbackRiskLevel: RiskLevel =
    highestRiskFinding >= 4 ? "High" : highestRiskFinding >= 2 ? "Moderate" : "Low";
  const rebuttalNeedsReview = input.rebuttalReview?.summary.humanReviewNeeded === true;
  const fallbackUncertainty: ReasoningUncertaintyLevel = rebuttalNeedsReview
    ? "High"
    : getUncertaintyLevel(input.legalFindings, input.evidenceRecords);
  const businessImpactSummary = summarizeOperationalImpact(
    input.legalFindings,
    fallbackRiskLevel,
    fallbackUncertainty
  );
  const fallbackSummary: RiskSummary = {
    riskLevel: fallbackRiskLevel,
    riskSummary: `Risk is ${fallbackRiskLevel} for the selected indicator based on the bound legal findings.`,
    businessImpactSummary,
    operationalImpact: businessImpactSummary,
    uncertaintyLevel: fallbackUncertainty,
    humanReviewNeeded:
      needsHumanReview(input.legalFindings, input.evidenceRecords) || rebuttalNeedsReview
  };

  const structResult = await provider.generateStructuredObject<RiskSummary>({
    schemaName: "demo_indicator_risk_summary",
    schemaDescription: "Business-facing risk and impact assessment for the user-selected indicator.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["riskLevel", "riskSummary", "businessImpactSummary", "uncertaintyLevel", "humanReviewNeeded"],
      properties: {
        riskLevel: { type: "string", enum: ["Low", "Moderate", "High"] },
        riskSummary: { type: "string" },
        businessImpactSummary: { type: "string" },
        uncertaintyLevel: { type: "string", enum: ["Low", "Moderate", "High"] },
        humanReviewNeeded: { type: "boolean" }
      }
    },
    instructions: getRiskCostInstructions(taskType),
    input: JSON.stringify({
      jurisdiction: input.jurisdiction,
      taskType,
      taskLabel: TASK_LABELS[taskType],
      businessScenario: input.businessScenario,
      legalFindings: input.legalFindings.map((f) => ({
        conclusionId: f.conclusionId,
        jurisdiction: f.jurisdiction,
        pillarId: f.pillarId,
        indicatorId: f.indicatorId,
        conclusion: f.conclusion,
        legalEffect: f.legalEffect,
        evidenceIds: f.evidenceIds,
        passageIds: f.passageIds
      })),
      evidenceApprovalStatus: input.legalFindings.flatMap((f) =>
        f.evidenceIds.map((eid) => ({
          evidenceId: eid,
          reviewStatus: getEvidenceRecord(eid, input.evidenceRecords)?.reviewStatus ?? "Unknown"
        }))
      ),
      rebuttalReview: input.rebuttalReview
    }),
    fallback: fallbackSummary
  });

  return success(
    "risk-cost-quantifier",
    {
      riskSummary: {
        ...structResult.object,
        operationalImpact: structResult.object.businessImpactSummary
      }
    },
    "Mainline legal findings translated into business-facing risk and cost signals.",
    "audit-citation"
  );
}

export async function auditCitationAgent(input: {
  evidenceRecords: EvidenceRecord[];
  passages: DocumentReaderOutput["passages"];
  legalFindings: LegalReasonerOutput["legalFindings"];
}): Promise<AgentResult<AuditCitationOutput>> {
  const provider = getAnalysisProvider();

  const fallbackAuditItems: AuditCitationItem[] = input.legalFindings.flatMap((finding) => {
    const evidenceId = finding.evidenceIds[0];
    const passage = input.passages.find((item) => item.evidenceId === evidenceId);
    const record = evidenceId ? getEvidenceRecord(evidenceId, input.evidenceRecords) : null;

    if (!passage || !record) {
      return [];
    }

    const humanReviewNeeded = record.reviewStatus !== "Approved";
    const traceabilityStatus = humanReviewNeeded ? "Needs Human Review" : "Complete";

    return [
      {
        evidenceId,
        sourceId: passage.sourceId,
        conclusionId: finding.conclusionId,
        jurisdiction: record.country,
        pillarId: finding.pillarId,
        indicatorId: finding.indicatorId,
        passageId: passage.passageId,
        lawTitle: passage.lawTitle,
        citationRef: passage.citationRef,
        sourceUrl: passage.sourceUrl,
        sourceLocator: record.sourceLocator,
        sourceStrength: record.sourceStrength,
        traceabilityTier: record.traceabilityTier,
        originalLegalText: passage.text,
        verbatimSnippet: record.verbatimSnippet,
        extractedClaim: finding.conclusion,
        legalEffect: finding.legalEffect,
        relevanceReason: buildRelevanceReason(finding.indicatorId),
        traceabilityStatus,
        traceabilityNote: buildTraceabilityNote({
          reviewStatus: record.reviewStatus,
          humanReviewNeeded,
          sourceLocator: record.sourceLocator,
          sourceStrength: record.sourceStrength,
          traceabilityTier: record.traceabilityTier
        }),
        humanReviewNeeded,
        reviewerNote: record.reviewerNote,
        reviewStatus: record.reviewStatus
      }
    ];
  });

  const structResult = await provider.generateStructuredObject<AuditCitationOutput>({
    schemaName: "demo_audit_citation",
    schemaDescription: "Audit items linking legal findings to source text and citations.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["auditItems", "coverageSummary"],
      properties: {
        auditItems: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "evidenceId", "sourceId", "conclusionId", "jurisdiction", "pillarId", "indicatorId", "passageId",
              "lawTitle", "citationRef", "sourceUrl", "originalLegalText", "verbatimSnippet",
              "extractedClaim", "legalEffect", "relevanceReason", "traceabilityStatus",
              "traceabilityNote", "humanReviewNeeded", "reviewerNote", "reviewStatus"
            ],
            properties: {
              evidenceId: { type: "string" },
              sourceId: { type: "string" },
              conclusionId: { type: "string" },
              jurisdiction: { type: "string" },
              pillarId: { type: "string", enum: ["P6", "P7"] },
              indicatorId: { type: "string" },
              passageId: { type: "string" },
              lawTitle: { type: "string" },
              citationRef: { type: "string" },
              sourceUrl: { type: "string" },
              sourceLocator: { type: "string" },
              sourceStrength: { type: "string" },
              traceabilityTier: { type: "string" },
              originalLegalText: { type: "string" },
              verbatimSnippet: { type: "string" },
              extractedClaim: { type: "string" },
              legalEffect: { type: "string" },
              relevanceReason: { type: "string" },
              traceabilityStatus: { type: "string", enum: ["Complete", "Needs Human Review"] },
              traceabilityNote: { type: "string" },
              humanReviewNeeded: { type: "boolean" },
              reviewerNote: { type: "string" },
              reviewStatus: { type: "string" }
            }
          }
        },
        coverageSummary: {
          type: "object",
          additionalProperties: false,
          required: ["totalFindings", "linkedFindings", "needsReviewCount"],
          properties: {
            totalFindings: { type: "number" },
            linkedFindings: { type: "number" },
            needsReviewCount: { type: "number" }
          }
        }
      }
    },
    instructions: getAuditCitationInstructions(),
    input: JSON.stringify({
      totalFindings: input.legalFindings.length,
      legalFindings: input.legalFindings.map((f) => ({
        conclusionId: f.conclusionId,
        jurisdiction: f.jurisdiction,
        pillarId: f.pillarId,
        indicatorId: f.indicatorId,
        conclusion: f.conclusion,
        legalEffect: f.legalEffect,
        evidenceIds: f.evidenceIds,
        passageIds: f.passageIds
      })),
      passages: input.passages.map((p) => ({
        passageId: p.passageId,
        evidenceId: p.evidenceId,
        sourceId: p.sourceId,
        lawTitle: p.lawTitle,
        jurisdiction: p.jurisdiction,
        pillarId: p.pillarId,
        indicatorId: p.indicatorId,
        citationRef: p.citationRef,
        sourceUrl: p.sourceUrl,
        text: p.text,
        relevanceReason: buildRelevanceReason(p.indicatorId)
      })),
      evidenceContext: input.evidenceRecords.map((r) => ({
        evidenceId: r.evidenceId,
        country: r.country,
        lawTitle: r.lawTitle,
        citation: r.citation,
        sourceUrl: r.sourceUrl,
        sourceLocator: r.sourceLocator,
        sourceStrength: r.sourceStrength,
        traceabilityTier: r.traceabilityTier,
        verbatimSnippet: r.verbatimSnippet,
        aiExtraction: r.aiExtraction,
        riskImplication: r.riskImplication,
        reviewerNote: r.reviewerNote,
        reviewStatus: r.reviewStatus
      }))
    }),
    fallback: {
      auditItems: fallbackAuditItems,
      coverageSummary: {
        totalFindings: input.legalFindings.length,
        linkedFindings: fallbackAuditItems.length,
        needsReviewCount: fallbackAuditItems.filter((item) => item.humanReviewNeeded).length
      }
    }
  });

  return success(
    "audit-citation",
    {
      auditItems: structResult.object.auditItems,
      coverageSummary: structResult.object.coverageSummary
    },
    "Mainline findings stitched back to legal text, citations, and reviewer context.",
    "legal-review-export"
  );
}

export function legalReviewExportAgent(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  auditItems: AuditCitationItem[];
  riskSummary: RiskSummary;
  rebuttalReview: RebuttalAgentOutput;
  comparison: ComparisonAgentResult | null;
}): AgentResult<{
  finalReport: string;
  judgeSummary: string;
  exportReadiness: "Ready for Judge Review" | "Needs Human Review";
  reviewSummary: {
    approvedCount: number;
    needsRevisionCount: number;
    rejectedCount: number;
    humanReviewCount: number;
  };
  exportJson: Record<string, unknown>;
  exportCsvRows: Array<Record<string, string | number>>;
  exportMarkdown: string;
}> {
  const mappedIndicators = [...new Set(input.auditItems.map((item) => item.indicatorId))];
  const approvedCount = input.auditItems.filter((item) => item.reviewStatus === "Approved").length;
  const needsRevisionCount = input.auditItems.filter(
    (item) => item.reviewStatus === "Needs Revision"
  ).length;
  const rejectedCount = input.auditItems.filter((item) => item.reviewStatus === "Rejected").length;
  const humanReviewCount = input.auditItems.filter((item) => item.humanReviewNeeded).length;
  const exportReadiness =
    humanReviewCount > 0 ||
    needsRevisionCount > 0 ||
    rejectedCount > 0 ||
    input.rebuttalReview.summary.humanReviewNeeded
      ? "Needs Human Review"
      : "Ready for Judge Review";
  const rebuttalSummary = input.rebuttalReview.summary;
  const finalReport = input.comparison
    ? `${input.businessScenario} scenario review across ${input.countryA} and ${input.countryB} indicates ${input.riskSummary.riskLevel.toLowerCase()} risk with ${mappedIndicators.length} mapped Pillar 6 indicator areas.`
    : `${input.businessScenario} scenario review for ${input.countryA} indicates ${input.riskSummary.riskLevel.toLowerCase()} risk with ${mappedIndicators.length} mapped Pillar 6 indicator areas.`;
  const judgeSummary = `${finalReport} ${approvedCount} evidence item(s) are approved for presentation, while ${humanReviewCount} item(s) still need human legal review. Rebuttal review marked ${rebuttalSummary.supportedCount} supported, ${rebuttalSummary.weaklySupportedCount} weakly supported, and ${rebuttalSummary.unsupportedCount} unsupported conclusion(s).`;
  const reviewSummary = {
    approvedCount,
    needsRevisionCount,
    rejectedCount,
    humanReviewCount
  };
  const exportJson = {
    scope: "Pillar 6",
    jurisdictions: [input.countryA, input.countryB].filter(Boolean),
    mappedIndicators,
    exportReadiness,
    reviewSummary,
    riskSummary: input.riskSummary,
    rebuttalReview: input.rebuttalReview,
    auditItems: input.auditItems
  };
  const exportCsvRows = input.auditItems.map((item) => ({
    evidenceId: item.evidenceId,
    citationRef: item.citationRef,
    sourceLocator: item.sourceLocator ?? "",
    sourceStrength: item.sourceStrength ?? "",
    traceabilityTier: item.traceabilityTier ?? "",
    indicatorId: item.indicatorId,
    reviewStatus: item.reviewStatus,
    traceabilityStatus: item.traceabilityStatus,
    riskLevel: input.riskSummary.riskLevel
  }));
  const exportMarkdown = [
    "# Pillar 6 Review Package",
    "",
    `- Scenario: ${input.businessScenario}`,
    `- Primary jurisdiction: ${input.countryA}`,
    input.countryB ? `- Comparison jurisdiction: ${input.countryB}` : null,
    `- Risk level: ${input.riskSummary.riskLevel}`,
    `- Uncertainty: ${input.riskSummary.uncertaintyLevel}`,
    `- Export readiness: ${exportReadiness}`,
    `- Rebuttal supported: ${rebuttalSummary.supportedCount}`,
    `- Rebuttal weakly supported: ${rebuttalSummary.weaklySupportedCount}`,
    `- Rebuttal unsupported: ${rebuttalSummary.unsupportedCount}`,
    "",
    "## Review Summary",
    `- Approved: ${approvedCount}`,
    `- Needs revision: ${needsRevisionCount}`,
    `- Rejected: ${rejectedCount}`,
    `- Human review needed: ${humanReviewCount}`,
    "",
    "## Audit Items",
    ...input.auditItems.flatMap((item) => [
      `### ${item.lawTitle} (${item.citationRef})`,
      `- Indicator: ${item.indicatorId}`,
      item.sourceLocator ? `- Source locator: ${item.sourceLocator}` : null,
      item.sourceStrength ? `- Source strength: ${item.sourceStrength}` : null,
      item.traceabilityTier ? `- Traceability tier: ${item.traceabilityTier}` : null,
      `- Review status: ${item.reviewStatus}`,
      `- Traceability status: ${item.traceabilityStatus}`,
      `- Source URL: ${item.sourceUrl}`,
      "",
      item.verbatimSnippet,
      "",
      `AI claim: ${item.extractedClaim}`,
      `Legal effect: ${item.legalEffect}`,
      `Traceability note: ${item.traceabilityNote}`,
      `Reviewer note: ${item.reviewerNote}`,
      ""
    ])
  ]
    .filter(Boolean)
    .join("\n");

  return success(
    "legal-review-export",
    {
      finalReport,
      judgeSummary,
      exportReadiness,
      reviewSummary,
      exportJson,
      exportCsvRows,
      exportMarkdown
    },
    "Audit chain and reviewer context packaged into export-ready deliverables."
  );
}

export async function runSupportingAgents(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
  mainlineAgentResults: MainlineAgentResults;
  comparison: ComparisonAgentResult | null;
}): Promise<SupportingAgentResults> {
  const taskType =
    input.taskType ??
    input.mainlineAgentResults.intentArbiter.data?.taskType ??
    classifyLegalTaskType(input.businessScenario);
  const intent =
    input.mainlineAgentResults.intentArbiter.data ?? {
      normalizedIntent: input.userQuery,
      workflowMode: taskType,
      taskType,
      selectedPillarId: "P6" as const,
      selectedIndicatorId: "6.4",
      businessScenario: input.businessScenario,
      scopeConfirmed: true,
      focusIndicators: ["P6:6.4"]
    };

  const queryBuilder = queryBuilderAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    businessScenario: intent.businessScenario,
    taskType,
    userQuery: input.userQuery,
    intent
  });
  const rebuttalReview = await rebuttalAgent({
    evidenceRecords: input.evidenceRecords,
    passages: input.mainlineAgentResults.documentReader.data?.passages ?? [],
    legalFindings: input.mainlineAgentResults.legalReasoner.data?.legalFindings ?? []
  });
  const riskCostQuantifier = await riskCostQuantifierAgent({
    evidenceRecords: input.evidenceRecords,
    jurisdiction: input.countryA,
    taskType,
    businessScenario: intent.businessScenario,
    legalFindings: input.mainlineAgentResults.legalReasoner.data?.legalFindings ?? [],
    rebuttalReview: rebuttalReview.data ?? null
  });
  const auditCitation = await auditCitationAgent({
    evidenceRecords: input.evidenceRecords,
    passages: input.mainlineAgentResults.documentReader.data?.passages ?? [],
    legalFindings: input.mainlineAgentResults.legalReasoner.data?.legalFindings ?? []
  });
  const legalReviewExport = legalReviewExportAgent({
    countryA: input.countryA,
    countryB: input.countryB,
    businessScenario: intent.businessScenario,
    auditItems: auditCitation.data?.auditItems ?? [],
    riskSummary:
      riskCostQuantifier.data?.riskSummary ?? {
        riskLevel: "Low",
        riskSummary: "No downstream legal findings were available for business-risk packaging.",
        businessImpactSummary: "No downstream legal findings were available for business-risk packaging.",
        operationalImpact: "No downstream legal findings were available for business-risk packaging.",
        uncertaintyLevel: "Low",
        humanReviewNeeded: false
      },
    rebuttalReview:
      rebuttalReview.data ?? {
        reviews: [],
        summary: {
          supportedCount: 0,
          weaklySupportedCount: 0,
          unsupportedCount: 0,
          humanReviewNeeded: false
        }
      },
    comparison: input.comparison
  });

  return {
    queryBuilder,
    rebuttalAgent: rebuttalReview,
    riskCostQuantifier,
    auditCitation,
    legalReviewExport
  };
}

function nextAgent(agentId: WorkflowAgentId): WorkflowAgentId | null {
  const index = WORKFLOW_AGENT_ORDER.indexOf(agentId);

  return WORKFLOW_AGENT_ORDER[index + 1] ?? null;
}

function buildWorkflowAgentTrace(input: {
  evidenceRecords: EvidenceRecord[];
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
  taskType?: LegalTaskType;
  userQuery: string;
  policyAnalysis: PolicyAnalysisResult[];
  riskSummary?: RiskSummary | null;
}): WorkflowAgentTrace[] {
  const taskType = input.taskType ?? classifyLegalTaskType(input.businessScenario);
  const countries = [input.countryA, input.countryB].filter(Boolean).join(" and ");
  const selectedScope = extractSelectedScope(input.userQuery);
  const evidenceIds = filterEvidenceByCountries(
    input.evidenceRecords,
    input.countryA,
    input.countryB ?? ""
  ).map((record) => record.evidenceId);
  const approvedEvidenceIds = filterEvidenceByCountries(
    input.evidenceRecords,
    input.countryA,
    input.countryB ?? ""
  )
    .filter((record) => record.reviewStatus === "Approved")
    .map((record) => record.evidenceId);

  return [
    {
      agentId: "intent-arbiter",
      name: agentNames["intent-arbiter"],
      inputSummary: `${countries} | ${TASK_LABELS[taskType]} | ${input.userQuery}`,
      outputSummary: `Routes the request to ${TASK_LABELS[taskType]} for ${selectedScope.selectedPillarId} indicator ${selectedScope.selectedIndicatorId}.`,
      evidenceIds: [],
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Confirm analysis scope"
      },
      nextAgent: nextAgent("intent-arbiter")
    },
    {
      agentId: "document-reader",
      name: agentNames["document-reader"],
      inputSummary: `${selectedScope.selectedPillarId} indicator ${selectedScope.selectedIndicatorId} plus manually imported legal evidence.`,
      outputSummary: "Normalizes manually imported evidence into citation-ready passages.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Confirm parsing quality"
      },
      nextAgent: nextAgent("document-reader")
    },
    {
      agentId: "indicator-mapping",
      name: agentNames["indicator-mapping"],
      inputSummary: "Citation-ready passages plus the user-selected Pillar and indicator.",
      outputSummary: "Tags every retained passage with the user-selected demo scope.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Approve indicator mapping"
      },
      nextAgent: nextAgent("indicator-mapping")
    },
    {
      agentId: "legal-reasoner",
      name: agentNames["legal-reasoner"],
      inputSummary: "Mapped passages, original text lookup, user query, and demo business scenario.",
      outputSummary: "Produces legal conclusions bound to evidence IDs and passage IDs.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Review legal conclusion"
      },
      nextAgent: nextAgent("legal-reasoner")
    },
    {
      agentId: "rebuttal-agent",
      name: agentNames["rebuttal-agent"],
      inputSummary: "Legal findings, cited evidence IDs, source passages, and reviewer status.",
      outputSummary: "Challenges each conclusion and marks whether it is supported, weakly supported, or unsupported by the cited evidence.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Review rebuttal findings"
      },
      nextAgent: nextAgent("rebuttal-agent")
    },
    {
      agentId: "risk-cost-quantifier",
      name: agentNames["risk-cost-quantifier"],
      inputSummary:
        "Legal conclusions for the selected indicator, rebuttal status, uncertainty levels, and review flags.",
      outputSummary: input.riskSummary
        ? `Summarizes risk as ${input.riskSummary.riskLevel}: ${input.riskSummary.riskSummary}`
        : `Summarizes risk as ${input.policyAnalysis
            .map((item) => `${item.country}: ${item.riskLevel}`)
            .join(", ")}.`,
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Review business impact"
      },
      nextAgent: nextAgent("risk-cost-quantifier")
    },
    {
      agentId: "audit-citation",
      name: agentNames["audit-citation"],
      inputSummary: "Risk findings plus evidence lookup with source URLs and citation anchors.",
      outputSummary: "Builds side-by-side audit items linking each AI claim to legal source text.",
      evidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Approve citation chain"
      },
      nextAgent: nextAgent("audit-citation")
    },
    {
      agentId: "legal-review-export",
      name: agentNames["legal-review-export"],
      inputSummary: "Approved audit items, reviewer notes, and risk summary.",
      outputSummary: "Packages JSON, CSV, and Markdown exports from reviewed demo evidence.",
      evidenceIds: approvedEvidenceIds,
      humanReviewGate: {
        required: true,
        reviewerRole: "law-student",
        action: "Confirm export package"
      },
      nextAgent: nextAgent("legal-review-export")
    }
  ];
}

function buildDemoNarrative(input: {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario: string;
}): DemoNarrative {
  return {
    title: `${input.businessScenario} cross-border data transfer review`,
    scenario: `A ${input.businessScenario} team wants to understand whether data can move from ${input.countryA}${
      input.countryB ? ` to ${input.countryB}` : ""
    } while staying inside Pillar 6 scope.`,
    primaryJurisdiction: input.countryA,
    comparisonJurisdiction: input.countryB ?? null,
    walkthrough: [
      "Start in Legal Search Workspace and generate a Search Profile JSON.",
      "Use the nine-agent trace to explain how evidence flows through document reading, mapping, reasoning, rebuttal review, audit, and export.",
      "Open Evidence Audit View to compare original legal text with the AI claim and Pillar 6 mapping.",
      "Let a law student approve, revise, or reject the evidence before exporting the final package."
    ],
    successCriteria: [
      "All mapped evidence uses only the five canonical Pillar 6 indicator codes.",
      "Every legal conclusion can be traced to an evidence ID, source URL, and citation.",
      "The export bundle reflects reviewer status and reviewer notes."
    ]
  };
}

export async function runMultiAgentWorkflow(
  countryA: SupportedCountry,
  countryB?: SupportedCountry | null,
  options?: {
    businessScenario?: string;
    taskType?: LegalTaskType;
    userQuery?: string;
    uploadedDocumentContext?: UploadedDocumentContext | null;
  }
): Promise<WorkflowResult> {
  const businessScenario = options?.businessScenario ?? DEFAULT_DEMO_BUSINESS_SCENARIO;
  const taskType = options?.taskType ?? classifyLegalTaskType(businessScenario);
  const rawUserQuery =
    options?.userQuery ??
    "Find legal evidence describing how cross-border data transfers are permitted, conditioned, or restricted.";
  const uploadedDocumentContext = options?.uploadedDocumentContext ?? null;
  const userQuery = buildUploadedDocumentQuery(rawUserQuery, uploadedDocumentContext);
  const provider = getAnalysisProvider();
  const resolvedEvidence = await resolveEvidenceContext(countryA, countryB);
  const mainlineAgentResults = await runMainlineAgents({
    evidenceRecords: resolvedEvidence.evidenceRecords,
    countryA,
    countryB,
    businessScenario,
    taskType,
    userQuery
  });
  const routedBusinessScenario =
    mainlineAgentResults.intentArbiter.data?.businessScenario ?? businessScenario;
  const firstProfile = await researchAgent(countryA);
  const secondProfile = countryB ? await researchAgent(countryB) : null;

  const research: ResearchAgentResult = {
    profiles: secondProfile ? [firstProfile, secondProfile] : [firstProfile],
    summary: secondProfile
      ? `Research Agent assembled a Pillar 6-aligned policy snapshot for ${countryA} and ${countryB}.`
      : `Research Agent assembled a Pillar 6-aligned policy snapshot for ${countryA}.`,
    sourceBasis: dedupeStrings([...SOURCE_BASIS, ...resolvedEvidence.sourceBasis])
  };

  const policyAnalysis = [
    await policyAnalysisAgent(firstProfile),
    ...(secondProfile ? [await policyAnalysisAgent(secondProfile)] : [])
  ];

  const comparison = countryB ? await comparisonAgent(countryA, countryB) : null;

  const report = await reportAgent({
    research,
    policyAnalysis,
    comparison,
    evidenceRecords: resolvedEvidence.evidenceRecords,
    legalFindings: mainlineAgentResults.legalReasoner.data?.legalFindings ?? [],
    businessScenario: routedBusinessScenario,
    taskType,
    userQuery
  });
  const supportingAgentResults = await runSupportingAgents({
    evidenceRecords: resolvedEvidence.evidenceRecords,
    countryA,
    countryB,
    businessScenario: routedBusinessScenario,
    taskType,
    userQuery,
    mainlineAgentResults,
    comparison
  });

  const workflowResult: WorkflowResult = {
    analysisRunId: null,
    providerId: provider.id,
    providerModel: provider.model,
    evidenceSourceMode: resolvedEvidence.sourceMode,
    evidenceRecords: resolvedEvidence.evidenceRecords,
    input: {
      countryA,
      countryB,
      businessScenario: routedBusinessScenario,
      taskType,
      userQuery: rawUserQuery,
      uploadedDocuments: uploadedDocumentContext?.files.map((file) => ({
        fileName: file.fileName,
        sizeBytes: file.sizeBytes,
        characterCount: file.characterCount
      }))
    },
    research,
    policyAnalysis,
    comparison,
    report,
    mainlineAgentResults,
    supportingAgentResults,
    agentTrace: buildWorkflowAgentTrace({
      evidenceRecords: resolvedEvidence.evidenceRecords,
      countryA,
      countryB,
      businessScenario: routedBusinessScenario,
      taskType,
      userQuery,
      policyAnalysis,
      riskSummary: supportingAgentResults.riskCostQuantifier.data?.riskSummary ?? null
    }),
    demoNarrative: buildDemoNarrative({
      countryA,
      countryB,
      businessScenario: routedBusinessScenario
    }),
    generatedAt: new Date().toISOString()
  };

  if (isPiplArticle38DemoQuery({ userQuery: rawUserQuery, taskType })) {
    return applyPiplArticle38DemoOverride(workflowResult);
  }

  if (isShopPilotCaseDemoQuery({ userQuery: rawUserQuery, taskType })) {
    return applyShopPilotCaseDemoOverride(workflowResult);
  }

  if (isSingaporeAiAdvisoryDemoQuery({ userQuery: rawUserQuery, taskType })) {
    return applySingaporeAiAdvisoryDemoOverride(workflowResult);
  }

  return workflowResult;
}

export async function applyReviewUpdateToWorkflowResult(
  workflowResult: WorkflowResult,
  reviewUpdate: {
    evidenceId: string;
    reviewStatus: EvidenceRecord["reviewStatus"];
    reviewerNote: string;
  }
): Promise<WorkflowResult> {
  const nextEvidenceRecords = workflowResult.evidenceRecords.map((record) =>
    record.evidenceId === reviewUpdate.evidenceId
      ? {
          ...record,
          reviewStatus: reviewUpdate.reviewStatus,
          reviewerNote: reviewUpdate.reviewerNote
        }
      : record
  );

  const nextMainlineAgentResults = {
    ...workflowResult.mainlineAgentResults
  };
  const nextSupportingAgentResults = await runSupportingAgents({
    evidenceRecords: nextEvidenceRecords,
    countryA: workflowResult.input.countryA,
    countryB: workflowResult.input.countryB,
    businessScenario: workflowResult.input.businessScenario,
    userQuery: workflowResult.input.userQuery,
    mainlineAgentResults: nextMainlineAgentResults,
    comparison: workflowResult.comparison
  });

  return {
    ...workflowResult,
    evidenceRecords: nextEvidenceRecords,
    supportingAgentResults: nextSupportingAgentResults,
    agentTrace: buildWorkflowAgentTrace({
      evidenceRecords: nextEvidenceRecords,
      countryA: workflowResult.input.countryA,
      countryB: workflowResult.input.countryB,
      businessScenario: workflowResult.input.businessScenario,
      taskType: workflowResult.input.taskType,
      userQuery: workflowResult.input.userQuery,
      policyAnalysis: workflowResult.policyAnalysis,
      riskSummary: nextSupportingAgentResults.riskCostQuantifier.data?.riskSummary ?? null
    })
  };
}
