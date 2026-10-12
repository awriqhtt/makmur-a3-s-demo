export const COOKIE_NAME = "admin_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Token = "<expiryTimestamp>.<hmacSignature>". Gak nyimpen state apapun
// di server (stateless) — cukup verify signature + cek expiry, jadi gak
// butuh database buat sesi.
export async function createSessionToken(secret: string) {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiry);
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${toHex(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
) {
  if (!token) return false;
  const [payload, sigHex] = token.split(".");
  if (!payload || !sigHex) return false;

  const expiry = Number(payload);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false;

  const key = await getKey(secret);
  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expectedHex = toHex(expectedSig);

  if (expectedHex.length !== sigHex.length) return false;
  // Constant-time compare biar gak bocor info lewat timing.
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    mismatch |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
  }
  return mismatch === 0;
}
