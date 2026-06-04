"use client";

import { Bot, ChevronDown, MessageCircle, Paperclip, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import clsx from "clsx";

const quickPrompts = [
  "Do you build mortgage websites?",
  "I need Encompass automation",
  "Can you help with MISMO?",
  "I need a Power BI dashboard"
];

type ChatWidgetProps = {
  defaultOpen?: boolean;
  embedded?: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  message: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "intro",
    role: "assistant",
    message:
      "Hi, I'm Awesome Genie. Ask me about AwesomeTech services, or tell me what project you want to build."
  },
  {
    id: "capabilities",
    role: "assistant",
    message:
      "I can help with mortgage automation, LOS integrations, mortgage websites, calculators, Power BI dashboards, reporting, and project requirement collection."
  }
];

export function ChatWidget({ defaultOpen = true, embedded = false }: ChatWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [minimized, setMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [suggestions, setSuggestions] = useState<string[]>(quickPrompts);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!open) {
    return (
      <button
        aria-label="Open Awesome Genie chat"
        className="focus-ring fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#B5212F] text-white shadow-[0_18px_44px_rgba(181,33,47,0.35)] transition hover:scale-105"
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        type="button"
      >
        <MessageCircle size={30} />
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "z-50 overflow-hidden rounded-2xl border border-[#eadde1] bg-white shadow-[0_22px_70px_rgba(38,22,29,0.18)]",
        embedded
          ? "relative h-[680px] w-full max-w-[420px]"
          : "fixed bottom-6 right-6 h-[680px] w-[420px] max-w-[calc(100vw-32px)]"
      )}
    >
      <div className="bg-[#B5212F] px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
              <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">Awesome Genie</h2>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                  Online
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/85">AwesomeTech project assistant</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              aria-label="Minimize chat"
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-white/85 hover:bg-white/15"
              onClick={() => setMinimized((value) => !value)}
              type="button"
            >
              <ChevronDown size={18} />
            </button>
            {!embedded ? (
              <button
                aria-label="Close chat"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-white/85 hover:bg-white/15"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!minimized ? (
        <div className="flex h-[calc(100%-76px)] flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#fffafa] px-4 py-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}

            {suggestions.length ? (
              <div className="grid gap-2">
                {suggestions.map((prompt) => (
                <button
                  className="focus-ring rounded-full border border-[#eadde1] bg-white px-3 py-2 text-left text-xs font-bold text-[#6e6269] shadow-sm hover:border-[#B5212F] hover:text-[#B5212F]"
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
                ))}
              </div>
            ) : null}

            {sending ? (
              <div className="max-w-[84%] rounded-2xl rounded-tl-sm bg-white p-4 text-sm font-bold text-[#594b52] shadow-sm">
                Awesome Genie is reviewing your request...
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#eadde1] bg-white p-3">
            <div className="mb-2 text-center text-[11px] font-bold text-[#8d7d85]">
              Uses approved AwesomeTech knowledge only
            </div>
            <form
              className="flex items-end gap-2 rounded-xl border border-[#eadde1] bg-white p-2"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <button
                aria-label="Attach file"
                className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#8d7d85] hover:bg-[#FAF0F1] hover:text-[#B5212F]"
                type="button"
              >
                <Paperclip size={18} />
              </button>
              <textarea
                className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent py-2 text-sm leading-5 text-[#171015] outline-none placeholder:text-[#9b8c93]"
                disabled={sending}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Type your question..."
                rows={1}
                value={input}
              />
              <button
                aria-label="Send message"
                className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#B5212F] text-white disabled:opacity-50"
                disabled={sending || !input.trim()}
                type="submit"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          className="flex w-full items-center justify-between bg-white px-4 py-4 text-sm font-bold text-[#594b52]"
          onClick={() => setMinimized(false)}
          type="button"
        >
          Chat minimized
          <MessageCircle size={18} className="text-[#B5212F]" />
        </button>
      )}
    </div>
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function sendMessage(rawMessage: string) {
    const trimmed = rawMessage.trim();

    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    setSuggestions([]);
    setInput("");
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        role: "user",
        message: trimmed
      }
    ]);

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        const startResponse = await fetch("/api/chat/start", { method: "POST" });
        const startData = await startResponse.json();

        if (!startResponse.ok) {
          throw new Error(startData.error || "Unable to start chat.");
        }

        activeSessionId = startData.session_id;
        setSessionId(activeSessionId);
      }

      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: trimmed
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send message.");
      }

      setSessionId(data.session_id);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 4) : []);
      setMessages((current) => [
        ...current,
        {
          id: data.message.id,
          role: "assistant",
          message: data.message.message
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          message:
            "I could not process that message right now. Please try again or contact AwesomeTech directly."
        }
      ]);
    } finally {
      setSending(false);
    }
  }
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const assistant = message.role === "assistant";

  return (
    <div
      className={clsx(
        "max-w-[88%] rounded-2xl p-4 text-sm leading-6 shadow-sm",
        assistant
          ? "rounded-tl-sm bg-white text-[#594b52]"
          : "ml-auto rounded-tr-sm bg-[#B5212F] text-white"
      )}
    >
      {message.id === "capabilities" ? (
        <div className="mb-2 flex items-center gap-2 font-black text-[#171015]">
          <Sparkles size={16} className="text-[#B5212F]" />
          I can help with
        </div>
      ) : null}
      <p className="whitespace-pre-wrap">{message.message}</p>
    </div>
  );
}
