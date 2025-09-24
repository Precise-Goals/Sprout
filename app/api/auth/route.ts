import { NextResponse } from "next/server";
import { auth, db } from "@lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const demoUser = { email: "test@admin.com", password: "testadmin" };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      mode = "login",
      profile,
    } = body as {
      email: string;
      password: string;
      mode?: "login" | "signup";
      profile?: Record<string, unknown> | undefined;
    };

    // Demo fallback first
    if (email === demoUser.email && password === demoUser.password) {
      const farmId = "demo";
      if (profile) {
        await setDoc(
          doc(db, "farmers", farmId),
          { ...profile, farmId, demo: true },
          { merge: true }
        );
      }
      return NextResponse.json({
        success: true,
        token: "demo-token",
        demo: true,
        uid: farmId,
      });
    }

    if (mode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const farmId = cred.user.uid;
      if (profile) {
        await setDoc(
          doc(db, "farmers", farmId),
          { ...profile, farmId, email },
          { merge: true }
        );
      }
      return NextResponse.json({ success: true, token: idToken, uid: farmId });
    }

    // Firebase Auth sign-in (default)
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    return NextResponse.json({
      success: true,
      token: idToken,
      uid: credential.user.uid,
    });
  } catch (error: unknown) {
    const message =
      (error as { message?: string })?.message || "Authentication failed";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
