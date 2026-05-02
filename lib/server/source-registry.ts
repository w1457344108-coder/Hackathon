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
    title: "RDTII 2.1 Regulatory Database - Singapore Pillar 6 inventory",
    citation:
      "UN ESCAP RCDTRA portal, RDTII 2.1 Regulatory Database, Pillar 6 economy entry for Singapore",
    sourceUrl: RCDTRA_PROJECT_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII", "Singapore", "Pillar 6", "cross-border data policies"],
    confidence: 0.76,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated source entrypoint. The prototype uses the RDTII database surface first and stores a normalized Singapore note until row-level row capture is automated.",
    excerptFallback:
      "The database compiles an inventory of currently active digital trade related regulations across economies, structured under the Regional Digital Trade Integration Index (RDTII) framework.",
    originalTextFallback:
      "RDTII 2.1 Regulatory Database. The database compiles an inventory of currently active digital trade related regulations across economies, structured under the Regional Digital Trade Integration Index framework. For the hackathon prototype, Singapore Pillar 6 evidence is anchored to this competition-designated database surface and should be verified against the specific Singapore row and underlying legal URL during reviewer audit.",
    aiExtractionFallback:
      "Within the competition-designated RDTII workflow, Singapore is treated as an open-but-conditional transfer regime whose safeguards should be checked against the database row and linked legal instrument during final review.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the competition-designated RDTII database is the first-stop discovery layer for Singapore transfer safeguards under Pillar 6.",
    mappingRationale:
      "This record intentionally prioritizes the RDTII database entrypoint required by the hackathon instead of a national regulator site, while still preserving a conditional-flow interpretation for Singapore.",
    riskImplication:
      "Good for hackathon traceability, but reviewers should still inspect the underlying Singapore act or database URL1 before approving export.",
    excerptHints: ["RDTII 2.1 Regulatory Database", "currently active digital trade related regulations"]
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
    id: "RDTII-EU-001",
    country: "European Union",
    title: "RDTII 2.1 Regulatory Database - European Union Pillar 6 inventory",
    citation:
      "UN ESCAP RCDTRA portal, RDTII 2.1 Regulatory Database, Pillar 6 economy entry for the European Union",
    sourceUrl: RCDTRA_PROJECT_URL,
    sourceType: "Official Portal",
    indicator: "Conditional flow regimes",
    indicatorCode: "P6_4_CONDITIONAL_FLOW",
    discoveryTags: ["RDTII", "European Union", "Pillar 6", "cross-border data policies"],
    confidence: 0.78,
    reviewStatus: "Pending Review",
    reviewerNote:
      "Competition-designated source entrypoint. The prototype now aligns EU evidence to the RDTII database surface before any deeper legal validation.",
    excerptFallback:
      "The database compiles an inventory of currently active digital trade related regulations across economies, structured under the Regional Digital Trade Integration Index (RDTII) framework.",
    originalTextFallback:
      "RDTII 2.1 Regulatory Database. The database compiles an inventory of currently active digital trade related regulations across economies, structured under the Regional Digital Trade Integration Index framework. For the hackathon prototype, European Union Pillar 6 evidence is anchored to this competition-designated database surface and should be verified against the specific EU row and underlying legal URL during reviewer audit.",
    aiExtractionFallback:
      "Within the competition-designated RDTII workflow, the European Union is treated as a conditional-flow jurisdiction whose transfer mechanisms should be confirmed against the database row and linked legal source before final export.",
    pillar6Mapping:
      "Maps to Conditional flow regimes because the RDTII database is the required discovery surface for EU Pillar 6 transfer controls in this prototype.",
    mappingRationale:
      "The hackathon prototype now prioritizes the competition-specified RDTII portal, while keeping the EU's Pillar 6 categorization in the conditional-flow bucket.",
    riskImplication:
      "Strong for competition alignment, but reviewers should still inspect the exact EU database row and linked legal instrument during final QA.",
    excerptHints: ["RDTII 2.1 Regulatory Database", "currently active digital trade related regulations"]
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
