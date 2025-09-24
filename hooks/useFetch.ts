"use client";

import { useEffect, useState } from "react";

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

  const refetch = () => setRefreshCounter((c) => c + 1);

  // Build a simple dependency key to satisfy lint rules without extra hooks
  const headersEntries = headers
    ? Array.from(new Headers(headers).entries())
    : [];
  const bodyKey =
    rest.body instanceof FormData
      ? "formdata"
      : typeof rest.body === "string"
      ? rest.body
      : rest.body
      ? "body"
      : "";
  const depsKey = JSON.stringify({
    url,
    skip: !!skip,
    params,
    headersEntries,
    method: rest.method || "",
    mode: rest.mode || "",
    credentials: rest.credentials || "",
    cache: rest.cache || "",
    redirect: rest.redirect || "",
    referrer: rest.referrer || "",
    referrerPolicy: rest.referrerPolicy || "",
    integrity: rest.integrity || "",
    keepalive: !!rest.keepalive,
    bodyKey,
  });

  useEffect(() => {
    if (!url || skip) return;

    const requestUrl = buildUrl(url, params);
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
  }, [depsKey, refreshCounter]);

  return { data, loading, error, refetch } as const;
}
