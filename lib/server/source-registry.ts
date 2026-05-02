import type { SupportedCountry } from "../types";
import type {
  EvidenceReviewStatus,
  EvidenceSourceType,
  Pillar6IndicatorCode
} from "../pillar6-schema";

export interface CuratedSourceRecord {
  id: string;
  country: SupportedCountry;
  title: string;
  citation: string;
  sourceUrl: string;
  sourceType: EvidenceSourceType;
  indicator: string;
  indicatorCode: Pillar6IndicatorCode;
  discoveryTags: string[];
  confidence: number;
  reviewStatus: EvidenceReviewStatus;
  reviewerNote: string;
  excerptFallback: string;
  originalTextFallback: string;
  aiExtractionFallback: string;
  pillar6Mapping: string;
  mappingRationale: string;
  riskImplication: string;
  excerptHints: string[];
}

const CHINA_PIPL_URL =
  "https://www.npc.gov.cn/npc/c2597/c5854/bfflywwb/202311/t20231117_433007.html";
const CHINA_CAC_CROSS_BORDER_URL =
  "https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm";
const SINGAPORE_TRANSFER_LIMITATION_URL =
  "https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act/data-protection-obligations";
const SINGAPORE_KEY_CONCEPTS_URL =
  "https://www.pdpc.gov.sg/-/media/Files/PDPC/PDF-Files/Advisory-Guidelines/AG-on-Key-Concepts/Advisory-Guidelines-on-Key-Concepts-in-the-PDPA-1-Oct-2021.pdf";
const JAPAN_THIRD_PARTY_GUIDELINE_URL =
  "https://www.ppc.go.jp/personalinfo/legal/guidelines_thirdparty/";
const JAPAN_OFFSHORE_GUIDELINE_URL =
  "https://www.ppc.go.jp/personalinfo/legal/guidelines_offshore";
const EU_GDPR_URL =
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679";
const US_DPF_LAUNCH_URL =
  "https://www.commerce.gov/news/press-releases/2023/07/data-privacy-framework-program-launches-new-website-enabling-us";
const US_CROSS_BORDER_RESOURCE_URL =
  "https://www.commerce.gov/ogc/about-ogc/offices/office-chief-counsel-international-commerce-occ-ic/cross-Border-data-flows-links";

export const curatedSourceRegistry: CuratedSourceRecord[] = [
  {
    id: "CHN-PIPL-001",
    country: "China",
    title: "Personal Information Protection Law of the People's Republic of China",
    citation: "PIPL, Chapter III Rules for Providing Personal Information Outside the Territory",
    sourceUrl: CHINA_PIPL_URL,
    sourceType: "Statute",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["China", "PIPL", "cross-border personal information", "Chapter III"],
    confidence: 0.91,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Primary statute-level source for China's personal-information outbound transfer rules. Reviewers should anchor any final legal conclusion to the exact Chapter III sentence located in this text.",
    excerptFallback:
      "Where it is necessary to provide personal information outside the territory of the People's Republic of China, a personal information processor shall meet one of the conditions provided by law and shall inform the individual and obtain separate consent where required.",
    originalTextFallback:
      "Personal Information Protection Law of the People's Republic of China. Chapter III sets out the rules for providing personal information outside the territory and ties outbound transfer to statutory conditions, transparency duties, and separate-consent requirements where applicable.",
    aiExtractionFallback:
      "China treats cross-border personal-information transfers as a conditional-flow regime rather than a free-transfer regime. The decisive legal basis should be taken from Chapter III of the PIPL before any final advice is issued.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the statute conditions outbound transfers on legal mechanisms and procedural requirements before personal information may be provided abroad.",
    mappingRationale:
      "This is the primary national law governing cross-border provision of personal information, so it is the strongest starting point for a China Pillar 6 analysis.",
    riskImplication:
      "A reviewer should confirm the exact Chapter III sentence used in the answer, but the core legal posture is that outbound transfers require a recognized legal basis and compliance steps.",
    excerptHints: [
      "Chapter III Rules for Providing Personal Information Outside the Territory",
      "provide personal information outside the territory",
      "separate consent"
    ]
  },
  {
    id: "CHN-CAC-001",
    country: "China",
    title: "Provisions on Promoting and Regulating Cross-border Data Flows",
    citation: "CAC Order No. 16, Provisions on Promoting and Regulating Cross-border Data Flows",
    sourceUrl: CHINA_CAC_CROSS_BORDER_URL,
    sourceType: "Policy Notice",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["China", "CAC", "cross-border data flows", "security assessment", "exemptions"],
    confidence: 0.88,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official implementing rule from the Cyberspace Administration of China. Use it to identify when filings, standard contracts, certification, or exemptions affect outbound transfer analysis.",
    excerptFallback:
      "The Provisions clarify circumstances in which personal information may be provided overseas without filing for a security assessment, entering a standard contract, or passing certification, including specified contractual, HR, emergency, and low-volume situations.",
    originalTextFallback:
      "Provisions on Promoting and Regulating Cross-border Data Flows. This rule adjusts how data export security assessments, standard contracts, and certification requirements apply to outbound transfers, including several exemption scenarios.",
    aiExtractionFallback:
      "China's outbound-transfer framework is not absolute; the CAC rule refines when security assessment, standard contracts, certification, or exemptions apply. That refinement is decisive for operational legal advice.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because it specifies the conditions and carve-outs governing outbound transfer mechanisms.",
    mappingRationale:
      "This source operationalizes the cross-border transfer gates that businesses must check after identifying the basic statutory rule in the PIPL.",
    riskImplication:
      "The decisive legal effect depends on whether the transfer falls into an exemption or a filing/contract/certification pathway, so reviewers should verify the exact factual trigger against this rule.",
    excerptHints: [
      "促进和规范数据跨境流动规定",
      "免予申报数据出境安全评估",
      "个人信息出境标准合同",
      "个人信息保护认证"
    ]
  },
  {
    id: "SGP-PDPC-001",
    country: "Singapore",
    title: "PDPA Transfer Limitation Obligation",
    citation: "PDPC, Data Protection Obligations, Transfer Limitation Obligation",
    sourceUrl: SINGAPORE_TRANSFER_LIMITATION_URL,
    sourceType: "Regulator Guidance",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["Singapore", "PDPC", "Transfer Limitation Obligation", "comparable protection"],
    confidence: 0.9,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official PDPC explanation of the Transfer Limitation Obligation. This is a strong Singapore-specific source for the core cross-border transfer condition.",
    excerptFallback:
      "Transfer personal data to another country only according to the requirements prescribed under the regulations, to ensure that the standard of protection is comparable to the protection under the PDPA, unless exempted by the PDPC.",
    originalTextFallback:
      "PDPC Data Protection Obligations. The Transfer Limitation Obligation requires organisations transferring personal data overseas to ensure a comparable standard of protection under the PDPA, unless an exemption applies.",
    aiExtractionFallback:
      "Singapore allows cross-border personal-data transfers, but only if the organisation satisfies the Transfer Limitation Obligation and ensures comparable protection or fits an exemption.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the legal rule permits cross-border transfer subject to a comparable-protection requirement rather than imposing a flat ban.",
    mappingRationale:
      "The PDPC obligation page states the decisive transfer condition in plain regulatory language and is directly relevant to Singapore transfer analysis.",
    riskImplication:
      "The decisive question for legal review is whether the overseas recipient is bound to provide a standard of protection comparable to the PDPA or falls within an available exemption.",
    excerptHints: [
      "Transfer Limitation Obligation",
      "Transfer personal data to another country only according to the requirements prescribed under the regulations",
      "comparable to the protection under the PDPA"
    ]
  },
  {
    id: "SGP-PDPC-002",
    country: "Singapore",
    title: "Advisory Guidelines on Key Concepts in the PDPA",
    citation: "PDPC Advisory Guidelines on Key Concepts in the PDPA, cross-border transfer guidance",
    sourceUrl: SINGAPORE_KEY_CONCEPTS_URL,
    sourceType: "Regulator Guidance",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["Singapore", "PDPC", "binding corporate rules", "cross-border transfer", "comparable protection"],
    confidence: 0.84,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official PDPC guidance explaining how organisations can satisfy the comparable-protection requirement for overseas transfers.",
    excerptFallback:
      "The recipient organisation is taken to satisfy the Transfer Limitation Obligation if it is bound by legally enforceable obligations that provide a standard of protection comparable to the PDPA.",
    originalTextFallback:
      "Advisory Guidelines on Key Concepts in the PDPA. The guidance explains how binding corporate rules, certifications, contractual commitments, and other legally enforceable obligations may satisfy the Transfer Limitation Obligation.",
    aiExtractionFallback:
      "Singapore's cross-border transfer rule turns on comparable protection, and the PDPC guidance explains concrete mechanisms that can satisfy that requirement.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because it explains the compliance mechanisms used to permit transfers subject to comparable-protection safeguards.",
    mappingRationale:
      "This source complements the Transfer Limitation Obligation by showing how the condition may be met in practice.",
    riskImplication:
      "Final advice should cite the exact mechanism relied on, such as contractual obligations, binding corporate rules, or recognized certification.",
    excerptHints: [
      "Transfer Limitation Obligation",
      "comparable to the protection under the PDPA",
      "binding corporate rules",
      "legally enforceable obligations"
    ]
  },
  {
    id: "JPN-PPC-001",
    country: "Japan",
    title: "PPC Guideline on Provision to a Foreign Third Party",
    citation: "PPC Guideline on the APPI, provision to a foreign third party",
    sourceUrl: JAPAN_THIRD_PARTY_GUIDELINE_URL,
    sourceType: "Regulator Guidance",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["Japan", "PPC", "foreign third party", "consent", "APPI"],
    confidence: 0.89,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official PPC guidance for cross-border provision of personal data to a foreign third party. Use it to surface the decisive consent-based rule and its exceptions.",
    excerptFallback:
      "A business operator handling personal information that provides personal data to a third party located in a foreign country must, except where an exception applies, obtain the principal's consent to such provision in advance.",
    originalTextFallback:
      "PPC Guideline on Provision to a Foreign Third Party. The guidance explains how APPI Article 28 applies when personal data is provided to a third party located in a foreign country.",
    aiExtractionFallback:
      "Japan treats cross-border transfer as a conditional-flow issue centered on advance consent or a recognized alternative basis when personal data is provided to a foreign third party.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the transfer is permitted, but only when the operator satisfies the consent rule or another authorized pathway.",
    mappingRationale:
      "This is Japan's core regulator-issued guidance on the foreign-third-party transfer rule under the APPI.",
    riskImplication:
      "The decisive review question is whether the transfer relies on valid prior consent or another route permitted under the APPI framework.",
    excerptHints: [
      "外国にある第三者",
      "法第28条第1項",
      "本人の同意"
    ]
  },
  {
    id: "JPN-PPC-002",
    country: "Japan",
    title: "PPC Offshore Transfer Guideline",
    citation: "PPC Guideline on provision to a person in a foreign country",
    sourceUrl: JAPAN_OFFSHORE_GUIDELINE_URL,
    sourceType: "Regulator Guidance",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["Japan", "PPC", "equivalent standards", "offshore transfer", "APPI"],
    confidence: 0.83,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official PPC offshore-transfer guidance. Use it to identify the pathways based on equivalent foreign systems or continuous protective measures.",
    excerptFallback:
      "The guideline addresses consent for provision to a foreign third party, countries recognized as having a system at an equivalent level of protection, and standards for continuous protective measures.",
    originalTextFallback:
      "PPC Offshore Transfer Guideline. The guidance explains the APPI framework for cross-border provision, including consent, recognized equivalent foreign systems, and standards for continuous protective measures.",
    aiExtractionFallback:
      "Japan's offshore-transfer framework is conditional rather than prohibition-based; it looks to consent, recognized equivalent systems, or continuing protective measures.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because it identifies the legal conditions under which overseas provision is allowed.",
    mappingRationale:
      "This guidance is directly tailored to provision to persons in foreign countries and is therefore highly relevant to Pillar 6 transfer analysis.",
    riskImplication:
      "Reviewers should verify which pathway is being used in the case at hand and cite the exact sentence that matches that pathway.",
    excerptHints: [
      "外国にある第三者への提供",
      "同等の水準",
      "継続的に講ずるために必要な体制の基準"
    ]
  },
  {
    id: "EU-GDPR-001",
    country: "European Union",
    title: "GDPR Article 44 General Principle for Transfers",
    citation: "GDPR Chapter V, Article 44",
    sourceUrl: EU_GDPR_URL,
    sourceType: "Statute",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["European Union", "GDPR", "Article 44", "third countries", "transfers"],
    confidence: 0.93,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Primary EU legal text for cross-border transfers. This is the anchor provision stating that transfers to third countries must comply with Chapter V conditions.",
    excerptFallback:
      "Any transfer of personal data to a third country or to an international organisation shall take place only if the conditions laid down in Chapter V are complied with by the controller and processor.",
    originalTextFallback:
      "Regulation (EU) 2016/679, Chapter V, Article 44. The GDPR permits transfers to third countries or international organisations only if the Chapter V conditions are met.",
    aiExtractionFallback:
      "The EU does not ban cross-border transfers outright, but it conditions them on compliance with GDPR Chapter V.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the decisive legal rule is a conditional permission to transfer, not a free-flow rule.",
    mappingRationale:
      "Article 44 is the general transfer principle and is the starting point for any EU cross-border transfer analysis.",
    riskImplication:
      "Final legal advice should identify which Chapter V mechanism the controller or processor is relying on, because Article 44 alone states the gate but not the specific pathway.",
    excerptHints: [
      "Article 44",
      "General principle for transfers",
      "Any transfer of personal data"
    ]
  },
  {
    id: "EU-GDPR-002",
    country: "European Union",
    title: "GDPR Article 46 Transfers Subject to Appropriate Safeguards",
    citation: "GDPR Chapter V, Article 46",
    sourceUrl: EU_GDPR_URL,
    sourceType: "Statute",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["European Union", "GDPR", "Article 46", "appropriate safeguards", "SCCs"],
    confidence: 0.9,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Primary EU legal text identifying an important Chapter V transfer pathway based on appropriate safeguards.",
    excerptFallback:
      "In the absence of an adequacy decision, a controller or processor may transfer personal data to a third country only if appropriate safeguards are provided and enforceable data subject rights and effective legal remedies are available.",
    originalTextFallback:
      "Regulation (EU) 2016/679, Chapter V, Article 46. This provision allows transfer in the absence of an adequacy decision if appropriate safeguards and enforceable rights are present.",
    aiExtractionFallback:
      "For many EU transfer analyses, Article 46 supplies the decisive legal mechanism because it permits transfer based on appropriate safeguards rather than adequacy.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because it describes a specific conditional transfer pathway built on safeguards.",
    mappingRationale:
      "Article 46 is one of the core legal mechanisms lawyers use to justify EU outbound transfers.",
    riskImplication:
      "A reviewer should identify the exact safeguard used in the transaction, such as standard contractual clauses or another recognized mechanism.",
    excerptHints: [
      "Article 46",
      "appropriate safeguards",
      "enforceable data subject rights and effective legal remedies"
    ]
  },
  {
    id: "USA-COMMERCE-001",
    country: "United States",
    title: "U.S. Data Privacy Framework Program Launch",
    citation: "U.S. Department of Commerce, Data Privacy Framework program launch",
    sourceUrl: US_DPF_LAUNCH_URL,
    sourceType: "Policy Notice",
    indicator: "Binding commitments on data transfer",
    indicatorCode: "P6_5_BINDING_COMMITMENT",
    discoveryTags: ["United States", "Department of Commerce", "Data Privacy Framework", "EU-U.S."],
    confidence: 0.8,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official Department of Commerce explanation of the Data Privacy Framework as a mechanism that supports cross-border personal-data transfers into the United States.",
    excerptFallback:
      "U.S. companies can self-certify their compliance with the EU-U.S. Data Privacy Framework Principles to participate in cross-border transfers of personal data.",
    originalTextFallback:
      "U.S. Department of Commerce press release. The Data Privacy Framework program enables eligible U.S. companies to self-certify under the EU-U.S. framework to support personal-data transfers from Europe.",
    aiExtractionFallback:
      "For U.S.-related transfer analysis, the official federal posture is more facilitative than restrictive in this source set, because the Department of Commerce highlights a recognized transfer mechanism rather than a domestic transfer ban.",
    pillar6Mapping:
      "Maps to Binding commitments on data transfer because the source describes a framework-based transfer mechanism built around formal commitments and certification.",
    mappingRationale:
      "This official notice is directly relevant when the legal question concerns whether a U.S. recipient can rely on a recognized transfer mechanism.",
    riskImplication:
      "Final advice should still confirm whether the recipient actually participates in the relevant framework, but this source supports a lower-friction posture than a strict localization regime.",
    excerptHints: [
      "self-certify",
      "EU-U.S. Data Privacy Framework",
      "cross-border transfers of personal data"
    ]
  },
  {
    id: "USA-COMMERCE-002",
    country: "United States",
    title: "Commerce Cross-Border Data Flows Legal Resources",
    citation: "U.S. Department of Commerce, Cross-Border Data Flows Links and Resource",
    sourceUrl: US_CROSS_BORDER_RESOURCE_URL,
    sourceType: "Regulator Guidance",
    indicator: "Binding commitments on data transfer",
    indicatorCode: "P6_5_BINDING_COMMITMENT",
    discoveryTags: ["United States", "Commerce", "cross-border data flows", "legal resources", "DPF"],
    confidence: 0.74,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Official U.S. government resource page collecting legal materials and mechanisms relevant to cross-border data flows.",
    excerptFallback:
      "The Office of the Chief Counsel for International Commerce provides legal support for programs that promote and maintain cross-border data flows, including the EU-U.S. Data Privacy Framework and the Global Cross Border Privacy Rules system.",
    originalTextFallback:
      "U.S. Department of Commerce resource page. It collects legal materials and official mechanisms related to cross-border data flows, including the EU-U.S. Data Privacy Framework and Global CBPR resources.",
    aiExtractionFallback:
      "Within the present official-source registry, the United States is represented more by federal transfer mechanisms and resource frameworks than by a single omnibus outbound-transfer statute.",
    pillar6Mapping:
      "Maps to Binding commitments on data transfer because it points to government-recognized frameworks supporting lawful cross-border data flows.",
    mappingRationale:
      "This source is useful when the legal analysis needs to explain why U.S. evidence in this workflow is framework-oriented rather than based on a single broad national transfer prohibition.",
    riskImplication:
      "Reviewers should pair this source with the specific framework or sectoral rule relevant to the transaction, because the page itself is a resource hub rather than a standalone transfer rule.",
    excerptHints: [
      "cross-border data flows",
      "EU-U.S. Data Privacy Framework",
      "Global Cross Border Privacy Rules"
    ]
  }
];

export function getCuratedSourcesForCountries(countries: SupportedCountry[]) {
  const countrySet = new Set(countries);
  return curatedSourceRegistry.filter((record) => countrySet.has(record.country));
}
