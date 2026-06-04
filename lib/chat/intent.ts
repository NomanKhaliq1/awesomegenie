export type ChatIntent =
  | "service_question"
  | "project_request"
  | "contact_request"
  | "irrelevant"
  | "unknown";

const serviceTerms = [
  "encompass",
  "mismo",
  "mortgage",
  "loan officer",
  "los",
  "power bi",
  "dashboard",
  "sharepoint",
  "automation",
  "integration",
  "website",
  "calculator",
  "reporting"
];

const projectTerms = [
  "i need",
  "we need",
  "build",
  "develop",
  "create",
  "quote",
  "proposal",
  "estimate",
  "project",
  "hire",
  "consultation"
];

const contactTerms = ["contact", "email", "phone", "call", "reach", "talk to", "schedule"];
const irrelevantTerms = ["weather", "recipe", "movie", "song", "lyrics", "sports score"];

export function classifyChatIntent(message: string): ChatIntent {
  const text = message.toLowerCase();
  const asksCapability = /^(do|does|can|could|will|would)\s+(you|awesometech|awesome tech)\b/.test(text);
  const asksForHelp = /^can\s+you\s+help\b/.test(text);
  const asksForProject = /\b(?:i|we)\s+(?:also\s+)?need\b/.test(text);

  if (containsAny(text, irrelevantTerms)) {
    return "irrelevant";
  }

  if (containsAny(text, contactTerms)) {
    return "contact_request";
  }

  if (asksForHelp && containsAny(text, serviceTerms)) {
    return "project_request";
  }

  if (asksCapability && containsAny(text, serviceTerms)) {
    return "service_question";
  }

  if ((asksForProject || containsAny(text, projectTerms)) && containsAny(text, serviceTerms)) {
    return "project_request";
  }

  if (containsAny(text, serviceTerms)) {
    return "service_question";
  }

  if (containsAny(text, projectTerms)) {
    return "project_request";
  }

  return "unknown";
}

export function buildNoContextResponse(intent: ChatIntent) {
  return buildNoContextResponseForMessage(intent, "");
}

export function buildNoContextResponseForMessage(intent: ChatIntent, message: string) {
  const serviceArea = inferServiceArea(message);

  if (intent === "project_request") {
    if (serviceArea) {
      return `I can help collect the details for your ${serviceArea} request. Please share your current system, the workflow you want to improve, and any deadline or integration requirements.`;
    }

    return "I can help collect the details for your project. Please share the service area, what you want to build or automate, and any systems that need to be connected.";
  }

  if (intent === "contact_request") {
    return "You can contact AwesomeTech through the contact page. Share your name, email, and project details so the team can follow up.";
  }

  if (intent === "irrelevant") {
    return "I can help with AwesomeTech services, integrations, dashboards, websites, automation, and project requirements. Please ask about one of those areas.";
  }

  if (serviceArea) {
    return `I do not have an approved knowledge source for ${serviceArea} yet. Please share a few details about what you need, and the AwesomeTech team can review the request.`;
  }

  return "I do not have an approved AwesomeTech knowledge source for that yet. Please share a few details or contact AwesomeTech, and the team can review your request.";
}

export function buildProjectAcknowledgement(message: string) {
  const serviceArea = inferServiceArea(message);

  if (serviceArea) {
    return `Yes, we can help with ${serviceArea}. I can collect the key details now so the AwesomeTech team has the right context.`;
  }

  return "Yes, we can help collect the project details now so the AwesomeTech team has the right context.";
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function inferServiceArea(message: string) {
  const text = message.toLowerCase();

  if (text.includes("encompass")) return "Encompass automation";
  if (text.includes("mismo")) return "MISMO integration";
  if (text.includes("power bi") || text.includes("dashboard")) return "Power BI dashboard";
  if (text.includes("mortgage") && text.includes("website")) return "mortgage website";
  if (text.includes("mortgage")) return "mortgage technology";
  if (text.includes("sharepoint")) return "SharePoint";
  if (text.includes("automation")) return "automation";
  if (text.includes("integration")) return "integration";
  if (text.includes("website")) return "website";

  return "";
}

export function inferServiceCategorySlug(message: string) {
  const text = message.toLowerCase();

  if (text.includes("mismo")) return "mismo_integration";
  if (text.includes("encompass")) return "encompass_integration";
  if (text.includes("bytepro")) return "bytepro_integration";
  if (text.includes("meridianlink")) return "meridianlink_integration";
  if (text.includes("power bi") || text.includes("dashboard") || text.includes("reporting")) return "power_bi_reporting";
  if (text.includes("mortgage") && text.includes("website")) return "mortgage_website_development";
  if (text.includes("mortgage") || text.includes("los")) return "mortgage_automation";
  if (text.includes("sharepoint")) return "sharepoint_services";
  if (text.includes("salesforce")) return "salesforce_development";
  if (text.includes("automation") || text.includes("integration")) return "custom_software_development";

  return "other";
}
