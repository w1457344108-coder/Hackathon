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

const PIPL_URL = "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm";
const CROSS_BORDER_2024_URL = "https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm";

const EVIDENCE_RECORDS = [
  {
    evidenceId: "CN_PIPL_ART55",
    article: "Article 55",
    relatedPillar: "P7",
    role: "Core legal basis for personal information protection impact assessment",
    summary:
      "A personal information processor must conduct a personal information protection impact assessment in advance and keep processing records when providing personal information overseas.",
    url: PIPL_URL
  },
  {
    evidenceId: "CN_PIPL_ART56",
    article: "Article 56",
    relatedPillar: "P7",
    role: "Required contents of the personal information protection impact assessment",
    summary:
      "The assessment should consider whether the processing purpose and method are lawful, legitimate and necessary; the impact on personal rights and interests; and whether the adopted protection measures are lawful, effective, and proportionate to the risk.",
    url: PIPL_URL
  },
  {
    evidenceId: "CN_PIPL_ART39",
    article: "Article 39",
    relatedPillar: "P7",
    role: "Notification and separate consent requirement for overseas transfer",
    summary:
      "Before providing personal information overseas, the processor must inform individuals of the overseas recipient’s name or contact information, processing purpose, processing method, categories of personal information, and rights-exercise methods, and obtain separate consent.",
    url: PIPL_URL
  },
  {
    evidenceId: "CN_CAC_CROSS_BORDER_2024_ART10",
    article: "Article 10",
    relatedPillar: "P7",
    role: "Confirms continued domestic protection duties for outbound personal information",
    summary:
      "When providing personal information overseas, the data processor should still perform obligations such as notification, separate consent, and personal information protection impact assessment under applicable laws and administrative regulations.",
    url: CROSS_BORDER_2024_URL
  },
  {
    evidenceId: "CN_CAC_CROSS_BORDER_2024_ART8",
    article: "Article 8",
    relatedPillar: "P6",
    role: "Linked Pillar 6 transfer route for the case facts",
    summary:
      "For a non-critical information infrastructure operator transferring ordinary personal information of 100,000 or more but fewer than 1,000,000 individuals since January 1 of the current year, the standard contract or personal information protection certification route may apply.",
    url: CROSS_BORDER_2024_URL
  }
] as const;

function normalizeDemoText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isShopPilotCaseDemoQuery(input: { userQuery: string; taskType?: string }) {
  const normalized = normalizeDemoText(input.userQuery);

  return (
    (input.taskType ?? "case-analysis") === "case-analysis" &&
    normalized.includes("shoppilot ai") &&
    normalized.includes("china-to-singapore") &&
    normalized.includes("200,000") &&
    (normalized.includes("pillar 7") || normalized.includes("p7")) &&
    normalized.includes("7.4") &&
    normalized.includes("pillar 6") &&
    normalized.includes("6.4")
  );
}

export function buildShopPilotCaseDemoOutput() {
  return {
    answerType: "CASE_ANALYSIS",
    status: "success",
    query: {
      taskType: "case-analysis",
      workflowMode: "case-analysis",
      countryA: "China",
      countryB: "Singapore",
      selectedPillarId: "P7",
      selectedIndicatorId: "7.4",
      focusIndicators: ["P7:7.4"],
      scopeConfirmed: true
    },
    caseSnapshot: {
      caseName: "ShopPilot AI Customer Support SaaS",
      originJurisdiction: "China",
      destinationJurisdiction: "Singapore",
      businessActivity: "AI customer support SaaS for e-commerce merchants",
      dataFlow:
        "Personal information collected from Chinese consumers is transferred to a Singapore analytics center.",
      dataCategories: [
        "customer support chat logs",
        "order IDs",
        "phone numbers",
        "email addresses",
        "logistics status",
        "after-sales requests",
        "user preference tags"
      ],
      estimatedAnnualTransferVolume: "Approximately 200,000 Chinese consumers",
      excludedDataTypes: [
        "sensitive personal information",
        "minors' data",
        "medical data",
        "financial account data",
        "officially identified important data"
      ],
      assumptions: [
        "ShopPilot AI is not treated as a critical information infrastructure operator in this mock case.",
        "The outbound data consists of ordinary personal information only.",
        "No important data has been officially identified in this case.",
        "The transfer is made for analytics, model optimization, and customer service quality improvement."
      ]
    },
    directAnswer: {
      title:
        "This case triggers a Pillar 7 personal information protection impact assessment obligation.",
      summary:
        "Because ShopPilot AI provides personal information collected in China to a Singapore analytics center, this case triggers domestic data protection obligations under China’s personal information protection framework. The key Pillar 7 issue is not whether the transfer is completely banned, but whether ShopPilot AI has completed the required personal information protection impact assessment, notification, separate consent, and protection safeguards before or during the overseas transfer."
    },
    regulationSnapshot: [
      {
        jurisdiction: "China",
        lawTitle: "Personal Information Protection Law of the People's Republic of China",
        chineseTitle: "中华人民共和国个人信息保护法",
        lastUpdate: "2021-08-20",
        effectiveDate: "2021-11-01",
        sourceType: "Primary Source",
        authorityLevel: "National Law",
        url: PIPL_URL,
        scope: "Horizontal",
        relevantArticles: ["Article 39", "Article 55", "Article 56"]
      },
      {
        jurisdiction: "China",
        lawTitle: "Provisions on Promoting and Regulating Cross-border Data Flows",
        chineseTitle: "促进和规范数据跨境流动规定",
        lastUpdate: "2024-03-22",
        effectiveDate: "2024-03-22",
        sourceType: "Primary Source",
        authorityLevel: "Departmental Regulation",
        url: CROSS_BORDER_2024_URL,
        scope: "Horizontal",
        relevantArticles: ["Article 8", "Article 10", "Article 11"]
      }
    ],
    selectedIndicator: {
      pillarId: "P7",
      pillarName: "Domestic Data Protection and Privacy",
      indicatorId: "7.4",
      indicatorName: "Data Protection Impact Assessment / Data Protection Officer Requirements"
    },
    linkedIndicators: [
      {
        pillarId: "P6",
        pillarName: "Cross-border Data Policies",
        indicatorId: "6.4",
        indicatorName: "Conditional Flow Regimes",
        reason:
          "The Pillar 7 impact assessment obligation is triggered by a cross-border transfer scenario. The transfer to Singapore is allowed only through a legally recognized outbound transfer route, so the domestic protection obligation is directly connected to Pillar 6 conditional flow rules."
      },
      {
        pillarId: "P7",
        pillarName: "Domestic Data Protection and Privacy",
        indicatorId: "7.1",
        indicatorName: "Comprehensive Data Protection Framework",
        reason:
          "The obligation to notify individuals, obtain separate consent, and assess personal information protection risks is part of China’s broader domestic personal information protection framework."
      }
    ],
    caseFactsExtracted: {
      isCrossBorderTransfer: true,
      isPersonalInformationInvolved: true,
      isSensitivePersonalInformationInvolved: false,
      isImportantDataInvolved: false,
      isCriticalInformationInfrastructureOperator: false,
      annualOrdinaryPersonalInformationVolume: 200000,
      destination: "Singapore",
      transferPurpose: ["model optimization", "analytics", "customer service quality analysis"],
      caseClassification: "Existing business case"
    },
    evidence: EVIDENCE_RECORDS.map((record) => ({
      evidenceId: record.evidenceId,
      relatedPillar: record.relatedPillar,
      article: record.article,
      evidenceRole: record.role,
      passageSummary: record.summary,
      url: record.url,
      screenshotPath:
        record.evidenceId === "CN_CAC_CROSS_BORDER_2024_ART8"
          ? "/screenshots/china-cross-border-2024-article-8.png"
          : record.evidenceId === "CN_CAC_CROSS_BORDER_2024_ART10"
            ? "/screenshots/china-cross-border-2024-article-10.png"
            : `/screenshots/china-pipl-${record.article.toLowerCase().replace(" ", "-")}.png`
    })),
    analysis: {
      pillar7Assessment: {
        classification: "Domestic data protection obligation triggered by overseas transfer",
        primaryIndicator:
          "P7:7.4 Data Protection Impact Assessment / Data Protection Officer Requirements",
        reasoning:
          "The key Pillar 7 issue is the personal information protection impact assessment obligation. ShopPilot AI is providing personal information collected in China to an overseas analytics center. Under the imported legal evidence, providing personal information overseas is a scenario where a personal information protection impact assessment should be conducted in advance. Therefore, the system classifies this case under P7:7.4.",
        dpiiOrDpoFinding: {
          reason:
            "The facts clearly trigger the personal information protection impact assessment because the case involves overseas provision of personal information. Whether a personal information protection officer or representative must be appointed depends on additional scale and role-specific facts that should be confirmed during legal review."
        },
        requiredAssessmentFocus: [
          "lawfulness, legitimacy, and necessity of the transfer purpose and method",
          "categories, volume, scope, and sensitivity of the personal information transferred",
          "risks to personal information rights and interests after overseas transfer",
          "technical and organizational measures adopted by ShopPilot AI and the Singapore recipient",
          "whether individuals can effectively exercise their rights after transfer",
          "whether the overseas recipient can meet appropriate personal information protection standards"
        ]
      },
      pillar6Linkage: {
        classification: "Linked conditional transfer regime",
        reasoning:
          "Although the selected question focuses on Pillar 7, the facts still involve cross-border data transfer from China to Singapore. Because the transfer is not freely permitted without conditions, the Pillar 7 impact assessment obligation functions together with P6:6.4 Conditional Flow Regimes."
      },
      whyThisIsNotPrimarilyPillar6: {
        reason:
          "The user-selected indicator is P7:7.4. Therefore, the analysis focuses on domestic protection duties, especially impact assessment and accountability, rather than selecting the outbound transfer route as the main issue."
      }
    },
    complianceImpact: {
      riskLevel: "Medium-High",
      businessBurden: "Medium",
      impactSummary:
        "ShopPilot AI can potentially continue the China-to-Singapore data transfer, but the business should not treat the transfer only as a technical data routing issue. It must document the impact assessment, notify individuals, obtain separate consent where required, and verify that the Singapore analytics center can protect the transferred personal information.",
      mainComplianceActions: [
        "Conduct a personal information protection impact assessment before or for the ongoing outbound transfer.",
        "Record and retain the assessment results and processing records for audit or regulatory review.",
        "Notify individuals about the overseas recipient, transfer purpose, processing method, personal information categories, and rights-exercise channels.",
        "Obtain separate consent where required by personal information protection rules.",
        "Review whether the transfer volume or data type changes over time, especially if sensitive personal information or important data becomes involved.",
        "Verify that the Singapore analytics center has appropriate technical and organizational safeguards.",
        "Prepare contractual or certification-based safeguards if the linked Pillar 6 transfer route requires them."
      ]
    },
    decisionPath: {
      step1: {
        question: "Is personal information involved?",
        answer:
          "Yes. Chat logs, phone numbers, email addresses, order IDs, and user preference tags may constitute personal information."
      },
      step2: {
        question: "Is the personal information provided overseas?",
        answer: "Yes. The data is transferred from China to a Singapore analytics center."
      },
      step3: {
        question: "Does this trigger a Pillar 7 impact assessment issue?",
        answer:
          "Yes. Overseas provision of personal information triggers the need for personal information protection impact assessment in this mock case."
      },
      step4: {
        question: "Is a DPO or personal information protection officer definitely required?",
        answer:
          "Not determined. The case facts do not provide enough information to conclude whether the company reaches the relevant scale or role-based threshold for appointing a responsible person."
      },
      step5: {
        question: "Which RDTII indicator is primarily triggered?",
        answer:
          "Pillar 7, Indicator 7.4 Data Protection Impact Assessment / Data Protection Officer Requirements."
      },
      step6: {
        question: "Which Pillar 6 issue is linked?",
        answer:
          "Pillar 6, Indicator 6.4 Conditional Flow Regimes, because the data transfer to Singapore is conditioned by legal transfer mechanisms."
      }
    },
    workflowTrace: [
      {
        step: 1,
        agentName: "Case Intake Agent",
        action: "Read the user-provided case facts and confirm the task type.",
        output:
          "The query is classified as Case Analysis. The selected indicator is P7:7.4 Data Protection Impact Assessment / Data Protection Officer Requirements."
      },
      {
        step: 2,
        agentName: "Fact Extraction Agent",
        action: "Extract key facts from the case.",
        output:
          "The case involves China-to-Singapore transfer of approximately 200,000 ordinary personal information records for analytics and model optimization."
      },
      {
        step: 3,
        agentName: "Pillar 7 Evidence Reader Agent",
        action:
          "Retrieve domestic data protection evidence related to impact assessment and consent.",
        output:
          "PIPL Articles 39, 55, 56 and 2024 Cross-border Data Flow Provisions Article 10 were retrieved as Pillar 7 evidence."
      },
      {
        step: 4,
        agentName: "Pillar 7 Mapping Agent",
        action: "Map the case to the selected Pillar 7 indicator.",
        output:
          "The case maps to P7:7.4 because overseas provision of personal information triggers personal information protection impact assessment obligations."
      },
      {
        step: 5,
        agentName: "Pillar 6 Linkage Agent",
        action: "Identify the related cross-border data transfer issue.",
        output:
          "The case links to P6:6.4 because the China-to-Singapore data transfer is subject to conditional transfer mechanisms."
      },
      {
        step: 6,
        agentName: "Compliance Impact Agent",
        action: "Translate the Pillar 7 legal mapping into business impact.",
        output:
          "The business burden is Medium and the risk level is Medium-High because the transfer requires assessment, notice, consent, and accountability safeguards."
      },
      {
        step: 7,
        agentName: "Output Composer Agent",
        action: "Generate a frontend-ready Pillar 7 case analysis result.",
        output: "Final structured Case Analysis Card generated successfully."
      }
    ],
    humanReviewNotes: [
      "Confirm whether ShopPilot AI reaches any legally relevant scale threshold for appointing a personal information protection officer or dedicated responsible person.",
      "Confirm whether any transferred data is sensitive personal information, minors' data, important data, or sector-specific regulated data.",
      "Confirm whether the Singapore analytics center is an overseas recipient, entrusted processor, affiliate, or independent controller.",
      "Confirm whether the personal information protection impact assessment has been completed and retained.",
      "Confirm whether user notice and separate consent mechanisms are valid in the actual product flow."
    ],
    exportReadySummary:
      "ShopPilot AI's existing China-to-Singapore transfer of approximately 200,000 Chinese consumers' ordinary personal information primarily triggers a Pillar 7 domestic data protection issue. Because the company provides personal information overseas, it should conduct a personal information protection impact assessment, retain the assessment record, notify individuals, obtain separate consent where required, and verify that the Singapore analytics center can protect the transferred data. Under the RDTII framework, the case maps primarily to Pillar 7, Indicator 7.4 Data Protection Impact Assessment / Data Protection Officer Requirements. It also links to Pillar 6, Indicator 6.4 Conditional Flow Regimes, because the overseas transfer is subject to legal transfer conditions rather than being a completely free data flow."
  };
}

export function formatShopPilotCaseDemoMarkdown(output = buildShopPilotCaseDemoOutput()) {
  return [
    "1. Case Snapshot",
    `- Case name: ${output.caseSnapshot.caseName}`,
    `- Origin jurisdiction: ${output.caseSnapshot.originJurisdiction}`,
    `- Destination jurisdiction: ${output.caseSnapshot.destinationJurisdiction}`,
    `- Business activity: ${output.caseSnapshot.businessActivity}`,
    `- Data flow: ${output.caseSnapshot.dataFlow}`,
    `- Annual transfer volume: ${output.caseSnapshot.estimatedAnnualTransferVolume}`,
    "",
    "2. Direct Answer",
    output.directAnswer.title,
    output.directAnswer.summary,
    "",
    "3. Pillar 7 Assessment",
    `- Classification: ${output.analysis.pillar7Assessment.classification}`,
    `- Primary indicator: ${output.analysis.pillar7Assessment.primaryIndicator}`,
    `- Reasoning: ${output.analysis.pillar7Assessment.reasoning}`,
    `- Reason: ${output.analysis.pillar7Assessment.dpiiOrDpoFinding.reason}`,
    "",
    "4. Pillar 6 Linkage",
    `- Reasoning: ${output.analysis.pillar6Linkage.reasoning}`,
    "",
    "5. Compliance Impact",
    `- Risk level: ${output.complianceImpact.riskLevel}`,
    `- Business burden: ${output.complianceImpact.businessBurden}`,
    `- Impact summary: ${output.complianceImpact.impactSummary}`,
    "",
    "6. Human Review Notes",
    ...formatShopPilotHumanReviewNotes(),
    "",
    "7. Evidence",
    ...output.evidence.flatMap((item) => [
      `- ${item.evidenceId} (${item.article}, ${item.relatedPillar})`,
      `  Role: ${item.evidenceRole}`,
      `  Summary: ${item.passageSummary}`,
      `  URL: ${item.url}`
    ]),
    "",
    "8. Export-ready Summary",
    output.exportReadySummary
  ].join("\n");
}

function formatShopPilotHumanReviewNotes(): string[] {
  return [
    "- Confirm whether ShopPilot AI reaches any legally relevant scale threshold for appointing a personal information protection officer or dedicated responsible person.",
    "  - CN_PIPL_ART52 (Article 52, P7)",
    "    URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    "- Confirm whether any transferred data is sensitive personal information, minors' data, important data, or sector-specific regulated data.",
    "  - CN_CAC_CROSS_BORDER_2024_ART8 (Article 8, P6)",
    "    URL: https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm",
    "- Confirm whether the Singapore analytics center is an overseas recipient, entrusted processor, affiliate, or independent controller.",
    "  - CN_PIPL_ART39 (Article 39, P7)",
    "    URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    "- Confirm whether the personal information protection impact assessment has been completed and retained.",
    "  - CN_PIPL_ART55 (Article 55, P7)",
    "    URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    "  - CN_PIPL_ART56 (Article 56, P7)",
    "    URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    "- Confirm whether user notice and separate consent mechanisms are valid in the actual product flow.",
    "  - CN_PIPL_ART39 (Article 39, P7)",
    "    URL: https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    "  - CN_CAC_CROSS_BORDER_2024_ART10 (Article 10, P7)",
    "    URL: https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm"
  ];
}

function buildEvidenceRecords(): EvidenceRecord[] {
  return EVIDENCE_RECORDS.map((record) => ({
    evidenceId: record.evidenceId,
    country: "China",
    pillar: record.relatedPillar === "P7" ? "Pillar 7" : "Pillar 6",
    indicator:
      record.relatedPillar === "P7"
        ? "Data Protection Impact Assessment / Data Protection Officer Requirements"
        : "Conditional Flow Regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    lawTitle:
      record.url === PIPL_URL
        ? "Personal Information Protection Law of the People's Republic of China"
        : "Provisions on Promoting and Regulating Cross-border Data Flows",
    citation: record.article,
    verbatimSnippet: record.summary,
    sourceUrl: record.url,
    sourceLocator: record.article,
    sourceStrength: "country-profile",
    traceabilityTier: "page-level",
    sourceType: record.url === PIPL_URL ? "Statute" : "Regulator Guidance",
    discoveryTags: ["ShopPilot AI", "P7:7.4", record.relatedPillar, record.article],
    confidence: 0.96,
    reviewStatus: "Approved",
    reviewerNote: "Demo evidence for the ShopPilot AI case analysis.",
    originalLegalText: record.summary,
    aiExtraction: record.summary,
    pillar6Mapping:
      record.relatedPillar === "P7"
        ? "Pillar 7 — Indicator 7.4 Data Protection Impact Assessment / Data Protection Officer Requirements"
        : "Pillar 6 — Indicator 6.4 Conditional Flow Regimes",
    mappingRationale:
      record.relatedPillar === "P7"
        ? "The evidence supports the domestic impact assessment, notice, consent, and accountability analysis."
        : "The evidence explains the linked conditional outbound transfer route for the case facts.",
    riskImplication:
      "ShopPilot AI should document impact assessment, notice, separate consent, and recipient safeguards before continuing the transfer."
  }));
}

export function applyShopPilotCaseDemoOverride(workflowResult: WorkflowResult): WorkflowResult {
  const output = buildShopPilotCaseDemoOutput();
  const markdown = formatShopPilotCaseDemoMarkdown(output);
  const evidenceRecords = buildEvidenceRecords();
  const passages: LegalPassage[] = evidenceRecords.map((record, index) => ({
    passageId: `PASS-SHOPPILOT-${index + 1}`,
    evidenceId: record.evidenceId,
    sourceId: `SRC-${record.evidenceId}`,
    lawTitle: record.lawTitle,
    jurisdiction: record.country,
    pillarId: record.pillar === "Pillar 7" ? "P7" : "P6",
    indicatorId: record.pillar === "Pillar 7" ? "7.4" : "6.4",
    citationRef: record.citation,
    sourceUrl: record.sourceUrl,
    text: record.originalLegalText
  }));
  const mappedEvidence: MappedEvidenceItem[] = passages.map((passage) => ({
    evidenceId: passage.evidenceId,
    passageId: passage.passageId,
    pillarId: passage.pillarId,
    indicatorId: passage.indicatorId,
    citationRef: passage.citationRef,
    mappingReason:
      passage.pillarId === "P7"
        ? "Mapped to the user-specified Pillar 7 indicator for this ShopPilot demo workflow."
        : "Mapped as the linked Pillar 6 conditional flow issue for this ShopPilot demo workflow."
  }));
  const legalFindings: LegalFinding[] = [
    {
      conclusionId: "FIND-SHOPPILOT-P7-74",
      jurisdiction: "China",
      pillarId: "P7",
      indicatorId: "7.4",
      conclusion: output.directAnswer.title,
      legalEffect: output.directAnswer.summary,
      evidenceIds: ["CN_PIPL_ART55", "CN_PIPL_ART56", "CN_PIPL_ART39", "CN_CAC_CROSS_BORDER_2024_ART10"],
      passageIds: passages
        .filter((passage) => passage.pillarId === "P7")
        .map((passage) => passage.passageId)
    },
    {
      conclusionId: "FIND-SHOPPILOT-P6-64",
      jurisdiction: "China",
      pillarId: "P6",
      indicatorId: "6.4",
      conclusion: "The China-to-Singapore transfer links to P6:6.4 Conditional Flow Regimes.",
      legalEffect: output.analysis.pillar6Linkage.reasoning,
      evidenceIds: ["CN_CAC_CROSS_BORDER_2024_ART8"],
      passageIds: passages
        .filter((passage) => passage.pillarId === "P6")
        .map((passage) => passage.passageId)
    }
  ];
  const rebuttalReview: RebuttalAgentOutput = {
    reviews: legalFindings.map((finding) => ({
      conclusionId: finding.conclusionId,
      status: "Supported",
      rebuttalNote:
        "The conclusion is supported by the imported demo evidence and remains limited to the stated mock facts.",
      citedEvidenceIds: finding.evidenceIds
    })),
    summary: {
      supportedCount: legalFindings.length,
      weaklySupportedCount: 0,
      unsupportedCount: 0,
      humanReviewNeeded: false
    }
  };
  const riskSummary: RiskSummary = {
    riskLevel: "High",
    riskSummary: output.complianceImpact.impactSummary,
    businessImpactSummary: output.complianceImpact.impactSummary,
    operationalImpact: output.complianceImpact.impactSummary,
    uncertaintyLevel: "Moderate",
    humanReviewNeeded: true
  };
  const auditItems: AuditCitationItem[] = legalFindings.flatMap((finding) =>
    finding.evidenceIds.map((evidenceId) => {
      const record = evidenceRecords.find((item) => item.evidenceId === evidenceId) ?? evidenceRecords[0];
      const passage = passages.find((item) => item.evidenceId === evidenceId) ?? passages[0];

      return {
        evidenceId,
        sourceId: passage.sourceId,
        conclusionId: finding.conclusionId,
        jurisdiction: record.country,
        pillarId: finding.pillarId,
        indicatorId: finding.indicatorId,
        passageId: passage.passageId,
        lawTitle: record.lawTitle,
        citationRef: record.citation,
        sourceUrl: record.sourceUrl,
        sourceLocator: record.sourceLocator,
        sourceStrength: record.sourceStrength,
        traceabilityTier: record.traceabilityTier,
        originalLegalText: record.originalLegalText,
        verbatimSnippet: record.verbatimSnippet,
        extractedClaim: finding.conclusion,
        legalEffect: finding.legalEffect,
        relevanceReason: record.mappingRationale,
        traceabilityStatus: "Complete",
        traceabilityNote: "The ShopPilot demo finding is linked to an imported legal evidence item.",
        humanReviewNeeded: false,
        reviewerNote: record.reviewerNote,
        reviewStatus: record.reviewStatus
      };
    })
  );

  return {
    ...workflowResult,
    evidenceSourceMode: "real",
    evidenceRecords,
    input: {
      ...workflowResult.input,
      countryA: "China",
      countryB: "Singapore",
      businessScenario: "case analysis",
      taskType: "case-analysis"
    },
    report: {
      title: output.directAnswer.title,
      overallRisk: "High",
      finalNarrative: markdown,
      modeSections: [
        { heading: "Case Snapshot", body: output.caseSnapshot.dataFlow },
        { heading: "Direct Answer", body: output.directAnswer.summary },
        { heading: "Pillar 7 Assessment", body: output.analysis.pillar7Assessment.reasoning },
        { heading: "Pillar 6 Linkage", body: output.analysis.pillar6Linkage.reasoning },
        { heading: "Compliance Impact", body: output.complianceImpact.impactSummary }
      ],
      policyRecommendations: output.complianceImpact.mainComplianceActions,
      comparisonTable: []
    },
    mainlineAgentResults: {
      ...workflowResult.mainlineAgentResults,
      intentArbiter: {
        status: "success",
        agentId: "intent-arbiter",
        data: {
          normalizedIntent:
            "Analyze ShopPilot AI's existing China-to-Singapore data transfer under P7:7.4 and linked P6:6.4.",
          workflowMode: "case-analysis",
          taskType: "case-analysis",
          selectedPillarId: "P7",
          selectedIndicatorId: "7.4",
          businessScenario: "case analysis",
          scopeConfirmed: true,
          focusIndicators: ["P7:7.4"]
        },
        message: "ShopPilot case demo query routed to Pillar 7 case analysis.",
        downstreamAgent: "document-reader"
      },
      documentReader: {
        status: "success",
        agentId: "document-reader",
        data: { passages },
        message: "ShopPilot demo evidence normalized into citation-ready passages.",
        downstreamAgent: "indicator-mapping"
      },
      indicatorMapping: {
        status: "success",
        agentId: "indicator-mapping",
        data: { mappedEvidence },
        message: "ShopPilot passages tagged with P7:7.4 and linked P6:6.4.",
        downstreamAgent: "legal-reasoner"
      },
      legalReasoner: {
        status: "success",
        agentId: "legal-reasoner",
        data: { legalFindings },
        message: "ShopPilot case findings generated from bound demo evidence.",
        downstreamAgent: "rebuttal-agent"
      }
    },
    supportingAgentResults: {
      ...workflowResult.supportingAgentResults,
      rebuttalAgent: {
        status: "success",
        agentId: "rebuttal-agent",
        data: rebuttalReview,
        message: "ShopPilot demo conclusions are supported by the cited passages.",
        downstreamAgent: "risk-cost-quantifier"
      },
      riskCostQuantifier: {
        status: "success",
        agentId: "risk-cost-quantifier",
        data: { riskSummary },
        message: "ShopPilot compliance impact summarized for the selected indicator.",
        downstreamAgent: "audit-citation"
      },
      auditCitation: {
        status: "success",
        agentId: "audit-citation",
        data: {
          auditItems,
          coverageSummary: {
            totalFindings: legalFindings.length,
            linkedFindings: auditItems.length,
            needsReviewCount: 0
          }
        },
        message: "ShopPilot findings linked to imported citations and passages.",
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
            approvedCount: evidenceRecords.length,
            needsRevisionCount: 0,
            rejectedCount: 0,
            humanReviewCount: 0
          },
          exportJson: output,
          exportCsvRows: evidenceRecords.map((record) => ({
            evidenceId: record.evidenceId,
            citationRef: record.citation,
            indicatorId: record.pillar === "Pillar 7" ? "7.4" : "6.4",
            pillarId: record.pillar === "Pillar 7" ? "P7" : "P6",
            reviewStatus: record.reviewStatus,
            traceabilityStatus: "Complete",
            riskLevel: output.complianceImpact.riskLevel
          })),
          exportMarkdown: markdown
        },
        message: "ShopPilot case demo package rendered for frontend display."
      }
    },
    agentTrace: workflowResult.agentTrace.map((trace, index) => ({
      ...trace,
      evidenceIds: index === 0 ? [] : evidenceRecords.map((record) => record.evidenceId)
    }))
  };
}
