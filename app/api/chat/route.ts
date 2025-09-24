import { NextResponse } from "next/server";
import { db } from "@lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

type ChatMessage = { role: "user" | "assistant"; content: string };

const DEFAULT_MODEL = "gemini-2.0-flash";

async function callGemini(model: string, messages: ChatMessage[]) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    const last = messages[messages.length - 1]?.content || "";
    return { reply: `Demo reply: ${last.slice(0, 120)}` };
  }
  // Minimal request to Google Generative Language API v1beta
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Gemini error ${res.status}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { reply: text };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const threadId = searchParams.get("threadId");
    if (!farmId)
      return NextResponse.json({ error: "farmId required" }, { status: 400 });

    if (threadId) {
      const ref = doc(db, "chats", `${farmId}__${threadId}`);
      const snap = await getDoc(ref);
      if (!snap.exists())
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(snap.data());
    }

    const col = collection(db, "chats");
    const q = query(col, where("farmId", "==", farmId));
    const snaps = await getDocs(q);
    const threads = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ farmId, threads });
  } catch (e) {
    const message =
      (e as { message?: string })?.message || "Failed to load chats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const farmId: string = body.farmId;
    const threadId: string = body.threadId || `${Date.now()}`;
    const model: string = body.model || DEFAULT_MODEL;
    const messages: ChatMessage[] = body.messages || [];
    if (!farmId)
      return NextResponse.json({ error: "farmId required" }, { status: 400 });
    if (!Array.isArray(messages) || messages.length === 0)
      return NextResponse.json({ error: "messages required" }, { status: 400 });

    const { reply } = await callGemini(model, messages);
    const full = [
      ...messages,
      { role: "assistant", content: reply } as ChatMessage,
    ];

    const payload = {
      farmId,
      threadId,
      model,
      messages: full,
      updatedAt: new Date().toISOString(),
      last: { role: "assistant", content: reply },
    };

    await setDoc(doc(db, "chats", `${farmId}__${threadId}`), payload, {
      merge: true,
    });
    return NextResponse.json({ farmId, threadId, reply });
  } catch (e) {
    const message =
      (e as { message?: string })?.message || "Failed to send chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
