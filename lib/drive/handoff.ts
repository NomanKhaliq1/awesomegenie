import crypto from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type DriveFile = {
  id: string;
  webViewLink?: string;
};

type RequirementRow = {
  id: string;
  client_id: string | null;
  session_id: string | null;
  service_type: string | null;
  requirements_json: Record<string, unknown> | null;
  missing_fields_json: string[] | null;
  completion_score: number | null;
  clients:
    | {
        id: string;
        company_name: string | null;
        email: string | null;
        phone: string | null;
        service_interest: string | null;
        status: string | null;
        drive_folder_id: string | null;
        drive_folder_url: string | null;
      }
    | Array<{
        id: string;
        company_name: string | null;
        email: string | null;
        phone: string | null;
        service_interest: string | null;
        status: string | null;
        drive_folder_id: string | null;
        drive_folder_url: string | null;
      }>
    | null;
};

type ChatMessageRow = {
  role: string;
  message: string | null;
  created_at: string | null;
};

type ClientRow = NonNullable<Exclude<RequirementRow["clients"], unknown[]>>;

export async function createDriveHandoffForRequirement(params: {
  sessionId: string;
  requirementId: string;
}) {
  if (!isDriveConfigured()) {
    await logDriveEvent({
      sessionId: params.sessionId,
      action: "handoff_skipped",
      status: "skipped",
      errorMessage: "Google Drive credentials are not configured."
    });
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const requirement = await loadRequirement(params.requirementId);
  const client = normalizeClient(requirement?.clients || null);

  if (!requirement || !client?.id) {
    return null;
  }

  if (client.drive_folder_id) {
    return {
      folderId: client.drive_folder_id,
      folderUrl: client.drive_folder_url,
      skipped: true
    };
  }

  const existingBrief = await loadExistingBrief(params.sessionId, client.id);

  if (existingBrief?.drive_file_id) {
    return {
      folderId: client.drive_folder_id,
      folderUrl: client.drive_folder_url,
      skipped: true
    };
  }

  const messages = await loadChatTranscript(params.sessionId);
  const handoff = buildHandoffContent({ requirement, client, messages });
  const accessToken = await getGoogleAccessToken();
  const folder = await createDriveFolder(accessToken, handoff.folderName);
  const [briefFile, requirementsFile, transcriptFile] = await Promise.all([
    uploadTextFile(accessToken, folder.id, "project-brief.md", handoff.briefMarkdown, "text/markdown"),
    uploadTextFile(accessToken, folder.id, "requirements.json", JSON.stringify(handoff.briefJson, null, 2), "application/json"),
    uploadTextFile(accessToken, folder.id, "chat-transcript.txt", handoff.transcriptText, "text/plain")
  ]);

  await supabase
    .from("clients")
    .update({
      status: "drive_created",
      drive_folder_id: folder.id,
      drive_folder_url: folder.webViewLink || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", client.id);

  await supabase.from("project_briefs").insert({
    client_id: client.id,
    session_id: params.sessionId,
    brief_title: handoff.title,
    brief_markdown: handoff.briefMarkdown,
    brief_json: handoff.briefJson,
    recommended_services: handoff.briefJson.recommended_services,
    missing_information: handoff.briefJson.missing_information,
    complexity_level: handoff.briefJson.complexity_level,
    risk_level: handoff.briefJson.risk_level,
    next_step: handoff.briefJson.next_step,
    drive_file_id: briefFile.id,
    drive_file_url: briefFile.webViewLink || null
  });

  await Promise.all([
    logDriveEvent({
      clientId: client.id,
      sessionId: params.sessionId,
      action: "create_handoff_folder",
      folderId: folder.id,
      folderUrl: folder.webViewLink,
      status: "success"
    }),
    logDriveEvent({
      clientId: client.id,
      sessionId: params.sessionId,
      action: "upload_project_brief",
      folderId: folder.id,
      fileId: briefFile.id,
      folderUrl: folder.webViewLink,
      fileUrl: briefFile.webViewLink,
      status: "success"
    }),
    logDriveEvent({
      clientId: client.id,
      sessionId: params.sessionId,
      action: "upload_requirements_json",
      folderId: folder.id,
      fileId: requirementsFile.id,
      folderUrl: folder.webViewLink,
      fileUrl: requirementsFile.webViewLink,
      status: "success"
    }),
    logDriveEvent({
      clientId: client.id,
      sessionId: params.sessionId,
      action: "upload_chat_transcript",
      folderId: folder.id,
      fileId: transcriptFile.id,
      folderUrl: folder.webViewLink,
      fileUrl: transcriptFile.webViewLink,
      status: "success"
    })
  ]);

  return {
    folderId: folder.id,
    folderUrl: folder.webViewLink,
    briefFileId: briefFile.id,
    briefFileUrl: briefFile.webViewLink,
    skipped: false
  };
}

function isDriveConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  );
}

async function loadRequirement(requirementId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("client_requirements")
    .select(
      "id,client_id,session_id,service_type,requirements_json,missing_fields_json,completion_score,clients(id,company_name,email,phone,service_interest,status,drive_folder_id,drive_folder_url)"
    )
    .eq("id", requirementId)
    .maybeSingle();

  return (data as RequirementRow | null) || null;
}

async function loadExistingBrief(sessionId: string, clientId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("project_briefs")
    .select("id,drive_file_id,drive_file_url")
    .eq("session_id", sessionId)
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function loadChatTranscript(sessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("role,message,created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (data || []) as ChatMessageRow[];
}

function buildHandoffContent(params: {
  requirement: RequirementRow;
  client: ClientRow;
  messages: ChatMessageRow[];
}) {
  const requirements = params.requirement.requirements_json || {};
  const companyName = stringValue(params.client.company_name) || stringValue(requirements.company_name) || "Unknown Company";
  const serviceType = params.requirement.service_type || params.client.service_interest || "Project";
  const title = `${companyName} - ${serviceType}`;
  const folderName = sanitizeDriveName(title);
  const transcriptText = params.messages
    .map((message) => {
      const timestamp = message.created_at ? new Date(message.created_at).toISOString() : "";
      return `[${timestamp}] ${message.role.toUpperCase()}: ${message.message || ""}`;
    })
    .join("\n\n");
  const missingInformation = Array.isArray(params.requirement.missing_fields_json)
    ? params.requirement.missing_fields_json
    : [];
  const briefJson = {
    title,
    client: {
      company_name: companyName,
      email: params.client.email,
      phone: params.client.phone,
      service_interest: serviceType
    },
    requirements,
    missing_information: missingInformation,
    recommended_services: [serviceType],
    complexity_level: inferComplexity(requirements),
    risk_level: inferRisk(requirements, missingInformation),
    next_step: "Review the captured requirements, confirm scope with the client, and prepare the implementation plan."
  };
  const briefMarkdown = buildBriefMarkdown(briefJson);

  return {
    title,
    folderName,
    transcriptText,
    briefJson,
    briefMarkdown
  };
}

function buildBriefMarkdown(brief: {
  title: string;
  client: Record<string, unknown>;
  requirements: Record<string, unknown>;
  missing_information: string[];
  recommended_services: string[];
  complexity_level: string;
  risk_level: string;
  next_step: string;
}) {
  const requirementLines = Object.entries(brief.requirements)
    .filter(([, value]) => hasValue(value))
    .map(([key, value]) => `- **${labelFromKey(key)}:** ${String(value)}`)
    .join("\n");

  return [
    `# ${brief.title}`,
    "",
    "## Client",
    `- **Company:** ${brief.client.company_name || "Not provided"}`,
    `- **Email:** ${brief.client.email || "Not provided"}`,
    `- **Phone:** ${brief.client.phone || "Not provided"}`,
    `- **Service Interest:** ${brief.client.service_interest || "Not provided"}`,
    "",
    "## Captured Requirements",
    requirementLines || "- No requirement details captured yet.",
    "",
    "## Missing Information",
    brief.missing_information.length
      ? brief.missing_information.map((item) => `- ${labelFromKey(item)}`).join("\n")
      : "- No required fields are missing.",
    "",
    "## Delivery Notes",
    `- **Complexity:** ${brief.complexity_level}`,
    `- **Risk:** ${brief.risk_level}`,
    `- **Next Step:** ${brief.next_step}`
  ].join("\n");
}

async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: process.env.GOOGLE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || ""));
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return String(data.access_token || "");
}

async function createDriveFolder(accessToken: string, name: string): Promise<DriveFile> {
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID]
    })
  });

  if (!response.ok) {
    throw new Error(`Google Drive folder create failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as DriveFile;
}

async function uploadTextFile(
  accessToken: string,
  folderId: string,
  name: string,
  content: string,
  mimeType: string
): Promise<DriveFile> {
  const boundary = `awesome_genie_${crypto.randomUUID()}`;
  const metadata = {
    name,
    mimeType,
    parents: [folderId]
  };
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}; charset=UTF-8`,
    "",
    content,
    `--${boundary}--`
  ].join("\r\n");
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body
    }
  );

  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as DriveFile;
}

async function logDriveEvent(params: {
  clientId?: string;
  sessionId?: string;
  action: string;
  folderId?: string;
  fileId?: string;
  folderUrl?: string;
  fileUrl?: string;
  status: string;
  errorMessage?: string;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("drive_logs").insert({
    client_id: params.clientId || null,
    session_id: params.sessionId || null,
    action: params.action,
    folder_id: params.folderId || null,
    file_id: params.fileId || null,
    folder_url: params.folderUrl || null,
    file_url: params.fileUrl || null,
    status: params.status,
    error_message: params.errorMessage || null
  });
}

function normalizeClient(client: RequirementRow["clients"]) {
  return Array.isArray(client) ? client[0] || null : client;
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sanitizeDriveName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 120);
}

function labelFromKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stringValue(value: unknown) {
  return hasValue(value) ? String(value).trim() : "";
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function inferComplexity(requirements: Record<string, unknown>) {
  const text = JSON.stringify(requirements).toLowerCase();
  const enterpriseTerms = ["multiple", "two-way", "compliance", "mismo", "api", "sdk", "migration"];

  if (enterpriseTerms.filter((term) => text.includes(term)).length >= 3) return "enterprise";
  if (text.includes("integration") || text.includes("sync") || text.includes("automation")) return "medium";
  return "low";
}

function inferRisk(requirements: Record<string, unknown>, missingInformation: string[]) {
  const text = JSON.stringify(requirements).toLowerCase();
  if (missingInformation.length >= 3) return "high";
  if (text.includes("not sure") || text.includes("need guidance")) return "medium";
  return "low";
}
