"use client";

import { useCallback, useEffect, useState } from "react";

type Params = Record<string, string | number | boolean | null | undefined>;

type UseFetchOptions = RequestInit & {
  params?: Params;
  skip?: boolean;
};

const TOKEN_KEY = "sprout_auth_token";

function buildUrl(base: string, params?: Params): string {
  if (!params) return base;
  const url = new URL(
    base,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, String(value));
  });
  return url.pathname + (url.search ? `?${url.searchParams.toString()}` : "");
}

export function useFetch<T = unknown>(
  url: string | null,
  options: UseFetchOptions = {}
) {
  const { params, skip, headers, ...rest } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refetch = useCallback(() => {
    setRefreshCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    const requestUrl = url ? buildUrl(url, params) : null;
    if (!requestUrl || skip) return;
    let isMounted = true;
    const controller = new AbortController();

    const token =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

    const mergedHeaders = new Headers(headers || {});
    if (token && !mergedHeaders.has("Authorization")) {
      mergedHeaders.set("Authorization", `Bearer ${token}`);
    }

    if (
      !mergedHeaders.has("Content-Type") &&
      rest.method &&
      rest.method !== "GET" &&
      !(rest.body instanceof FormData)
    ) {
      mergedHeaders.set("Content-Type", "application/json");
    }

    setLoading(true);
    setError(null);

    fetch(requestUrl, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok)
          throw new Error((await res.text()) || `HTTP ${res.status}`);
        const ct = res.headers.get("content-type") || "";
        return ct.includes("application/json") ? res.json() : res.text();
      })
      .then((body) => {
        if (isMounted) setData(body as T);
      })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
        if (isMounted)
          setError((e as { message?: string })?.message || "Request failed");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, params, skip, refreshCounter, headers, rest]);

  return { data, loading, error, refetch } as const;
}
