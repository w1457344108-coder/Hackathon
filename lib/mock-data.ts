import type { CountryPolicyProfile, SupportedCountry } from "@/lib/types";

export const supportedCountries: SupportedCountry[] = [
  "China",
  "Singapore",
  "Japan",
  "European Union",
  "United States"
];

export const countryPolicyProfiles: Record<SupportedCountry, CountryPolicyProfile> = {
  China: {
    country: "China",
    region: "Asia-Pacific",
    dataTransferPolicy:
      "Current prototype baseline: cross-border transfers often depend on data category, processor role, and national security-sensitive triggers.",
    localizationRules:
      "Stronger localization expectations exist for important data and some personal information scenarios, with sectoral and security-linked storage expectations.",
    privacyFramework:
      "Layered privacy and cybersecurity governance with personal information, data security, and network security obligations.",
    approvalMechanism:
      "Security assessment, certification, or standard contractual path may be needed depending on the transfer pattern.",
    businessImpact: "High",
    opennessScore: 42,
    riskLevel: "High",
    rdtiiStyleScore: {
      banLocalProcessing: 1,
      localStorage: 1,
      infrastructureRequirement: 1,
      conditionalFlowRegime: 1,
      bindingAgreementGap: 1
    },
    internationalAgreements: [
      "Digital trade commitments are selective rather than broadly liberalizing in the current prototype baseline.",
      "Cross-border data commitments are treated as narrower than Singapore or Japan in the current prototype baseline."
    ],
    complianceNotes: [
      "Transfer mapping and data classification are front-loaded compliance tasks.",
      "Legal review is often needed before moving customer or operational datasets abroad.",
      "Vendor architecture choices can materially affect cost and time to launch."
    ],
    keySignals: [
      "High conditional transfer scrutiny",
      "Local infrastructure expectations in selected cases",
      "Greater approval complexity"
    ],
    strategicOutlook:
      "Best suited to staged market entry with strong local counsel, clear data inventory, and localization-ready architecture.",
    demoDisclaimer:
      "Prototype baseline aligned to ESCAP RDTII Pillar 6 dimensions. Review competition-designated evidence records before treating outputs as final legal support."
  },
  Singapore: {
    country: "Singapore",
    region: "Asia-Pacific",
    dataTransferPolicy:
      "Current prototype baseline: cross-border transfers are comparatively open, with accountability obligations centered on safeguarding personal data when exporting it.",
    localizationRules:
      "No broad economy-wide localization requirement is assumed in the current prototype baseline.",
    privacyFramework:
      "Business-oriented privacy regime emphasizing accountability, consent, and reasonable protection obligations.",
    approvalMechanism:
      "Contractual safeguards, internal governance, and due diligence are emphasized over prior government approval in most flows.",
    businessImpact: "Low",
    opennessScore: 88,
    riskLevel: "Low",
    rdtiiStyleScore: {
      banLocalProcessing: 0,
      localStorage: 0,
      infrastructureRequirement: 0,
      conditionalFlowRegime: 0.5,
      bindingAgreementGap: 0
    },
    internationalAgreements: [
      "Strong orientation toward digital trade cooperation and interoperability.",
      "The current prototype baseline assumes participation in binding digital trade commitments."
    ],
    complianceNotes: [
      "Supplier due diligence remains important for outbound personal data transfers.",
      "Documentation burden is manageable for most cross-border service models.",
      "Suitable for regional hub strategies."
    ],
    keySignals: [
      "High openness score",
      "Low localization friction",
      "Interoperability-friendly posture"
    ],
    strategicOutlook:
      "A strong launch market for regional digital operations, especially when speed, scalability, and lower compliance friction matter.",
    demoDisclaimer:
      "Prototype baseline aligned to ESCAP RDTII Pillar 6 dimensions. Review competition-designated evidence records before treating outputs as final legal support."
  },
  Japan: {
    country: "Japan",
    region: "Asia-Pacific",
    dataTransferPolicy:
      "Current prototype baseline: cross-border data movement is generally permitted with privacy and accountability controls rather than broad localization.",
    localizationRules:
      "No general local storage mandate is assumed, though sector-sensitive controls may still shape implementation choices.",
    privacyFramework:
      "Mature privacy framework with transfer accountability, notice, and organizational governance obligations.",
    approvalMechanism:
      "Transfers rely more on adequacy-style trust, contracts, and compliance processes than on ex ante government approval.",
    businessImpact: "Medium",
    opennessScore: 79,
    riskLevel: "Moderate",
    rdtiiStyleScore: {
      banLocalProcessing: 0,
      localStorage: 0,
      infrastructureRequirement: 0,
      conditionalFlowRegime: 0.5,
      bindingAgreementGap: 0
    },
    internationalAgreements: [
      "The current prototype baseline assumes strong participation in trade arrangements supporting data flows.",
      "Interoperability posture is modeled as stronger than restrictive economies."
    ],
    complianceNotes: [
      "Governance rigor is still required for vendor, customer, and cross-border data handling.",
      "Sector-specific diligence may shape rollout for finance or sensitive data operations.",
      "Documentation expectations remain meaningful but tractable."
    ],
    keySignals: [
      "Open but controlled transfer model",
      "Moderate documentation workload",
      "Predictable privacy governance"
    ],
    strategicOutlook:
      "Well suited for trust-sensitive B2B services that can sustain structured compliance operations.",
    demoDisclaimer:
      "Prototype baseline aligned to ESCAP RDTII Pillar 6 dimensions. Review competition-designated evidence records before treating outputs as final legal support."
  },
  "European Union": {
    country: "European Union",
    region: "Europe",
    dataTransferPolicy:
      "Current prototype baseline: transfers are allowed, but exporters need recognized transfer mechanisms and strong accountability around personal data protection.",
    localizationRules:
      "No blanket localization rule is assumed, but adequacy and transfer mechanism requirements introduce meaningful outbound friction.",
    privacyFramework:
      "Comprehensive rights-based privacy architecture with strong obligations for controllers and processors.",
    approvalMechanism:
      "Adequacy, standard contractual safeguards, or approved internal rules typically anchor transfer legitimacy in the current prototype baseline.",
    businessImpact: "Medium",
    opennessScore: 74,
    riskLevel: "Moderate",
    rdtiiStyleScore: {
      banLocalProcessing: 0,
      localStorage: 0,
      infrastructureRequirement: 0,
      conditionalFlowRegime: 1,
      bindingAgreementGap: 0
    },
    internationalAgreements: [
      "Cross-border data openness is paired with strong rights protection and adequacy logic.",
      "The current prototype baseline assumes meaningful interoperability, but with higher privacy-driven compliance effort than Singapore."
    ],
    complianceNotes: [
      "Transfer impact analysis and contract governance can create moderate delivery overhead.",
      "Privacy-by-design expectations affect product and vendor choices.",
      "Sensitive data handling needs disciplined record keeping."
    ],
    keySignals: [
      "High trust but heavier privacy governance",
      "No broad localization",
      "Conditional transfer regime"
    ],
    strategicOutlook:
      "Attractive for trust-led digital services if the team can support structured privacy operations and transfer documentation.",
    demoDisclaimer:
      "Prototype baseline aligned to ESCAP RDTII Pillar 6 dimensions. Review competition-designated evidence records before treating outputs as final legal support."
  },
  "United States": {
    country: "United States",
    region: "North America",
    dataTransferPolicy:
      "Current prototype baseline: the transfer environment is generally open at the federal market level, with compliance variation driven by sectoral rules and partner expectations.",
    localizationRules:
      "No broad federal localization requirement is assumed in the current prototype baseline.",
    privacyFramework:
      "Fragmented privacy landscape with sectoral and state-level obligations rather than one unified national regime.",
    approvalMechanism:
      "Government pre-approval is not modeled as the default, but sectoral controls and partner-side transfer restrictions can still matter.",
    businessImpact: "Medium",
    opennessScore: 81,
    riskLevel: "Moderate",
    rdtiiStyleScore: {
      banLocalProcessing: 0,
      localStorage: 0,
      infrastructureRequirement: 0,
      conditionalFlowRegime: 0.5,
      bindingAgreementGap: 1
    },
    internationalAgreements: [
      "The current prototype baseline reflects openness in commercial practice but less comprehensive binding digital trade coverage than the strongest interoperability cases.",
      "Cross-border trust can still depend on foreign counterpart requirements."
    ],
    complianceNotes: [
      "Operational openness is high, but patchwork privacy duties can complicate national rollout.",
      "Outbound transfer friction may arise from partner jurisdictions rather than domestic localization rules.",
      "Sector-specific governance still matters."
    ],
    keySignals: [
      "Operationally open",
      "Patchwork privacy environment",
      "Moderate strategic risk for cross-border scaling"
    ],
    strategicOutlook:
      "Good for product scaling and cloud-native architectures, but cross-border programs still need partner-jurisdiction transfer planning.",
    demoDisclaimer:
      "Prototype baseline aligned to ESCAP RDTII Pillar 6 dimensions. Review competition-designated evidence records before treating outputs as final legal support."
  }
};
