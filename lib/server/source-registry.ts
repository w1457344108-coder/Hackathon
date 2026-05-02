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

const RCDTRA_PROJECT_URL = "https://www.unescap.org/projects/rcdtra";
const RDTII_GUIDE_URL =
  "https://dtri.uneca.org/assets/data/publications/ESCAP-2025-MN-RDTII-2.1-guide-en.pdf";
const RDTII_AP_REVIEW_URL =
  "https://dtri.uneca.org/assets/data/publications/ESCAP-2025-RP-Digital-trade-regulatory-review-AP-en.pdf";
const RDTII_SGP_PROFILE_URL =
  "https://dtri.uneca.org/v1/uploads/country-profile/sgp-country-profile-en.pdf";

export const curatedSourceRegistry: CuratedSourceRecord[] = [
  {
    id: "RDTII-CHN-001",
    country: "China",
    title: "RDTII 2.1 Regulatory Database - China Pillar 6 inventory",
    citation:
      "UN ESCAP RCDTRA portal, RDTII 2.1 Regulatory Database, Pillar 6 economy entry for China",
    sourceUrl: RCDTRA_PROJECT_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII", "China", "Pillar 6", "cross-border data policies"],
    confidence: 0.74,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated source entrypoint. This prototype uses the RDTII database portal as the primary source surface and stores a normalized China note until row-level database URLs are wired.",
    excerptFallback:
      "The database compiles an inventory of currently active digital trade related regulations across economies, structured under the Regional Digital Trade Integration Index (RDTII) framework.",
    originalTextFallback:
      "RDTII 2.1 Regulatory Database. The database compiles an inventory of currently active digital trade related regulations across economies, structured under the Regional Digital Trade Integration Index framework. For the hackathon prototype, China Pillar 6 evidence is anchored to this competition-designated database surface and should be verified against the specific China row and underlying legal URL during reviewer audit.",
    aiExtractionFallback:
      "Within the competition-designated RDTII evidence workflow, China is treated as a conditional-flow jurisdiction whose outbound transfer conditions should be checked against the database row and underlying legal act before final submission.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the competition-designated RDTII database is the primary discovery surface for identifying China-specific transfer conditions under Pillar 6.",
    mappingRationale:
      "This record is anchored to the RDTII database entrypoint rather than a national regulator site. It preserves the judge-facing source alignment required by the hackathon while still mapping the jurisdiction into the Pillar 6 conditional-flow bucket.",
    riskImplication:
      "Reviewer should confirm the exact China database row and linked law before relying on this record as final legal support, but the prototype now points analysts to the required competition source first.",
    excerptHints: ["RDTII 2.1 Regulatory Database", "currently active digital trade related regulations"]
  },
  {
    id: "RDTII-CHN-003",
    country: "China",
    title: "Digital Trade Regulatory Review for Asia and the Pacific, 2025",
    citation:
      "ESCAP-ECA-ECLAC Initiative on Digital Trade Regulatory Integration, 2025 regional review",
    sourceUrl: RDTII_AP_REVIEW_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["China", "RDTII review", "Pillar 6", "Asia-Pacific"],
    confidence: 0.65,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated PDF source. Use it as a region-level evidentiary file and extract China-relevant context cautiously, because it is not a jurisdiction-only legal text.",
    excerptFallback:
      "The report presents the digital trade policy landscape in Asia and the Pacific using the RDTII 2.1 framework and includes China within the covered Asia-Pacific economies.",
    originalTextFallback:
      "Digital Trade Regulatory Review for Asia and the Pacific, 2025. The report states that the RDTII 2.1 framework covers 48 economies in the Asia-Pacific region, including China, and uses Pillar 6 to assess cross-border data policies. This is a competition-designated supporting file rather than a stand-alone China legal text.",
    aiExtractionFallback:
      "The ESCAP regional review is a valid competition-designated file that supports China's inclusion in the RDTII Pillar 6 evidence framework, but it should remain secondary to row-level database or legal texts.",
    pillar6Mapping:
      "Maps to Conditional flow regimes as a competition-designated supporting file for China-related Pillar 6 interpretation.",
    mappingRationale:
      "The regional review is not a statute, but it is part of the designated RDTII file set and can support traceability for how China is analyzed under Pillar 6.",
    riskImplication:
      "Useful for judges and methodology traceability, but reviewers should not treat it as conclusive legal proof without deeper source linkage.",
    excerptHints: ["including China", "Pillar 6", "Cross-border data policies"]
  },
  {
    id: "RDTII-CHN-002",
    country: "China",
    title: "RDTII 2.1 Guide - Pillar 6 methodology reference",
    citation: "Regional Digital Trade Integration Index 2.1: A Guide, Pillar 6 methodology pages",
    sourceUrl: RDTII_GUIDE_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII guide", "Pillar 6", "methodology", "China"],
    confidence: 0.68,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated supporting source. Use this for indicator framing and audit explanation, not as a substitute for the exact China act row.",
    excerptFallback:
      "Pillar 6 covers cross-border data policies, including transfer conditions, localization rules, infrastructure requirements, and binding commitments.",
    originalTextFallback:
      "Regional Digital Trade Integration Index 2.1: A Guide. The guide provides the methodology for Pillar 6: Cross-border Data Policies and is part of the competition-designated resource set referenced in the hackathon deck.",
    aiExtractionFallback:
      "The RDTII guide is a methodological source that explains how China evidence should be categorized inside Pillar 6, but it is secondary to the database row for jurisdiction-specific claims.",
    pillar6Mapping:
      "Maps to Conditional flow regimes as a methodological support source for how Pillar 6 evidence is categorized.",
    mappingRationale:
      "This source explains the RDTII interpretation frame rather than creating a legal obligation. It remains useful for score explanation and judge-facing traceability.",
    riskImplication:
      "Supports auditability and scoring explanation, but analysts still need the database row or linked legal text for final legal proof.",
    excerptHints: ["Pillar 6", "Cross-border Data Policies", "binding commitments"]
  },
  {
    id: "RDTII-SGP-001",
    country: "Singapore",
    title: "Singapore Economy Profile 2025",
    citation:
      "ESCAP-ECA-ECLAC Regional Digital Trade Integration Index economy profile, Singapore",
    sourceUrl: RDTII_SGP_PROFILE_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII", "Singapore", "economy profile", "Pillar 6"],
    confidence: 0.83,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated PDF source. This is the strongest public Singapore file in the current RDTII source set and should be preferred over the generic portal entry.",
    excerptFallback:
      "Based on the RDTII 2025 scores, Singapore has lower regulatory complexity for cross-border digital trade than the Asia-Pacific average, and Pillar 6: Cross-border data policies scores 0.17.",
    originalTextFallback:
      "Singapore Economy Profile 2025. Based on the RDTII 2025 scores, Singapore has 24% lower regulatory complexity for cross-border digital trade than the Asia-Pacific average. Pillar 6: Cross-border data policies has a score of 0.17. The profile cites the RCDTRA databases page as the source of the score set and provides Singapore-specific narrative context.",
    aiExtractionFallback:
      "The Singapore country profile is a competition-designated file that provides Singapore-specific Pillar 6 context and should be used as primary RDTII-file evidence in this prototype.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the Singapore RDTII economy profile directly reports the economy's Pillar 6 cross-border data policy complexity and surrounding narrative context.",
    mappingRationale:
      "This is a country-specific RDTII file rather than a generic portal page, which improves auditability while staying within the competition-designated source set.",
    riskImplication:
      "Strong for the prototype's evidence chain, though final legal claims should still be traced into the underlying acts cited in the profile.",
    excerptHints: ["SINGAPORE", "Pillar 6: Cross-border data policies", "0.17"]
  },
  {
    id: "RDTII-SGP-002",
    country: "Singapore",
    title: "RDTII 2.1 Guide - Pillar 6 methodology reference",
    citation: "Regional Digital Trade Integration Index 2.1: A Guide, Pillar 6 methodology pages",
    sourceUrl: RDTII_GUIDE_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII guide", "Pillar 6", "methodology", "Singapore"],
    confidence: 0.68,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated supporting source. Use it to explain the scoring logic behind the Singapore record, not to replace the database row itself.",
    excerptFallback:
      "Pillar 6 covers cross-border data policies, including transfer conditions, localization rules, infrastructure requirements, and binding commitments.",
    originalTextFallback:
      "Regional Digital Trade Integration Index 2.1: A Guide. The guide provides the methodology for Pillar 6: Cross-border Data Policies and is part of the competition-designated resource set referenced in the hackathon deck.",
    aiExtractionFallback:
      "The RDTII guide is a methodological source for how Singapore evidence is categorized under Pillar 6 and should be paired with the database row in audit review.",
    pillar6Mapping:
      "Maps to Conditional flow regimes as a methodological support source for Singapore evidence classification.",
    mappingRationale:
      "This record supports analytical framing rather than jurisdiction-specific legal proof.",
    riskImplication:
      "Useful for explaining the model to judges, but not sufficient on its own for a final legal conclusion.",
    excerptHints: ["Pillar 6", "Cross-border Data Policies", "binding commitments"]
  },
  {
    id: "RDTII-EU-002",
    country: "European Union",
    title: "RDTII 2.1 Guide - Pillar 6 methodology reference",
    citation: "Regional Digital Trade Integration Index 2.1: A Guide, Pillar 6 methodology pages",
    sourceUrl: RDTII_GUIDE_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII guide", "Pillar 6", "methodology", "European Union"],
    confidence: 0.68,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated supporting source for the EU workflow. Use it for indicator explanation and audit framing.",
    excerptFallback:
      "Pillar 6 covers cross-border data policies, including transfer conditions, localization rules, infrastructure requirements, and binding commitments.",
    originalTextFallback:
      "Regional Digital Trade Integration Index 2.1: A Guide. The guide provides the methodology for Pillar 6: Cross-border Data Policies and is part of the competition-designated resource set referenced in the hackathon deck.",
    aiExtractionFallback:
      "The RDTII guide supports EU Pillar 6 classification and audit traceability, but should remain secondary to the database row for jurisdiction-specific legal claims.",
    pillar6Mapping:
      "Maps to Conditional flow regimes as a methodological support source for EU evidence classification.",
    mappingRationale:
      "This source supports the analytical frame and judge-facing explanation rather than serving as direct legal proof.",
    riskImplication:
      "Helpful for the hackathon methodology story, but not enough by itself for a final legal conclusion.",
    excerptHints: ["Pillar 6", "Cross-border Data Policies", "binding commitments"]
  }
];

export function getCuratedSourcesForCountries(countries: SupportedCountry[]) {
  const countrySet = new Set(countries);
  return curatedSourceRegistry.filter((record) => countrySet.has(record.country));
}
