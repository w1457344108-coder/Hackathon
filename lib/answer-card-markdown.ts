export type AnswerCardKind =
  | "direct-answer"
  | "snapshot"
  | "evidence"
  | "explanation"
  | "assessment"
  | "linkage"
  | "impact"
  | "review-notes"
  | "summary"
  | "indicators"
  | "findings"
  | "roadmap";

export interface AnswerCardItem {
  label: string;
  value: string;
}

export interface AnswerCard {
  title: string;
  kind: AnswerCardKind;
  body: string[];
  badges?: string[];
  items?: AnswerCardItem[];
  children?: string[];
  sourceUrl?: string;
}

export type AnswerDetailTone =
  | "finding"
  | "risk"
  | "law"
  | "action"
  | "source"
  | "conflict"
  | "indicator"
  | "context"
  | "default";

export interface FindingHighlightOptions {
  finding: boolean;
  risk: boolean;
  action: boolean;
  conflict: boolean;
  law: boolean;
  indicator: boolean;
  context: boolean;
}

interface ParsedSection {
  title: string;
  lines: string[];
}

export function parseAnswerCardMarkdown(content: string): AnswerCard[] {
  const sections = splitNumberedSections(content);

  if (!sections.length) {
    return [];
  }

  const cards = sections
    .map((section) => buildAnswerCard(section, content))
    .filter((card): card is AnswerCard => Boolean(card));

  if (!cards.length || !cards.some((card) => card.kind === "direct-answer")) {
    return [];
  }

  return cards;
}

function splitNumberedSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const headingMatch = line.match(/^\s*\d+\.\s+(.+?)\s*$/);

    if (headingMatch) {
      current = {
        title: headingMatch[1].trim(),
        lines: []
      };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  return sections;
}

function buildAnswerCard(section: ParsedSection, fullContent: string): AnswerCard | null {
  const kind = getSectionKind(section.title);

  if (!kind) {
    return null;
  }

  const parsed = parseSectionLines(section.lines);
  const card: AnswerCard = {
    title: section.title,
    kind,
    body: parsed.body,
    items: parsed.items,
    children: parsed.children,
    sourceUrl: parsed.sourceUrl
  };

  if (kind === "direct-answer") {
    card.badges = inferDirectAnswerBadges(fullContent);
  }

  return card;
}

function getSectionKind(title: string): AnswerCardKind | null {
  const normalized = normalizeTitle(title);

  if (normalized === "direct answer") {
    return "direct-answer";
  }

  if (normalized.includes("snapshot")) {
    return "snapshot";
  }

  if (normalized === "evidence passage" || normalized === "evidence") {
    return "evidence";
  }

  if (normalized === "plain-language explanation") {
    return "explanation";
  }

  if (normalized.includes("assessment")) {
    return "assessment";
  }

  if (normalized.includes("linkage")) {
    return "linkage";
  }

  if (normalized.includes("compliance impact")) {
    return "impact";
  }

  if (normalized.includes("human review")) {
    return "review-notes";
  }

  if (normalized.includes("export-ready summary")) {
    return "summary";
  }

  if (normalized.includes("selected indicators")) {
    return "indicators";
  }

  if (normalized.includes("non-compliance")) {
    return "findings";
  }

  if (normalized.includes("roadmap")) {
    return "roadmap";
  }

  return null;
}

function parseSectionLines(lines: string[]) {
  const body: string[] = [];
  const items: AnswerCardItem[] = [];
  const children: string[] = [];
  let sourceUrl: string | undefined;
  let isReadingChildren = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      isReadingChildren = false;
      continue;
    }

    const indentedKeyedLine = rawLine.match(/^\s{2,}([^:]+):\s*(.+?)\s*$/);
    if (indentedKeyedLine) {
      const label = stripBulletMarker(indentedKeyedLine[1].trim());
      const value = indentedKeyedLine[2].trim();

      if (label.toLowerCase() === "url" && /^https?:\/\//.test(value)) {
        sourceUrl = sourceUrl ?? value;
      } else {
        children.push(`${label}: ${value}`);
      }

      continue;
    }

    const indentedEmptyKeyedLine = rawLine.match(/^\s{2,}[-*]\s+([^:]+):\s*$/);
    if (indentedEmptyKeyedLine) {
      children.push(`${indentedEmptyKeyedLine[1].trim()}:`);
      isReadingChildren = true;
      continue;
    }

    const nestedBullet = rawLine.match(/^\s{2,}-\s+(.+?)\s*$/);
    if (nestedBullet) {
      children.push(nestedBullet[1].trim());
      continue;
    }

    const keyedBullet = line.match(/^-\s+([^:]+):\s*(.*)$/);
    if (keyedBullet) {
      const label = keyedBullet[1].trim();
      const value = keyedBullet[2].trim();

      if (label.toLowerCase() === "url") {
        sourceUrl = value;
      } else if (label.toLowerCase() === "key legal conditions") {
        isReadingChildren = true;
        continue;
      } else if (shouldTreatKeyedBulletAsChild(label, value)) {
        children.push(value ? `${label}: ${value}` : `${label}:`);
      } else if (value) {
        items.push({ label, value });
      }

      isReadingChildren = label.toLowerCase() === "key legal conditions" || !value;
      continue;
    }

    const plainBullet = line.match(/^-\s+(.+?)\s*$/);
    if (plainBullet) {
      children.push(plainBullet[1].trim());
      isReadingChildren = false;
      continue;
    }

    body.push(line.trim());
    isReadingChildren = false;
  }

  return {
    body,
    items,
    children,
    sourceUrl
  };
}

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

function inferDirectAnswerBadges(content: string) {
  const normalized = content.toLowerCase();
  const hasP64 =
    normalized.includes("p6:6.4") ||
    normalized.includes("pillar 6, indicator 6.4") ||
    normalized.includes("pillar 6 conditional flow") ||
    normalized.includes("conditional flow regimes") ||
    (normalized.includes("article 38") &&
      normalized.includes("personal information protection law"));
  const hasP71 = normalized.includes("p7:7.1") || normalized.includes("indicator 7.1");
  const hasP74 = normalized.includes("p7:7.4") || normalized.includes("indicator 7.4");

  if (hasP64 && hasP71 && hasP74) {
    return ["P6:6.4", "P7:7.1", "P7:7.4"];
  }

  if (hasP74 && hasP64) {
    return ["P7:7.4", "Linked P6:6.4"];
  }

  if (hasP64) {
    return ["Pillar 6", "Indicator 6.4", "Conditional Flow Regimes"];
  }

  return [];
}

export function classifyAnswerDetail(detail: string): AnswerDetailTone {
  const normalized = detail.trim().toLowerCase();

  if (!normalized) {
    return "default";
  }

  if (/^risk[_-]?\d+:/i.test(detail.trim())) {
    return "finding";
  }

  if (normalized.startsWith("url:") || normalized.startsWith("source url:")) {
    return "source";
  }

  if (
    normalized.startsWith("risk level:") ||
    normalized.includes("high before remediation") ||
    normalized.includes("medium-high")
  ) {
    return "risk";
  }

  if (
    normalized.startsWith("related law:") ||
    normalized.startsWith("cn_") ||
    normalized.includes("article 38") ||
    normalized.includes("article 39") ||
    normalized.includes("article 55") ||
    normalized.includes("article 56")
  ) {
    return "law";
  }

  if (
    normalized.startsWith("possible legal conflict:") ||
    normalized.includes("may conflict") ||
    normalized.includes("non-compliance")
  ) {
    return "conflict";
  }

  if (
    normalized.startsWith("recommended fix:") ||
    normalized.startsWith("priority:") ||
    normalized.startsWith("complete ") ||
    normalized.startsWith("select ") ||
    normalized.startsWith("build ") ||
    normalized.startsWith("prepare ") ||
    normalized.startsWith("define ") ||
    normalized.startsWith("conduct ")
  ) {
    return "action";
  }

  if (
    normalized.startsWith("related rdtii indicators:") ||
    normalized.startsWith("p6:") ||
    normalized.startsWith("p7:")
  ) {
    return "indicator";
  }

  return "default";
}

export function getFindingDetailTone(
  detail: string,
  isWithinRecommendedFix = false,
  highlights: FindingHighlightOptions = {
    finding: true,
    risk: true,
    action: true,
    conflict: false,
    law: false,
    indicator: false,
    context: false
  }
): AnswerDetailTone {
  const trimmed = detail.trim();
  const normalized = trimmed.toLowerCase();

  if (/^risk[_-]?\d+:/i.test(trimmed)) {
    return highlights.finding ? "finding" : "default";
  }

  if (/^risk level:/i.test(trimmed)) {
    return highlights.risk ? "risk" : "default";
  }

  if (/^recommended fix:/i.test(trimmed) || isWithinRecommendedFix) {
    return highlights.action ? "action" : "default";
  }

  if (highlights.conflict && /^possible legal conflict:/i.test(trimmed)) {
    return "conflict";
  }

  if (
    highlights.law &&
    (/^related law:/i.test(trimmed) ||
      /^相关法律[:：]/.test(trimmed) ||
      /^cn_/i.test(trimmed) ||
      normalized.includes("article 38") ||
      normalized.includes("article 39") ||
      normalized.includes("article 55") ||
      normalized.includes("article 56"))
  ) {
    return "law";
  }

  if (highlights.indicator && /^related rdtii indicators:/i.test(trimmed)) {
    return "indicator";
  }

  if (highlights.context && /^why it matters:/i.test(trimmed)) {
    return "context";
  }

  return "default";
}

function stripBulletMarker(value: string) {
  return value.replace(/^[-*]\s+/, "").trim();
}

function shouldTreatKeyedBulletAsChild(label: string, value: string) {
  const normalized = label.toLowerCase();

  return (
    /^risk[_-]?\d+/i.test(label) ||
    normalized.startsWith("phase") ||
    normalized === "recommended fix" ||
    !value
  );
}
