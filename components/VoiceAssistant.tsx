"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  endpoint?: string; // API route to call Gemini (e.g., /api/assistant)
  model?: string; // e.g., gemini-2.0-flash or gemini-2.5-flash
  languages?: { code: string; label: string }[];
  className?: string;
};

const TOKEN_KEY = "sprout_auth_token";

export default function VoiceAssistant({
  endpoint = "/api/assistant",
  model = "gemini-2.0-flash",
  languages = [
    { code: "en-US", label: "English" },
    { code: "es-ES", label: "Español" },
    { code: "fr-FR", label: "Français" },
    { code: "hi-IN", label: "हिन्दी" },
  ],
  className,
}: Props) {
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState(languages[0]?.code || "en-US");
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  const canRecognize = useMemo(
    () =>
      typeof window !== "undefined" &&
      (!!(window as any).webkitSpeechRecognition ||
        !!(window as any).SpeechRecognition),
    []
  );

  useEffect(() => {
    if (!canRecognize) return;
    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk;
        else
          setTranscript((prev) => (chunk?.length > prev.length ? chunk : prev));
      }
      if (finalText) setTranscript(finalText);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
      recognitionRef.current = null;
    };
  }, [language, canRecognize]);

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.speak(utter);
  }, []);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.lang = language;
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {}
    }
  }, [language, listening]);

  const send = useCallback(
    async (input?: string) => {
      const content = (input ?? transcript).trim();
      if (!content) return;
      setLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const history = [...messages, { role: "user", content }];
      setMessages(history);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ model, messages: history }),
        });
        const data = await res.json();
        const text = data?.reply || data?.text || JSON.stringify(data);
        setMessages((m) => [...m, { role: "assistant", content: text }]);
        speak(text, language);
      } catch (e) {
        const msg = (e as { message?: string })?.message || "Request failed";
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
      } finally {
        setLoading(false);
        setTranscript("");
      }
    },
    [endpoint, language, messages, model, speak, transcript]
  );

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        className || ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-base font-semibold text-gray-900">
          Voice Assistant
        </div>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className={`rounded px-3 py-2 text-white ${
            listening ? "bg-red-500" : "bg-green-600"
          }`}
          disabled={!canRecognize}
        >
          {listening ? "Stop" : "Speak"}
        </button>
        <button
          type="button"
          onClick={() => send()}
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          disabled={loading || !transcript.trim()}
        >
          {loading ? "Sending..." : "Send"}
        </button>
        {!canRecognize && (
          <span className="text-xs text-gray-500">
            Speech API not supported
          </span>
        )}
      </div>

      <textarea
        className="mt-3 w-full resize-none rounded border p-2 text-sm"
        rows={3}
        placeholder="Say something or type and Send"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      <div className="mt-3 space-y-2 text-sm">
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
      </div>
    </div>
  );
}
