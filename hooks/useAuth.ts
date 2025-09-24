"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type AuthUser = { email: string; uid?: string; demo?: boolean };
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
          const nextUser: AuthUser = { email, uid: data.uid, demo: data.demo };
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
          setUser(nextUser);
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
          const nextUser: AuthUser = { email, uid: data.uid, demo: data.demo };
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
          setUser(nextUser);
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
