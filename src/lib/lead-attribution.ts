type LeadAttributionInput = {
  message?: string | null;
  websiteName: string;
  sourcePage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

function labelledValue(message: string, label: string) {
  return message.match(new RegExp(`^${label}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? null;
}

function removeAttributionLines(message: string) {
  return message
    .split(/\r?\n/)
    .filter((line) => !/^(?:First source|Conversion source|Landing page|Google Ads click ID):/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sourceParts(value: string | null) {
  const parts = value?.split("/").map((part) => part.trim()).filter(Boolean) ?? [];
  return { source: parts[0] ?? null, medium: parts[1] ?? null, campaign: parts[2] ?? null };
}

export function getLeadAttribution(input: LeadAttributionInput) {
  const message = input.message?.trim() ?? "";
  const firstSource = labelledValue(message, "First source");
  const conversionSource = labelledValue(message, "Conversion source");
  const landingPage = input.sourcePage ?? labelledValue(message, "Landing page");
  const googleClickId = labelledValue(message, "Google Ads click ID");
  const parsed = sourceParts(firstSource ?? conversionSource);
  const utmSource = input.utmSource ?? parsed.source;
  const utmMedium = input.utmMedium ?? parsed.medium;
  const utmCampaign = input.utmCampaign ?? parsed.campaign;
  const isGoogleAds =
    /google/i.test(utmSource ?? "") && /^(?:cpc|ppc|paid|pmax)$/i.test(utmMedium ?? "");

  return {
    message: removeAttributionLines(message) || null,
    primarySource: isGoogleAds ? "Google Ads" : (utmSource ?? input.websiteName),
    receivingWebsite: input.websiteName,
    utmSource,
    utmMedium,
    utmCampaign,
    landingPage,
    googleClickId,
  };
}

