"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const REMEMBER_KEY = "nr_admin_remember";
const TOKEN_KEY = "nr_admin_token";

function loadRememberedToken(): { token: string; remember: boolean } {
  if (typeof window === "undefined") return { token: "", remember: false };
  try {
    const remember = localStorage.getItem(REMEMBER_KEY) === "1";
    const token = remember ? (localStorage.getItem(TOKEN_KEY) ?? "") : "";
    return { token, remember };
  } catch {
    return { token: "", remember: false };
  }
}

function persistRememberedToken(token: string, remember: boolean) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "1");
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors (private browsing, etc.)
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const saved = loadRememberedToken();
    setToken(saved.token);
    setRemember(saved.remember);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next, remember }),
      });
      const data = (await res.json()) as { redirectTo?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      persistRememberedToken(token, remember);
      router.push(data.redirectTo ?? "/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Noosphere Real Estate</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your password to continue.</p>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            name="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            autoComplete="current-password"
            required
          />
        </label>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-slate-300"
          />
          Remember password
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Development default: <code className="rounded bg-slate-100 px-1">dev-admin</code>
        </p>
      </form>
    </div>
  );
}
