const explicitJobEnquiryPatterns = [
  /\bjob\b/i,
  /\bjob (?:application|enquiry|inquiry|opportunit(?:y|ies)|vacanc(?:y|ies))\b/i,
  /\b(?:apply|applying) (?:for|to) (?:a |any )?(?:job|position|vacancy)\b/i,
  /\b(?:looking|searching) for (?:a |any )?(?:job|work|employment)\b/i,
  /\b(?:send|submit|attached|attach)(?:ing|ed)? (?:my |a )?(?:cv|resume|résumé)\b/i,
  /\b(?:cv|resume|résumé) (?:attached|submission|application)\b/i,
  /\b(?:do you have|are there|any) (?:open )?(?:jobs|vacancies|positions)\b/i,
  /\bcareer (?:enquiry|inquiry|opportunit(?:y|ies)|application)\b/i,
  /\bemployment (?:enquiry|inquiry|application|opportunit(?:y|ies))\b/i,
];

export function detectAutoKillReason(input: {
  message?: string | null;
  sourcePage?: string | null;
}) {
  const message = input.message?.trim() ?? "";
  const sourcePage = input.sourcePage?.toLowerCase() ?? "";

  if (/(?:\/careers?|\/jobs?|\/vacancies?|job-application)/.test(sourcePage)) {
    return "Job or career enquiry detected from source page";
  }
  if (/Landing page:\s*[^\s]*\/(?:careers?|jobs?|vacancies?)(?:[/?#]|$)/i.test(message)) {
    return "Job or career enquiry detected from source page";
  }
  if (explicitJobEnquiryPatterns.some((pattern) => pattern.test(message))) {
    return "Job or career enquiry detected from message";
  }
  return null;
}
