"use client";
import { useState } from "react";
import { useAuth } from "@hooks/useAuth";

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; text: string }>
  >([]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    // Placeholder for Gemini API integration
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.text || "(no response)" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Error contacting assistant" },
      ]);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Chat</h1>
      {!isAuthenticated && (
        <p className="text-sm text-gray-600">
          Sign in to use the chat assistant.
        </p>
      )}
      <div className="rounded border p-3">
        <div className="mb-2 h-64 overflow-auto rounded border p-2 text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <span
                className={
                  m.role === "user"
                    ? "inline-block rounded bg-emerald-600 px-2 py-1 text-white"
                    : "inline-block rounded bg-gray-100 px-2 py-1"
                }
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded border p-2 text-sm"
            placeholder="Ask about your farm..."
          />
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={send}
            disabled={!isAuthenticated}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
