"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import Logomark from "@/components/Logomark";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Username atau password salah.");
        return;
      }

      // Cegah open redirect: hanya terima path internal ("/..." bukan "//...")
      const rawNext = searchParams.get("next");
      const next =
        rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
          ? rawNext
          : "/admin/invoice";

      router.replace(next);
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-sand/40 px-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Ke halaman utama
      </Link>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-line rounded-[20px] p-8 shadow-sm flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2">
          <Logomark compact />
          <h1 className="font-display text-lg text-ink">Masuk ke akun</h1>
        </div>

        <div>
          <label htmlFor="username" className="text-xs font-medium text-ink/60">
            Username
          </label>
          <div className="relative mt-1.5">
            <User className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              autoFocus
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-medium text-ink/60">
            Password
          </label>
          <div className="relative mt-1.5">
            <KeyRound className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg pl-9 pr-10 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-ink/60 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-line accent-ink"
          />
          Tetap masuk di perangkat ini
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600 -mt-1">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full rounded-full bg-ink text-white py-2.5 text-sm font-medium hover:bg-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-1"
        >
          {loading ? "Memproses…" : "Masuk"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
