"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type AuthUser = {
  email: string;
  uid?: string;
  demo?: boolean;
  name?: string;
  location?: { latitude?: number; longitude?: number };
};
type AuthResponse = {
  success: boolean;
  token?: string;
  uid?: string;
  message?: string;
  demo?: boolean;
};

const TOKEN_KEY = "sprout_auth_token";
const USER_KEY = "sprout_auth_user";

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // hydrate from storage
  useEffect(() => {
    try {
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const storedUser =
        typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });
        const data: AuthResponse = await res.json();
        if (data.success && data.token) {
          let nextUser: AuthUser = { email, uid: data.uid, demo: data.demo };
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
          setUser(nextUser);
          // Try hydrate profile
          if (data.uid) {
            try {
              const snap = await getDoc(doc(db, "farmers", data.uid));
              if (snap.exists()) {
                const profile = snap.data() as Partial<AuthUser>;
                nextUser = {
                  ...nextUser,
                  name: (profile as any)?.name,
                  location: (profile as any)?.location,
                };
                localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
                setUser(nextUser);
              }
            } catch {
              // ignore profile fetch errors
            }
          }
          router.push("/dashboard");
        } else if (!data.success) {
          setError(data.message || "Login failed");
        }
        return data;
      } catch (e) {
        const msg = (e as { message?: string })?.message || "Network error";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      profile: Record<string, unknown>
    ): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "signup", email, password, profile }),
        });
        const data: AuthResponse = await res.json();
        if (data.success && data.token) {
          const profileUser = profile as {
            name?: string;
            location?: { latitude?: number; longitude?: number };
          };
          const nextUser: AuthUser = {
            email,
            uid: data.uid,
            demo: data.demo,
            name: profileUser?.name,
            location: profileUser?.location,
          };
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
          setUser(nextUser);
          router.push("/dashboard");
        } else if (!data.success) {
          setError(data.message || "Signup failed");
        }
        return data;
      } catch (e) {
        const msg = (e as { message?: string })?.message || "Network error";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setUser(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  return { user, isAuthenticated, loading, error, login, signup, logout };
};
