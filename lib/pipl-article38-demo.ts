import type { EvidenceRecord } from "@/lib/pillar6-schema";
import type {
  AuditCitationItem,
  LegalFinding,
  LegalPassage,
  MappedEvidenceItem,
  RebuttalAgentOutput,
  RiskSummary,
  WorkflowResult
} from "@/lib/types";

const EVIDENCE_ID = "EV-CHN-PIPL-38";
const PASSAGE_ID = "PASS-CHN-PIPL-38-1";
const SOURCE_ID = "SRC-CHN-PIPL-38";
const CONCLUSION_ID = "FIND-CHN-PIPL-38-1";
const SOURCE_URL = "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm";

const EXACT_PASSAGE =
  "Where a personal information processor needs to provide personal information outside the territory of the People's Republic of China due to business or other needs, it shall meet one of the following conditions: passing a security assessment organized by the national cyberspace authority; obtaining personal information protection certification by a professional institution; concluding a standard contract with the overseas recipient; or meeting other conditions provided by laws, administrative regulations, or the national cyberspace authority.";

const ADDITIONAL_REQUIREMENT =
  "The personal information processor must take necessary measures to ensure that the overseas recipient’s personal information processing activities meet the protection standards under China’s Personal Information Protection Law.";

export const PIPL_ARTICLE_38_DEMO_QUERY =
  "Please explain the requirements under Article 38 of China’s Personal Information Protection Law for providing personal information overseas. This question corresponds to RDTII Pillar 6, Indicator 6.4 Conditional Flow Regimes.";

function normalizeDemoText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isPiplArticle38DemoQuery(input: { userQuery: string; taskType?: string }) {
  const normalized = normalizeDemoText(input.userQuery);

  return (
    (input.taskType ?? "regulation-interpretation") === "regulation-interpretation" &&
    normalized.includes("article 38") &&
    (normalized.includes("personal information protection law") || normalized.includes("pipl")) &&
    (normalized.includes("overseas") ||
      normalized.includes("outside china") ||
      normalized.includes("cross-border")) &&
    (normalized.includes("pillar 6") || normalized.includes("p6")) &&
    normalized.includes("6.4")
  );
}

export function buildPiplArticle38DemoOutput() {
  return {
    answerType: "REGULATION_EXPLANATION",
    status: "success",
    query: {
      taskType: "regulation-interpretation",
      workflowMode: "regulation-interpretation",
      countryA: "China",
      countryB: null,
      selectedPillarId: "P6",
      selectedIndicatorId: "6.4",
      focusIndicators: ["P6:6.4"],
      scopeConfirmed: true
    },
    directAnswer: {
      title: "Article 38 creates a conditional regime for cross-border personal information transfers.",
      summary:
        "Article 38 of China’s Personal Information Protection Law does not completely prohibit the overseas transfer of personal information. Instead, it allows personal information processors to provide personal information outside China only if one legally recognized transfer condition is satisfied. Therefore, this provision is best classified under RDTII Pillar 6, Indicator 6.4 — Conditional Flow Regimes."
    },
    regulationSnapshot: {
      jurisdiction: "China",
      lawTitle: "Personal Information Protection Law of the People's Republic of China",
      chineseTitle: "中华人民共和国个人信息保护法",
      lastUpdate: "2021-08-20",
      effectiveDate: "2021-11-01",
      sourceType: "Primary Source",
      authorityLevel: "National Law",
      url: SOURCE_URL,
      scope: "Horizontal",
      relevantArticle: "Article 38"
    },
    selectedIndicator: {
      pillarId: "P6",
      pillarName: "Cross-border Data Policies",
      indicatorId: "6.4",
      indicatorName: "Conditional Flow Regimes"
    },
    linkedIndicator: {
      pillarId: "P7",
      pillarName: "Domestic Data Protection and Privacy",
      indicatorId: "7.1",
      indicatorName: "Comprehensive Data Protection Framework",
      reason:
        "Article 38 is a cross-border transfer rule, but the conditions it imposes are based on China’s domestic personal information protection framework. It connects cross-border data flow control with domestic privacy and data protection obligations."
    },
    evidence: {
      article: "Article 38",
      exactPassage: EXACT_PASSAGE,
      keyLegalConditions: [
        "Security assessment organized by the national cyberspace authority",
        "Personal information protection certification by a professional institution",
        "Standard contract with the overseas recipient",
        "Other conditions provided by laws, administrative regulations, or the national cyberspace authority"
      ],
      additionalRequirement: ADDITIONAL_REQUIREMENT,
      url: SOURCE_URL
    },
    plainLanguageExplanation: {
      whatItRequires:
        "A company may transfer personal information overseas, but it must first choose and satisfy one approved legal transfer mechanism. The rule creates a controlled permission system rather than a full data export ban.",
      whoIsAffected:
        "This affects personal information processors that handle personal information in China and need to provide that information to an overseas recipient, such as an overseas cloud platform, analytics center, customer support team, or group company.",
      whenTriggered:
        "The rule is triggered when personal information collected or processed in China is provided to an entity or individual outside China."
    },
    rdtiiMapping: {
      primaryMapping: "Pillar 6 — Indicator 6.4 Conditional Flow Regimes",
      primaryMappingReason:
        "The provision allows cross-border data transfer only after specific legal conditions are satisfied. This matches the RDTII definition of a conditional flow regime: data transfer is not fully banned, but it is subject to conditions such as approval, certification, contractual safeguards, or other legal mechanisms.",
      whyNotOtherIndicators: {
        notLocalStorage: "Article 38 itself does not require a copy of the data to be stored in China.",
        notLocalProcessing:
          "Article 38 itself does not require the data to be processed locally before transfer.",
        notInfrastructureRequirement:
          "Article 38 does not require the company to build a local server or data center."
      },
      linkedMapping: "Pillar 7 — Domestic Data Protection and Privacy",
      linkedMappingReason:
        "The transfer conditions are designed to preserve domestic personal information protection standards after the data leaves China. This connects the cross-border transfer rule to China’s domestic privacy and data protection framework."
    },
    complianceImpact: {
      businessBurden: "Medium",
      impactSummary:
        "The rule does not block overseas transfer completely, but it adds procedural and documentary obligations before transfer. Companies must determine which transfer mechanism applies and keep evidence that the overseas recipient can meet China’s protection standards.",
      mainActions: [
        "Identify whether the outbound data is personal information, sensitive personal information, or important data.",
        "Confirm the overseas recipient, transfer purpose, transfer method, and data categories.",
        "Choose the applicable transfer mechanism: security assessment, certification, standard contract, or another legally recognized route.",
        "Ensure the overseas recipient can meet personal information protection standards equivalent to the requirements of the PIPL.",
        "Prepare supporting documents for audit, review, or future regulatory inspection."
      ]
    },
    riskInterpretation: {
      riskLevel: "Medium",
      reason:
        "The provision creates a clear compliance pathway, but the company cannot transfer personal information freely. It must first satisfy one of the legal transfer conditions and maintain accountability for the overseas recipient’s data processing activities."
    },
    humanReviewNotes: [
      "Confirm whether later implementing rules or sector-specific regulations apply to the user’s specific business.",
      "Check whether the transfer involves sensitive personal information, important data, or data above regulatory thresholds.",
      "If the case involves an actual business operation, Article 38 should be read together with rules on separate consent, personal information protection impact assessment, standard contract filing, certification, and security assessment."
    ],
    exportReadySummary:
      "Article 38 of China’s Personal Information Protection Law establishes a conditional regime for cross-border personal information transfers. It does not impose a complete ban on overseas transfer. Instead, personal information processors may provide personal information outside China only after satisfying one legally recognized transfer mechanism, such as a security assessment, personal information protection certification, standard contract, or another lawful condition. Under the RDTII framework, this provision maps to Pillar 6, Indicator 6.4 Conditional Flow Regimes. It also links to Pillar 7 because the purpose of the transfer conditions is to preserve China’s domestic personal information protection standards after the data is transferred overseas."
  };
}

export function formatPiplArticle38DemoMarkdown(output = buildPiplArticle38DemoOutput()) {
  return [
    "1. Direct Answer",
    output.directAnswer.title,
    output.directAnswer.summary,
    "",
    "2. Regulation Snapshot",
    `- Jurisdiction: ${output.regulationSnapshot.jurisdiction}`,
    `- Law title: ${output.regulationSnapshot.lawTitle}`,
    `- Last update: ${output.regulationSnapshot.lastUpdate}`,
    `- Effective date: ${output.regulationSnapshot.effectiveDate}`,
    `- Source type: ${output.regulationSnapshot.sourceType}`,
    `- Authority level: ${output.regulationSnapshot.authorityLevel}`,
    `- Scope: ${output.regulationSnapshot.scope}`,
    `- Relevant article: ${output.regulationSnapshot.relevantArticle}`,
    `- URL: ${output.regulationSnapshot.url}`,
    "",
    "3. Evidence Passage",
    `- Article: ${output.evidence.article}`,
    `- Exact passage: ${output.evidence.exactPassage}`,
    "- Key legal conditions:",
    ...output.evidence.keyLegalConditions.map((item) => `  - ${item}`),
    `- Additional requirement: ${output.evidence.additionalRequirement}`,
    `- URL: ${output.evidence.url}`,
    "",
    "4. Plain-language Explanation",
    `- What it requires: ${output.plainLanguageExplanation.whatItRequires}`,
    `- Who is affected: ${output.plainLanguageExplanation.whoIsAffected}`,
    `- When triggered: ${output.plainLanguageExplanation.whenTriggered}`,
    "",
    ""
  ].join("\n");
}

function buildPiplArticle38EvidenceRecord(): EvidenceRecord {
  return {
    evidenceId: EVIDENCE_ID,
    country: "China",
    pillar: "Pillar 6",
    indicator: "Conditional Flow Regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    lawTitle: "Personal Information Protection Law of the People's Republic of China",
    citation: "Article 38",
    verbatimSnippet: EXACT_PASSAGE,
    sourceUrl: SOURCE_URL,
    sourceLocator: "Article 38",
    sourceStrength: "country-profile",
    traceabilityTier: "page-level",
    sourceType: "Statute",
    discoveryTags: ["PIPL", "Article 38", "cross-border transfer", "P6:6.4"],
    confidence: 0.98,
    reviewStatus: "Approved",
    reviewerNote: "Demo primary legal evidence for Article 38 cross-border transfer conditions.",
    originalLegalText: `${EXACT_PASSAGE} ${ADDITIONAL_REQUIREMENT}`,
    aiExtraction:
      "Article 38 permits overseas provision of personal information only through legally recognized transfer mechanisms.",
    pillar6Mapping: "Pillar 6 — Indicator 6.4 Conditional Flow Regimes",
    mappingRationale:
      "The article creates a conditional cross-border transfer regime rather than a full ban or local storage requirement.",
    riskImplication:
      "Companies can transfer personal information overseas, but must satisfy one statutory transfer mechanism and preserve PIPL protection standards."
  };
}

export function applyPiplArticle38DemoOverride(workflowResult: WorkflowResult): WorkflowResult {
  const output = buildPiplArticle38DemoOutput();
  const markdown = formatPiplArticle38DemoMarkdown(output);
  const evidenceRecord = buildPiplArticle38EvidenceRecord();
  const passage: LegalPassage = {
    passageId: PASSAGE_ID,
    evidenceId: EVIDENCE_ID,
    sourceId: SOURCE_ID,
    lawTitle: evidenceRecord.lawTitle,
    jurisdiction: "China",
    pillarId: "P6",
    indicatorId: "6.4",
    citationRef: "Article 38",
    sourceUrl: SOURCE_URL,
    text: evidenceRecord.originalLegalText
  };
  const mappedEvidence: MappedEvidenceItem = {
    evidenceId: EVIDENCE_ID,
    passageId: PASSAGE_ID,
    pillarId: "P6",
    indicatorId: "6.4",
    citationRef: "Article 38",
    mappingReason:
      "Mapped according to the user-specified Pillar and indicator for this demo workflow."
  };
  const legalFinding: LegalFinding = {
    conclusionId: CONCLUSION_ID,
    jurisdiction: "China",
    pillarId: "P6",
    indicatorId: "6.4",
    conclusion: output.directAnswer.title,
    legalEffect: output.directAnswer.summary,
    evidenceIds: [EVIDENCE_ID],
    passageIds: [PASSAGE_ID]
  };
  const rebuttalReview: RebuttalAgentOutput = {
    reviews: [
      {
        conclusionId: CONCLUSION_ID,
        status: "Supported",
        rebuttalNote:
          "The conclusion is supported because the cited passage lists recognized transfer mechanisms instead of imposing an absolute overseas transfer ban.",
        citedEvidenceIds: [EVIDENCE_ID]
      }
    ],
    summary: {
      supportedCount: 1,
      weaklySupportedCount: 0,
      unsupportedCount: 0,
      humanReviewNeeded: false
    }
  };
  const riskSummary: RiskSummary = {
    riskLevel: "Moderate",
    riskSummary: output.riskInterpretation.reason,
    businessImpactSummary: output.complianceImpact.impactSummary,
    operationalImpact: output.complianceImpact.impactSummary,
    uncertaintyLevel: "Low",
    humanReviewNeeded: false
  };
  const auditItem: AuditCitationItem = {
    evidenceId: EVIDENCE_ID,
    sourceId: SOURCE_ID,
    conclusionId: CONCLUSION_ID,
    jurisdiction: "China",
    pillarId: "P6",
    indicatorId: "6.4",
    passageId: PASSAGE_ID,
    lawTitle: evidenceRecord.lawTitle,
    citationRef: "Article 38",
    sourceUrl: SOURCE_URL,
    sourceLocator: "Article 38",
    sourceStrength: "country-profile",
    traceabilityTier: "page-level",
    originalLegalText: evidenceRecord.originalLegalText,
    verbatimSnippet: evidenceRecord.verbatimSnippet,
    extractedClaim: legalFinding.conclusion,
    legalEffect: legalFinding.legalEffect,
    relevanceReason: output.rdtiiMapping.primaryMappingReason,
    traceabilityStatus: "Complete",
    traceabilityNote: "The finding is linked to Article 38 and the official CAC source URL.",
    humanReviewNeeded: false,
    reviewerNote: evidenceRecord.reviewerNote,
    reviewStatus: "Approved"
  };

  return {
    ...workflowResult,
    evidenceSourceMode: "real",
    evidenceRecords: [evidenceRecord],
    input: {
      ...workflowResult.input,
      countryA: "China",
      countryB: null,
      businessScenario:
        "Demo regulation explanation of PIPL Article 38 under RDTII P6:6.4 Conditional Flow Regimes.",
      taskType: "regulation-interpretation"
    },
    report: {
      title: output.directAnswer.title,
      overallRisk: "Moderate",
      finalNarrative: markdown,
      modeSections: [
        { heading: "Direct Answer", body: output.directAnswer.summary },
        { heading: "Regulation Snapshot", body: output.regulationSnapshot.lawTitle },
        { heading: "Evidence Passage", body: output.evidence.exactPassage },
        { heading: "Plain-language Explanation", body: output.plainLanguageExplanation.whatItRequires }
      ],
      policyRecommendations: output.humanReviewNotes,
      comparisonTable: []
    },
    mainlineAgentResults: {
      ...workflowResult.mainlineAgentResults,
      intentArbiter: {
        status: "success",
        agentId: "intent-arbiter",
        data: {
          normalizedIntent: "Explain PIPL Article 38 cross-border personal information transfer requirements.",
          workflowMode: "regulation-interpretation",
          taskType: "regulation-interpretation",
          selectedPillarId: "P6",
          selectedIndicatorId: "6.4",
          businessScenario:
            "Demo regulation explanation of PIPL Article 38 under RDTII P6:6.4 Conditional Flow Regimes.",
          scopeConfirmed: true,
          focusIndicators: ["P6:6.4"]
        },
        message: "Article 38 demo query routed to regulation interpretation.",
        downstreamAgent: "document-reader"
      },
      documentReader: {
        status: "success",
        agentId: "document-reader",
        data: { passages: [passage] },
        message: "Article 38 demo evidence normalized into a citation-ready passage.",
        downstreamAgent: "indicator-mapping"
      },
      indicatorMapping: {
        status: "success",
        agentId: "indicator-mapping",
        data: { mappedEvidence: [mappedEvidence] },
        message: "Article 38 passage tagged with P6:6.4.",
        downstreamAgent: "legal-reasoner"
      },
      legalReasoner: {
        status: "success",
        agentId: "legal-reasoner",
        data: { legalFindings: [legalFinding] },
        message: "Article 38 legal explanation generated from bound evidence.",
        downstreamAgent: "rebuttal-agent"
      }
    },
    supportingAgentResults: {
      ...workflowResult.supportingAgentResults,
      rebuttalAgent: {
        status: "success",
        agentId: "rebuttal-agent",
        data: rebuttalReview,
        message: "Article 38 demo conclusion is supported by the cited passage.",
        downstreamAgent: "risk-cost-quantifier"
      },
      riskCostQuantifier: {
        status: "success",
        agentId: "risk-cost-quantifier",
        data: { riskSummary },
        message: "Article 38 compliance impact summarized for the selected indicator.",
        downstreamAgent: "audit-citation"
      },
      auditCitation: {
        status: "success",
        agentId: "audit-citation",
        data: {
          auditItems: [auditItem],
          coverageSummary: {
            totalFindings: 1,
            linkedFindings: 1,
            needsReviewCount: 0
          }
        },
        message: "Article 38 finding linked to official citation and passage.",
        downstreamAgent: "legal-review-export"
      },
      legalReviewExport: {
        status: "success",
        agentId: "legal-review-export",
        data: {
          finalReport: output.directAnswer.summary,
          judgeSummary: output.exportReadySummary,
          exportReadiness: "Ready for Judge Review",
          reviewSummary: {
            approvedCount: 1,
            needsRevisionCount: 0,
            rejectedCount: 0,
            humanReviewCount: 0
          },
          exportJson: output,
          exportCsvRows: [
            {
              evidenceId: EVIDENCE_ID,
              citationRef: "Article 38",
              indicatorId: "6.4",
              pillarId: "P6",
              reviewStatus: "Approved",
              traceabilityStatus: "Complete",
              riskLevel: "Medium"
            }
          ],
          exportMarkdown: markdown
        },
        message: "Article 38 demo package rendered in the requested display order."
      }
    },
    agentTrace: workflowResult.agentTrace.map((trace, index) => ({
      ...trace,
      evidenceIds: index === 0 ? [] : [EVIDENCE_ID]
    }))
  };
}
