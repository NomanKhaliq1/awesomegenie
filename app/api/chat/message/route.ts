import { NextResponse } from "next/server";

import { generateRagAnswer } from "@/lib/ai/chat-answer";
import { buildNoContextResponseForMessage, buildProjectAcknowledgement, classifyChatIntent } from "@/lib/chat/intent";
import { buildOnboardingReply, updateOnboardingFromMessage } from "@/lib/onboarding/state";
import { buildApprovedRagContext, logRagRetrieval, retrieveApprovedRag } from "@/lib/rag/retrieval";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ChatMessageRequest = {
  session_id?: string;
  message?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatMessageRequest;
  const question = String(body.message || "").trim();

  if (!question) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const sessionId = body.session_id || (await createSession());
  const now = new Date().toISOString();
  const intent = classifyChatIntent(question);

  const { data: userMessage, error: userMessageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: "user",
      message: question,
      source_type: "chat_widget",
      intent,
      metadata: { intent }
    })
    .select("id")
    .single();

  if (userMessageError || !userMessage) {
    return NextResponse.json(
      { error: userMessageError?.message || "Unable to save user message." },
      { status: 500 }
    );
  }

  const matches = await retrieveApprovedRag(question, 4, { intent });
  await logRagRetrieval({ sessionId, messageId: userMessage.id, query: question, matches });

  const ragContext = buildApprovedRagContext(matches);
  const onboarding = await updateOnboardingFromMessage({
    sessionId,
    message: question,
    forceStart: intent === "project_request"
  });
  const answerResult = matches.length
    ? await generateRagAnswer({ sessionId, messageId: userMessage.id, question, ragContext, matches })
    : {
        answer: buildNoContextResponseForMessage(intent, question),
        provider: "none",
        model: "no_approved_context",
        success: true
      };
  const answer = onboarding
    ? intent === "project_request"
      ? `${buildProjectAcknowledgement(question)}\n\n${buildOnboardingReply(onboarding)}`
      : onboarding.was_existing
      ? buildOnboardingReply(onboarding)
      : `${answerResult.answer}\n\n${buildOnboardingReply(onboarding)}`
    : answerResult.answer;

  const { data: assistantMessage, error: assistantMessageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: "assistant",
      message: answer,
      source_type: "approved_rag",
      model_used: answerResult.model,
      metadata: {
        intent,
        onboarding,
        provider: answerResult.provider,
        rag_match_count: matches.length,
        rag_sources: matches.map((match) => ({
          title: match.title,
          url: match.url,
          chunk_id: match.chunk_id,
          score: match.score
        }))
      }
    })
    .select("id,role,message,created_at,metadata")
    .single();

  if (assistantMessageError || !assistantMessage) {
    return NextResponse.json(
      { error: assistantMessageError?.message || "Unable to save assistant message." },
      { status: 500 }
    );
  }

  await supabase
    .from("chat_sessions")
    .update({
      current_state: onboarding ? "collecting_service_requirements" : matches.length ? "answered_with_rag" : "needs_more_info",
      service_category_id: onboarding?.service_category_id || null,
      session_status: onboarding ? "needs_more_info" : intent === "project_request" ? "needs_more_info" : "active",
      last_message_at: now,
      updated_at: now
    })
    .eq("id", sessionId);

  return NextResponse.json({
    session_id: sessionId,
    message: assistantMessage,
    sources: matches.map((match) => ({
      title: match.title,
      url: match.url,
      score: match.score
    })),
    used_approved_rag: matches.length > 0,
    intent,
    onboarding,
    provider: answerResult.provider,
    model: answerResult.model
  });
}

async function createSession() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      session_status: "active",
      current_state: "message_started",
      last_message_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to create chat session.");
  }

  return data.id as string;
}
