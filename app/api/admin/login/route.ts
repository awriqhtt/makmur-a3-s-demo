import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  COOKIE_NAME,
  SESSION_DURATION_MS,
  createSessionToken,
} from "@/lib/admin-session";

// Perbandingan waktu-konstan, biar gak bisa ditebak lewat selisih waktu respons
function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  const { username, password, rememberMe } = await req
    .json()
    .catch(() => ({ username: "", password: "", rememberMe: false }));

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!adminUsername || !adminPassword || !secret) {
    return NextResponse.json(
      { error: "Konfigurasi admin belum lengkap di server." },
      { status: 500 },
    );
  }

  const ok =
    safeEqual(String(username ?? ""), adminUsername) &&
    safeEqual(String(password ?? ""), adminPassword);

  if (!ok) {
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Kalau "Tetap masuk" dicentang: pakai durasi penuh.
    // Kalau tidak: tanpa maxAge, jadi cookie hilang saat browser ditutup.
    ...(rememberMe ? { maxAge: SESSION_DURATION_MS / 1000 } : {}),
  });
  return res;
}
