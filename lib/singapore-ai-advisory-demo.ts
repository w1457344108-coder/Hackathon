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

const ADVISORY_EVIDENCE = [
  {
    evidenceId: "CN_PIPL_ART38",
    relatedPillar: "P6",
    article: "Article 38",
    role: "Core legal basis for conditional overseas transfer of personal information",
    summary:
      "A personal information processor that needs to provide personal information outside China must satisfy one legally recognized transfer condition, such as security assessment, personal information protection certification, standard contract, or another lawful condition.",
    url: PIPL_URL,
    screenshotPath: "/screenshots/china-pipl-article-38.png"
  },
  {
    evidenceId: "CN_PIPL_ART39",
    relatedPillar: "P7",
    article: "Article 39",
    role: "Notice and separate consent requirement for overseas transfer",
    summary:
      "Before providing personal information overseas, the processor should inform individuals of the overseas recipient, processing purpose, processing method, categories of personal information, and rights-exercise methods, and obtain separate consent.",
    url: PIPL_URL,
    screenshotPath: "/screenshots/china-pipl-article-39.png"
  },
  {
    evidenceId: "CN_PIPL_ART55",
    relatedPillar: "P7",
    article: "Article 55",
    role: "Pre-launch personal information protection impact assessment trigger",
    summary:
      "Providing personal information overseas is a scenario where a personal information protection impact assessment should be conducted in advance and processing records should be retained.",
    url: PIPL_URL,
    screenshotPath: "/screenshots/china-pipl-article-55.png"
  },
  {
    evidenceId: "CN_PIPL_ART56",
    relatedPillar: "P7",
    article: "Article 56",
    role: "Required assessment dimensions",
    summary:
      "The impact assessment should consider the lawfulness, legitimacy and necessity of the processing purpose and method, the impact on personal rights and interests, and whether protection measures are lawful, effective, and proportionate to the risk.",
    url: PIPL_URL,
    screenshotPath: "/screenshots/china-pipl-article-56.png"
  },
  {
    evidenceId: "CN_CAC_CROSS_BORDER_2024_ART8",
    relatedPillar: "P6",
    article: "Article 8",
    role: "Likely outbound transfer route for the planned volume",
    summary:
      "For a non-critical information infrastructure operator transferring ordinary personal information of 100,000 or more but fewer than 1,000,000 individuals since January 1 of the current year, the standard contract or personal information protection certification route may apply.",
    url: CROSS_BORDER_2024_URL,
    screenshotPath: "/screenshots/china-cross-border-2024-article-8.png"
  },
  {
    evidenceId: "CN_CAC_CROSS_BORDER_2024_ART10",
    relatedPillar: "P7",
    article: "Article 10",
    role: "Continued domestic protection duties for outbound personal information",
    summary:
      "When providing personal information overseas, the data processor should still perform obligations such as notification, separate consent, and personal information protection impact assessment under applicable laws and administrative regulations.",
    url: CROSS_BORDER_2024_URL,
    screenshotPath: "/screenshots/china-cross-border-2024-article-10.png"
  },
  {
    evidenceId: "CN_CAC_CROSS_BORDER_2024_ART11",
    relatedPillar: "P7",
    article: "Article 11",
    role: "Data security protection obligation",
    summary:
      "Data processors providing data overseas should comply with data security protection obligations, adopt technical and other necessary measures, and take remedial and reporting measures when a data security incident occurs or may occur.",
    url: CROSS_BORDER_2024_URL,
    screenshotPath: "/screenshots/china-cross-border-2024-article-11.png"
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

export function isSingaporeAiAdvisoryDemoQuery(input: { userQuery: string; taskType?: string }) {
  const normalized = normalizeDemoText(input.userQuery);

  return (
    (input.taskType ?? "forward-looking-advisory") === "forward-looking-advisory" &&
    normalized.includes("singapore ai saas") &&
    normalized.includes("enter the chinese market") &&
    (normalized.includes("launch quickly") || normalized.includes("launching first")) &&
    (normalized.includes("general privacy policy") || normalized.includes("standard privacy policy")) &&
    (normalized.includes("separate consent") || normalized.includes("standard privacy policy")) &&
    normalized.includes("raw chat logs") &&
    (normalized.includes("may violate or conflict") || normalized.includes("should prepare before launch")) &&
    normalized.includes("pillar 6") &&
    normalized.includes("pillar 7") &&
    (normalized.includes("practical remediation steps") || normalized.includes("domestic data protection obligations"))
  );
}

export function buildSingaporeAiAdvisoryDemoOutput() {
  return {
    answerType: "FORWARD_LOOKING_ADVISORY",
    status: "needs_review",
    query: {
      taskType: "forward-looking-advisory",
      workflowMode: "forward-looking-advisory",
      countryA: "China",
      countryB: null,
      plannedOverseasDestination: "Singapore",
      selectedPillarId: "P6",
      selectedIndicatorId: "6.4",
      focusIndicators: ["P6:6.4", "P7:7.1", "P7:7.4"],
      scopeConfirmed: true
    },
    directAnswer: {
      title: "The planned business is feasible only after major compliance redesign.",
      summary:
        "The planned China-to-Singapore data flow sits in a regulatory grey area. The business is not automatically prohibited, but several planned design choices may conflict with Chinese personal information protection and cross-border data transfer rules. The highest-risk issues are launching before selecting a lawful outbound transfer mechanism, relying only on a general privacy policy instead of separate consent, transferring raw personal information overseas for model training, failing to classify sensitive personal information or important data, and not conducting a personal information protection impact assessment before transfer."
    },
    advisorySnapshot: {
      advisoryName: "Pre-launch Advisory for Singapore AI SaaS Entry into China",
      targetJurisdiction: "China",
      companyOrigin: "Singapore",
      plannedBusinessActivity: "AI customer support SaaS for Chinese e-commerce merchants",
      plannedDataFlow:
        "Chinese consumers’ customer support data may be transferred to a Singapore analytics center.",
      plannedTransferPurpose: [
        "AI model training",
        "service optimization",
        "customer support quality analysis"
      ],
      riskRelatedSegments: [
        "The company wants to launch quickly before completing a formal outbound transfer mechanism.",
        "The company plans to rely on a general privacy policy instead of separate consent.",
        "The company may transfer raw chat logs, phone numbers, email addresses, order information, and user tags overseas.",
        "The company has not confirmed whether sensitive personal information, voice data, financial account data, or important data may enter the pipeline.",
        "The company has not completed a personal information protection impact assessment.",
        "The company has not defined the Singapore analytics center’s protection obligations."
      ]
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
        relevantArticles: ["Article 5", "Article 6", "Article 38", "Article 39", "Article 55", "Article 56"]
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
        relevantArticles: ["Article 2", "Article 8", "Article 10", "Article 11"]
      }
    ],
    selectedIndicators: [
      {
        pillarId: "P6",
        pillarName: "Cross-border Data Policies",
        indicatorId: "6.4",
        indicatorName: "Conditional Flow Regimes",
        role: "Primary cross-border transfer risk"
      },
      {
        pillarId: "P7",
        pillarName: "Domestic Data Protection and Privacy",
        indicatorId: "7.1",
        indicatorName: "Comprehensive Data Protection Framework",
        role: "Domestic privacy and lawful processing layer"
      },
      {
        pillarId: "P7",
        pillarName: "Domestic Data Protection and Privacy",
        indicatorId: "7.4",
        indicatorName: "Data Protection Impact Assessment / Data Protection Officer Requirements",
        role: "Pre-transfer impact assessment and accountability layer"
      }
    ],
    evidence: ADVISORY_EVIDENCE.map((record) => ({
      evidenceId: record.evidenceId,
      relatedPillar: record.relatedPillar,
      article: record.article,
      evidenceRole: record.role,
      passageSummary: record.summary,
      url: record.url,
      screenshotPath: record.screenshotPath
    })),
    possibleNonComplianceFindings: [
      {
        findingId: "RISK_01",
        plannedAction: "Launching the service before selecting a formal outbound transfer mechanism.",
        possibleLegalConflict:
          "This may conflict with the requirement that personal information processors satisfy a legally recognized condition before providing personal information overseas.",
        relatedLaw:
          "Personal Information Protection Law, Article 38; Provisions on Promoting and Regulating Cross-border Data Flows, Article 8",
        relatedRDTIIIndicators: ["P6:6.4"],
        riskLevel: "High",
        whyItMatters:
          "The transfer is not a free data flow. If the company transfers Chinese consumers’ personal information to Singapore before selecting a lawful route, it may fail the conditional transfer requirement.",
        recommendedFix: [
          "Do not launch overseas transfer until the transfer route is selected.",
          "Classify the outbound data and estimate annual transfer volume.",
          "If the company is not a critical information infrastructure operator and transfers 100,000 to fewer than 1,000,000 ordinary personal information records, prepare for the standard contract or certification route.",
          "If sensitive personal information, important data, or higher volume thresholds are involved, escalate to human legal review and assess whether a security assessment is required."
        ]
      },
      {
        findingId: "RISK_02",
        plannedAction: "Using only a general privacy policy instead of separate consent for overseas transfer.",
        possibleLegalConflict:
          "This may conflict with the obligation to inform individuals of the overseas recipient, processing purpose, processing method, data categories, and rights-exercise methods, and to obtain separate consent before providing personal information overseas.",
        relatedLaw:
          "Personal Information Protection Law, Article 39; Provisions on Promoting and Regulating Cross-border Data Flows, Article 10",
        relatedRDTIIIndicators: ["P7:7.1", "P6:6.4"],
        riskLevel: "High",
        whyItMatters:
          "A broad privacy policy may not be enough if it does not clearly disclose the overseas transfer and does not obtain separate consent where required.",
        recommendedFix: [
          "Create a separate cross-border transfer notice module.",
          "Clearly disclose the Singapore recipient, transfer purpose, data categories, processing method, and rights-exercise channels.",
          "Add a separate consent mechanism before transfer begins.",
          "Keep consent records and privacy notice version history."
        ]
      },
      {
        findingId: "RISK_03",
        plannedAction: "Transferring raw chat logs and contact details overseas for model training.",
        possibleLegalConflict:
          "This may conflict with the principles of lawfulness, legitimacy, necessity, good faith, purpose limitation, and data minimization if the raw data exceeds what is necessary for model training.",
        relatedLaw: "Personal Information Protection Law, Articles 5 and 6",
        relatedRDTIIIndicators: ["P7:7.1"],
        riskLevel: "Medium-High",
        whyItMatters:
          "Raw customer support data may contain more personal information than is necessary for model optimization. Chat logs may also accidentally contain sensitive personal information or financial information provided by users.",
        recommendedFix: [
          "Use data minimization before transfer.",
          "Remove or mask phone numbers, emails, order IDs, addresses, and other direct identifiers where possible.",
          "Use anonymized or de-identified training datasets when feasible.",
          "Separate model training data from operational customer support data.",
          "Block or flag sensitive personal information before overseas transfer."
        ]
      },
      {
        findingId: "RISK_04",
        plannedAction:
          "Not confirming whether sensitive personal information, voice data, financial account data, or important data may enter the pipeline.",
        possibleLegalConflict:
          "This may conflict with the need to correctly classify outbound data and select the correct cross-border transfer route. If important data or high-volume sensitive personal information is involved, a stricter route may apply.",
        relatedLaw: "Provisions on Promoting and Regulating Cross-border Data Flows, Articles 2 and 8",
        relatedRDTIIIndicators: ["P6:6.4", "P7:7.1"],
        riskLevel: "High",
        whyItMatters:
          "The planned route may be wrong if the company assumes all data is ordinary personal information while sensitive personal information, financial account data, voiceprint data, or important data actually enters the system.",
        recommendedFix: [
          "Build a data classification checklist before launch.",
          "Label data as ordinary personal information, sensitive personal information, possible important data, or non-personal data.",
          "Add automatic detection for financial account data, identity documents, minors’ data, health data, and voiceprint-related data.",
          "If the data type or volume crosses a stricter threshold, trigger human legal review before transfer."
        ]
      },
      {
        findingId: "RISK_05",
        plannedAction:
          "Not conducting a personal information protection impact assessment before overseas transfer.",
        possibleLegalConflict:
          "This may conflict with the requirement to conduct a personal information protection impact assessment before providing personal information overseas.",
        relatedLaw:
          "Personal Information Protection Law, Articles 55 and 56; Provisions on Promoting and Regulating Cross-border Data Flows, Article 10",
        relatedRDTIIIndicators: ["P7:7.4"],
        riskLevel: "High",
        whyItMatters:
          "The impact assessment is the main Pillar 7 accountability step for evaluating the lawfulness, necessity, risk level, and protection measures of the planned transfer.",
        recommendedFix: [
          "Conduct the impact assessment before data transfer begins.",
          "Assess the lawfulness, legitimacy, and necessity of model training and service optimization.",
          "Assess the impact on individuals’ rights and interests.",
          "Review whether protection measures are proportionate to the risk.",
          "Retain the assessment report and processing records for audit or regulatory review."
        ]
      },
      {
        findingId: "RISK_06",
        plannedAction: "Not defining the Singapore analytics center’s protection obligations.",
        possibleLegalConflict:
          "This may conflict with the obligation to take necessary measures to ensure that the overseas recipient’s processing activities meet required protection standards and with general data security obligations for outbound data.",
        relatedLaw:
          "Personal Information Protection Law, Article 38; Provisions on Promoting and Regulating Cross-border Data Flows, Article 11",
        relatedRDTIIIndicators: ["P6:6.4", "P7:7.1"],
        riskLevel: "Medium-High",
        whyItMatters:
          "Even after data leaves China, the Chinese-side personal information processor may still need to ensure that the overseas recipient can protect the transferred personal information.",
        recommendedFix: [
          "Sign a data transfer agreement with the Singapore analytics center.",
          "Define access control, encryption, retention, deletion, incident response, audit, and onward transfer restrictions.",
          "Require the Singapore recipient to support user rights requests where applicable.",
          "Create a cross-border incident response and reporting process."
        ]
      }
    ],
    overallAssessment: {
      riskLevel: "High before remediation; Medium after remediation",
      goNoGoRecommendation: "No-Go until remediation is completed",
      goNoGoReason:
        "The business should not launch the cross-border transfer workflow in its current grey-area design. The core business model may be feasible, but only after the company builds a lawful transfer route, separate consent process, data classification controls, impact assessment, and overseas recipient safeguards."
    },
    remediationRoadmap: [
      {
        phase: "Phase 1 — Freeze high-risk transfer design",
        priority: "Immediate",
        actions: [
          "Do not transfer raw Chinese customer support data to Singapore before completing the compliance route.",
          "Limit the beta launch to local testing or anonymized/non-personal data where feasible.",
          "Separate production customer data from model training data."
        ]
      },
      {
        phase: "Phase 2 — Data classification and minimization",
        priority: "High",
        actions: [
          "Classify all data fields used by the AI customer support product.",
          "Identify whether sensitive personal information, financial account data, voiceprint data, minors’ data, or important data may appear.",
          "Remove unnecessary identifiers before overseas transfer.",
          "Design a sensitive-data blocking or escalation rule."
        ]
      },
      {
        phase: "Phase 3 — Select Pillar 6 transfer route",
        priority: "High",
        actions: [
          "Estimate annual outbound transfer volume.",
          "Confirm whether the company is a critical information infrastructure operator.",
          "Choose standard contract, certification, security assessment, or another lawful route based on data type and volume.",
          "Document why the selected route fits the case facts."
        ]
      },
      {
        phase: "Phase 4 — Build Pillar 7 user-facing protection layer",
        priority: "High",
        actions: [
          "Create a clear overseas transfer notice.",
          "Implement separate consent where required.",
          "Provide channels for individuals to exercise their rights.",
          "Keep records of notice, consent, and user choices."
        ]
      },
      {
        phase: "Phase 5 — Complete impact assessment and recipient controls",
        priority: "High",
        actions: [
          "Conduct personal information protection impact assessment.",
          "Review transfer purpose, necessity, data scope, recipient safeguards, and individual rights impact.",
          "Sign data protection obligations with the Singapore analytics center.",
          "Prepare audit records and incident response procedures."
        ]
      }
    ],
    workflowTrace: [
      {
        step: 1,
        agentName: "Advisory Intake Agent",
        action: "Read the user's planned business scenario and confirm the task type.",
        output:
          "The query is classified as Forward-looking Advisory for a grey-area China-to-Singapore AI SaaS data transfer plan."
      },
      {
        step: 2,
        agentName: "Risk Fact Extraction Agent",
        action: "Extract risk-relevant planned actions.",
        output:
          "The system identified fast launch before transfer mechanism, general privacy policy only, raw data transfer, uncertain sensitive data classification, missing impact assessment, and undefined overseas recipient safeguards."
      },
      {
        step: 3,
        agentName: "Pillar 6 Conditional Flow Agent",
        action: "Identify cross-border transfer risks.",
        output:
          "The plan may conflict with P6:6.4 because the company intends to transfer personal information overseas before completing a lawful transfer route."
      },
      {
        step: 4,
        agentName: "Pillar 7 Domestic Protection Agent",
        action: "Identify domestic data protection risks.",
        output:
          "The plan may conflict with Pillar 7 obligations because it lacks separate consent, impact assessment, minimization, data classification, and recipient safeguards."
      },
      {
        step: 5,
        agentName: "Possible Violation Mapping Agent",
        action: "Map each risky planned action to related laws and remediation actions.",
        output:
          "Six possible non-compliance findings were generated, each with related law, RDTII indicator, risk level, reason, and recommended fix."
      },
      {
        step: 6,
        agentName: "Remediation Roadmap Agent",
        action: "Generate a practical pre-launch remediation plan.",
        output:
          "A five-phase remediation roadmap was generated: freeze transfer, classify data, select transfer route, build notice and consent, and complete assessment and recipient controls."
      },
      {
        step: 7,
        agentName: "Output Composer Agent",
        action: "Generate the final frontend-ready advisory result.",
        output: "Final structured grey-area Forward-looking Advisory Card generated successfully."
      }
    ],
    humanReviewNotes: [
      "Confirm whether the company is or may become a critical information infrastructure operator.",
      "Confirm whether voice data is merely audio content or processed as biometric voiceprint data.",
      "Confirm whether customer support chats contain financial account data, medical data, minors’ data, or other sensitive personal information.",
      "Confirm whether any data has been officially identified as important data by relevant authorities or sectoral regulators.",
      "Confirm whether the expected transfer volume crosses 100,000, 1,000,000, or sensitive personal information thresholds."
    ],
    exportReadySummary:
      "The planned Singapore AI SaaS entry into China is a grey-area cross-border data compliance scenario. The business model is not automatically prohibited, but the current design may conflict with Chinese cross-border data transfer and domestic personal information protection rules. The main possible non-compliance points are launching overseas transfer before selecting a lawful outbound transfer mechanism, relying only on a general privacy policy instead of separate consent, transferring raw customer support data overseas for model training, failing to classify sensitive personal information or important data, skipping the personal information protection impact assessment, and failing to define the Singapore recipient’s protection obligations. Under RDTII Pillar 6, the plan maps to Indicator 6.4 Conditional Flow Regimes because data transfer is allowed only after legal conditions are satisfied. Under RDTII Pillar 7, the plan raises domestic data protection issues related to lawful processing, notice, consent, data minimization, impact assessment, and overseas recipient safeguards. The recommended decision is No-Go until remediation is completed, followed by a Conditional Go after the transfer route, data classification, separate consent, impact assessment, and recipient controls are implemented."
  };
}

export function formatSingaporeAiAdvisoryDemoMarkdown(output = buildSingaporeAiAdvisoryDemoOutput()) {
  return [
    "1. Advisory Snapshot",
    `- Advisory name: ${output.advisorySnapshot.advisoryName}`,
    `- Target jurisdiction: ${output.advisorySnapshot.targetJurisdiction}`,
    `- Company origin: ${output.advisorySnapshot.companyOrigin}`,
    `- Planned business activity: ${output.advisorySnapshot.plannedBusinessActivity}`,
    `- Planned data flow: ${output.advisorySnapshot.plannedDataFlow}`,
    "- The risk-related segments:",
    ...output.advisorySnapshot.riskRelatedSegments.map((item) => `  - ${item}`),
    "",
    "2. Direct Answer",
    output.directAnswer.title,
    output.directAnswer.summary,
    "",
    "3. Selected Indicators",
    ...output.selectedIndicators.map(
      (item) => `- ${item.pillarId}:${item.indicatorId} ${item.indicatorName} — ${item.role}`
    ),
    "",
    "4. Possible Non-compliance Findings",
    ...output.possibleNonComplianceFindings.flatMap((finding) => [
      `- ${finding.findingId}: ${finding.plannedAction}`,
      `  - Possible legal conflict: ${finding.possibleLegalConflict}`,
      `  - Related law: ${finding.relatedLaw}`,
      `  - Related RDTII indicators: ${finding.relatedRDTIIIndicators.join(", ")}`,
      `  - Risk level: ${finding.riskLevel}`,
      `  - Why it matters: ${finding.whyItMatters}`,
      "  - Recommended fix:",
      ...finding.recommendedFix.map((fix) => `    - ${fix}`)
    ]),
    "",
    "5. Overall Assessment",
    `- Risk level: ${output.overallAssessment.riskLevel}`,
    `- Recommendation: ${output.overallAssessment.goNoGoRecommendation}`,
    `- Reason: ${output.overallAssessment.goNoGoReason}`,
    "",
    "6. Remediation Roadmap",
    ...output.remediationRoadmap.flatMap((phase) => [
      `- ${phase.phase}`,
      `  - Priority: ${phase.priority}`,
      ...phase.actions.map((action) => `  - ${action}`)
    ]),
    "",
    "7. Human Review Notes",
    ...formatSingaporeAiAdvisoryHumanReviewNotes(),
    "",
    "8. Export-ready Summary",
    output.exportReadySummary
  ].join("\n");
}

function formatSingaporeAiAdvisoryHumanReviewNotes(): string[] {
  return [
    "- Confirm whether the company is or may become a critical information infrastructure operator.",
    "  - CN_PIPL_ART38 (Article 38, Items 1-4, P6)",
    `    URL: ${PIPL_URL}`,
    "  - CN_CAC_CROSS_BORDER_2024_ART8 (Article 8, Items 1-3, P6)",
    `    URL: ${CROSS_BORDER_2024_URL}`,
    "- Confirm whether voice data is merely audio content or processed as biometric voiceprint data.",
    "  - CN_PIPL_ART28 (Article 28, P7)",
    `    URL: ${PIPL_URL}`,
    "- Confirm whether customer support chats contain financial account data, medical data, minors' data, or other sensitive personal information.",
    "  - CN_PIPL_ART28 (Article 28, P7)",
    `    URL: ${PIPL_URL}`,
    "  - CN_PIPL_ART55 (Article 55, Item 5, P7)",
    `    URL: ${PIPL_URL}`,
    "- Confirm whether any data has been officially identified as important data by relevant authorities or sectoral regulators.",
    "  - CN_CAC_CROSS_BORDER_2024_ART2 (Article 2, P6)",
    `    URL: ${CROSS_BORDER_2024_URL}`,
    "- Confirm whether the expected transfer volume crosses 100,000, 1,000,000, or sensitive personal information thresholds.",
    "  - CN_CAC_CROSS_BORDER_2024_ART8 (Article 8, Items 1-3, P6)",
    `    URL: ${CROSS_BORDER_2024_URL}`,
    "- Confirm whether the outbound transfer notice, separate consent, impact assessment, and overseas recipient safeguards are complete before launch.",
    "  - CN_PIPL_ART39 (Article 39, P7)",
    `    URL: ${PIPL_URL}`,
    "  - CN_PIPL_ART55 (Article 55, Item 3, P7)",
    `    URL: ${PIPL_URL}`,
    "  - CN_PIPL_ART56 (Article 56, Items 1-3, P7)",
    `    URL: ${PIPL_URL}`,
    "  - CN_CAC_CROSS_BORDER_2024_ART10 (Article 10, P7)",
    `    URL: ${CROSS_BORDER_2024_URL}`
  ];
}

function buildEvidenceRecords(): EvidenceRecord[] {
  return ADVISORY_EVIDENCE.map((record) => ({
    evidenceId: record.evidenceId,
    country: "China",
    pillar: record.relatedPillar === "P6" ? "Pillar 6" : "Pillar 7",
    indicator:
      record.relatedPillar === "P6"
        ? "Conditional Flow Regimes"
        : record.evidenceId === "CN_PIPL_ART55" || record.evidenceId === "CN_PIPL_ART56"
          ? "Data Protection Impact Assessment / Data Protection Officer Requirements"
          : "Comprehensive Data Protection Framework",
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
    discoveryTags: ["Singapore AI SaaS", "P6:6.4", "P7:7.1", "P7:7.4", record.article],
    confidence: 0.96,
    reviewStatus: "Approved",
    reviewerNote: "Demo evidence for the Singapore AI SaaS forward-looking advisory.",
    originalLegalText: record.summary,
    aiExtraction: record.summary,
    pillar6Mapping:
      record.relatedPillar === "P6"
        ? "Pillar 6 — Indicator 6.4 Conditional Flow Regimes"
        : "Pillar 7 — Domestic Data Protection and Privacy",
    mappingRationale:
      record.relatedPillar === "P6"
        ? "The evidence supports the conditional outbound transfer route before launch."
        : "The evidence supports domestic notice, consent, impact assessment, and protection duties before launch.",
    riskImplication:
      "The company should build transfer-route, notice, consent, impact assessment, and recipient-control safeguards before launch."
  }));
}

export function applySingaporeAiAdvisoryDemoOverride(workflowResult: WorkflowResult): WorkflowResult {
  const output = buildSingaporeAiAdvisoryDemoOutput();
  const markdown = formatSingaporeAiAdvisoryDemoMarkdown(output);
  const evidenceRecords = buildEvidenceRecords();
  const passages: LegalPassage[] = evidenceRecords.map((record, index) => ({
    passageId: `PASS-SG-AI-${index + 1}`,
    evidenceId: record.evidenceId,
    sourceId: `SRC-${record.evidenceId}`,
    lawTitle: record.lawTitle,
    jurisdiction: record.country,
    pillarId: record.pillar === "Pillar 6" ? "P6" : "P7",
    indicatorId:
      record.pillar === "Pillar 6"
        ? "6.4"
        : record.indicator.includes("Impact Assessment")
          ? "7.4"
          : "7.1",
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
      passage.pillarId === "P6"
        ? "Mapped to P6:6.4 as the primary conditional transfer issue for the advisory demo."
        : "Mapped to the linked Pillar 7 domestic data protection obligations for the advisory demo."
  }));
  const legalFindings: LegalFinding[] = [
    {
      conclusionId: "FIND-SG-AI-P6-64",
      jurisdiction: "China",
      pillarId: "P6",
      indicatorId: "6.4",
      conclusion: output.possibleNonComplianceFindings[0].plannedAction,
      legalEffect: output.possibleNonComplianceFindings[0].possibleLegalConflict,
      evidenceIds: ["CN_PIPL_ART38", "CN_CAC_CROSS_BORDER_2024_ART8"],
      passageIds: passages
        .filter((passage) => passage.pillarId === "P6")
        .map((passage) => passage.passageId)
    },
    {
      conclusionId: "FIND-SG-AI-P7-71-74",
      jurisdiction: "China",
      pillarId: "P7",
      indicatorId: "7.4",
      conclusion: output.possibleNonComplianceFindings[4].plannedAction,
      legalEffect: output.possibleNonComplianceFindings[4].possibleLegalConflict,
      evidenceIds: [
        "CN_PIPL_ART39",
        "CN_PIPL_ART55",
        "CN_PIPL_ART56",
        "CN_CAC_CROSS_BORDER_2024_ART10",
        "CN_CAC_CROSS_BORDER_2024_ART11"
      ],
      passageIds: passages
        .filter((passage) => passage.pillarId === "P7")
        .map((passage) => passage.passageId)
    }
  ];
  const rebuttalReview: RebuttalAgentOutput = {
    reviews: legalFindings.map((finding) => ({
      conclusionId: finding.conclusionId,
      status: "Supported",
      rebuttalNote:
        "The advisory conclusion is supported by the imported demo evidence and is limited to the stated pre-launch assumptions.",
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
    riskSummary: output.overallAssessment.goNoGoReason,
    businessImpactSummary: output.overallAssessment.goNoGoReason,
    operationalImpact: output.overallAssessment.goNoGoReason,
    uncertaintyLevel: "High",
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
        traceabilityNote: "The Singapore AI SaaS advisory finding is linked to an imported legal evidence item.",
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
      countryB: null,
      businessScenario: "forward-looking advisory",
      taskType: "forward-looking-advisory"
    },
    report: {
      title: output.directAnswer.title,
      overallRisk: "High",
      finalNarrative: markdown,
      modeSections: [
        { heading: "Advisory Snapshot", body: output.advisorySnapshot.plannedDataFlow },
        { heading: "Direct Answer", body: output.directAnswer.summary },
        { heading: "Possible Non-compliance Findings", body: output.possibleNonComplianceFindings[0].possibleLegalConflict },
        { heading: "Overall Assessment", body: output.overallAssessment.goNoGoReason },
        { heading: "Remediation Roadmap", body: output.remediationRoadmap[0].actions.join(" ") }
      ],
      policyRecommendations: output.remediationRoadmap.flatMap((phase) => phase.actions),
      comparisonTable: []
    },
    mainlineAgentResults: {
      ...workflowResult.mainlineAgentResults,
      intentArbiter: {
        status: "success",
        agentId: "intent-arbiter",
        data: {
          normalizedIntent:
            "Provide a forward-looking legal advisory for Singapore AI SaaS entry into China under P6:6.4 and linked P7 obligations.",
          workflowMode: "forward-looking-advisory",
          taskType: "forward-looking-advisory",
          selectedPillarId: "P6",
          selectedIndicatorId: "6.4",
          businessScenario: "forward-looking advisory",
          scopeConfirmed: true,
          focusIndicators: ["P6:6.4", "P7:7.1", "P7:7.4"]
        },
        message: "Singapore AI SaaS advisory demo query routed to forward-looking advisory.",
        downstreamAgent: "document-reader"
      },
      documentReader: {
        status: "success",
        agentId: "document-reader",
        data: { passages },
        message: "Singapore AI SaaS advisory evidence normalized into citation-ready passages.",
        downstreamAgent: "indicator-mapping"
      },
      indicatorMapping: {
        status: "success",
        agentId: "indicator-mapping",
        data: { mappedEvidence },
        message: "Singapore AI SaaS advisory passages tagged with P6:6.4 and linked P7 obligations.",
        downstreamAgent: "legal-reasoner"
      },
      legalReasoner: {
        status: "success",
        agentId: "legal-reasoner",
        data: { legalFindings },
        message: "Singapore AI SaaS forward-looking findings generated from bound demo evidence.",
        downstreamAgent: "rebuttal-agent"
      }
    },
    supportingAgentResults: {
      ...workflowResult.supportingAgentResults,
      rebuttalAgent: {
        status: "success",
        agentId: "rebuttal-agent",
        data: rebuttalReview,
        message: "Singapore AI SaaS advisory conclusions are supported by the cited passages.",
        downstreamAgent: "risk-cost-quantifier"
      },
      riskCostQuantifier: {
        status: "success",
        agentId: "risk-cost-quantifier",
        data: { riskSummary },
        message: "Singapore AI SaaS pre-launch risk summarized for the selected indicators.",
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
        message: "Singapore AI SaaS advisory findings linked to imported citations and passages.",
        downstreamAgent: "legal-review-export"
      },
      legalReviewExport: {
        status: "success",
        agentId: "legal-review-export",
        data: {
          finalReport: output.directAnswer.summary,
          judgeSummary: output.exportReadySummary,
          exportReadiness: "Needs Human Review",
          reviewSummary: {
            approvedCount: evidenceRecords.length,
            needsRevisionCount: 0,
            rejectedCount: 0,
            humanReviewCount: 1
          },
          exportJson: output,
          exportCsvRows: evidenceRecords.map((record) => ({
            evidenceId: record.evidenceId,
            citationRef: record.citation,
            indicatorId:
              record.pillar === "Pillar 6"
                ? "6.4"
                : record.indicator.includes("Impact Assessment")
                  ? "7.4"
                  : "7.1",
            pillarId: record.pillar === "Pillar 6" ? "P6" : "P7",
            reviewStatus: record.reviewStatus,
            traceabilityStatus: "Complete",
            riskLevel: output.overallAssessment.riskLevel
          })),
          exportMarkdown: markdown
        },
        message: "Singapore AI SaaS advisory demo package rendered for frontend display."
      }
    },
    agentTrace: workflowResult.agentTrace.map((trace, index) => ({
      ...trace,
      evidenceIds: index === 0 ? [] : evidenceRecords.map((record) => record.evidenceId)
    }))
  };
}
