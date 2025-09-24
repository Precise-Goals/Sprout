"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@hooks/useAuth";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Props = {
  farmId?: string;
  threadId?: string;
  model?: string;
  className?: string;
};

const TOKEN_KEY = "sprout_auth_token";

export default function ChatBot({
  farmId: farmIdProp,
  threadId: threadIdProp,
  model = "gemini-2.0-flash",
  className,
}: Props) {
  const { user } = useAuth();
  const farmId = farmIdProp || user?.uid || "demo";
  const [threadId, setThreadId] = useState<string>(threadIdProp || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const headers = useMemo(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;
  }, []);

  useEffect(() => {
    if (!farmId) return;
    if (!threadIdProp) return; // only load when provided
    fetch(
      `/api/chat?farmId=${encodeURIComponent(
        farmId
      )}&threadId=${encodeURIComponent(threadIdProp)}`,
      { headers }
    )
      .then((r) => r.json())
      .then((json) => {
        setThreadId(json.threadId || threadIdProp);
        setMessages(Array.isArray(json.messages) ? json.messages : []);
      })
      .catch(() => {});
  }, [farmId, threadIdProp, headers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || !farmId) return;
    setLoading(true);
    const nextMessages = [
      ...messages,
      { role: "user", content } as ChatMessage,
    ];
    setMessages(nextMessages);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          farmId,
          threadId,
          model,
          messages: nextMessages,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
      if (!threadId && data?.threadId) setThreadId(data.threadId);
    } catch (e) {
      const msg = (e as { message?: string })?.message || "Failed";
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        className || ""
      }`}
    >
      <div className="mb-2 text-base font-semibold text-gray-900">Chat</div>
      <div className="max-h-80 overflow-auto space-y-2 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded border p-2 ${
              m.role === "user" ? "bg-gray-50" : "bg-emerald-50"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              {m.role}
            </div>
            <div className="mt-1 whitespace-pre-wrap text-gray-800">
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded border p-2 text-sm"
          placeholder="Ask about your farm..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
