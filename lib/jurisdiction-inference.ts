import type { SupportedCountry } from "@/lib/types";

export const supportedCountries: SupportedCountry[] = [
  "China",
  "Singapore",
  "Japan",
  "European Union"
];

const supportedCountryAliases: Array<{
  country: SupportedCountry;
  patterns: RegExp[];
}> = [
  {
    country: "China",
    patterns: [/\bchina\b/i, /\bprc\b/i, /\bmainland china\b/i, /中国/]
  },
  {
    country: "Singapore",
    patterns: [/\bsingapore\b/i, /新加坡/]
  },
  {
    country: "Japan",
    patterns: [/\bjapan\b/i, /日本/]
  },
  {
    country: "European Union",
    patterns: [/\beuropean union\b/i, /\beu\b/i, /欧盟/, /欧洲/]
  }
];

const unsupportedJurisdictionAliases: Array<{
  label: string;
  patterns: RegExp[];
}> = [
  { label: "Vietnam", patterns: [/\bvietnam\b/i, /越南/] },
  { label: "India", patterns: [/\bindia\b/i, /印度/] },
  { label: "Indonesia", patterns: [/\bindonesia\b/i, /印度尼西亚|印尼/] },
  { label: "Thailand", patterns: [/\bthailand\b/i, /泰国/] },
  { label: "Malaysia", patterns: [/\bmalaysia\b/i, /马来西亚/] },
  { label: "South Korea", patterns: [/\bsouth korea\b/i, /\bkorea\b/i, /韩国/] },
  { label: "Philippines", patterns: [/\bphilippines\b/i, /菲律宾/] },
  { label: "United States", patterns: [/\bunited states\b/i, /\bu\.s\.\b/i, /\busa\b/i, /\bus\b/i, /美国/] }
];

export function inferCountries(question: string): {
  countryA: SupportedCountry;
  countryB: SupportedCountry | null;
} {
  const matchedCountries = supportedCountryAliases
    .filter((entry) => entry.patterns.some((pattern) => pattern.test(question)))
    .map((entry) => entry.country);

  return {
    countryA: matchedCountries[0] ?? "China",
    countryB: matchedCountries[1] ?? null
  };
}

export function detectUnsupportedJurisdictions(question: string) {
  return unsupportedJurisdictionAliases
    .filter((entry) => entry.patterns.some((pattern) => pattern.test(question)))
    .map((entry) => entry.label);
}
