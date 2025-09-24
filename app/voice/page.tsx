"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@hooks/useAuth";

export default function VoicePage() {
  const { isAuthenticated } = useAuth();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript;
      }
      if (final) setTranscript((t) => (t ? t + " " : "") + final.trim());
    };
    recognitionRef.current = rec;
  }, []);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        // no-op
      }
    }
  };

  const ask = async () => {
    if (!transcript.trim()) return;
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcript }),
      });
      // UI could speak the response via SpeechSynthesis in a follow-up
    } catch {
      // swallow
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Voice Assistant</h1>
      {!isAuthenticated && (
        <p className="text-sm text-gray-600">
          Sign in to use the voice assistant.
        </p>
      )}
      <div className="rounded border p-3">
        <div className="mb-2 text-sm text-gray-700">
          {listening ? "Listening..." : "Idle"}
        </div>
        <div className="mb-2 min-h-16 rounded border p-2 text-sm">
          {transcript || "(your transcript will appear here)"}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={toggle}
            disabled={!isAuthenticated}
          >
            {listening ? "Stop" : "Start"}
          </button>
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={ask}
            disabled={!isAuthenticated}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
