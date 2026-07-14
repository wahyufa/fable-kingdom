// HoodHaven — EVM wallet auth (Robinhood Chain)
// Verifies an EIP-191 personal_sign signature, then mints a Supabase session
// JWT directly. The user is stored with a synthetic email of
// "<0xwallet>@wallet.hoodhaven.app" so they slot into Supabase auth + RLS
// exactly like an email user. Replaces solana-auth after the move to
// Robinhood Chain (Arbitrum Orbit L2) — signature recovery is chain-agnostic,
// so no RPC call is ever needed here.
//
// Deploy:   supabase functions deploy evm-auth --no-verify-jwt
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)
//           JWT_SECRET — same secret already set for solana-auth
//            (Project Settings → API → JWT Settings → "JWT Secret").
//
// Note: --no-verify-jwt is required because this is the function that *issues*
// the JWT — there is no caller token to verify.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1.4.0/sha3";
import { secp256k1 } from "https://esm.sh/@noble/curves@1.4.0/secp256k1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET")!;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const SESSION_LIFETIME_S = 60 * 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- EIP-191 personal_sign recovery ---
// hash = keccak256("\x19Ethereum Signed Message:\n" + byteLen(msg) + msg),
// then secp256k1 ecrecover with the signature's 65th byte as the recovery id.
function recoverAddress(message: string, sigHex: string): string {
  const msgBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode(
    `\x19Ethereum Signed Message:\n${msgBytes.length}`,
  );
  const data = new Uint8Array(prefix.length + msgBytes.length);
  data.set(prefix);
  data.set(msgBytes, prefix.length);
  const hash = keccak_256(data);

  const sig = sigHex.startsWith("0x") ? sigHex.slice(2) : sigHex;
  if (!/^[0-9a-fA-F]{130}$/.test(sig)) throw new Error("bad signature format");
  let v = parseInt(sig.slice(128, 130), 16);
  if (v >= 27) v -= 27;
  if (v !== 0 && v !== 1) throw new Error("bad recovery id");

  const pub = secp256k1.Signature.fromCompact(sig.slice(0, 128))
    .addRecoveryBit(v)
    .recoverPublicKey(hash)
    .toRawBytes(false); // uncompressed: 0x04 || x || y
  const addrBytes = keccak_256(pub.slice(1)).slice(-20);
  return "0x" + Array.from(addrBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Base64url-encode raw bytes. JWT payloads can contain Unicode (display
// names, ellipsis, emoji), so we always go through TextEncoder/bytes first —
// btoa() itself only accepts Latin1.
function b64urlBytes(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
const b64urlJSON = (obj: unknown) =>
  b64urlBytes(new TextEncoder().encode(JSON.stringify(obj)));

async function signJWT(payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = `${b64urlJSON(header)}.${b64urlJSON(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  return `${body}.${b64urlBytes(sigBytes)}`;
}

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("POST only", 405);

  // Whole handler wrapped so any throw still returns CORS-friendly JSON
  try {
    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET env var");
      return bad("Server misconfigured: JWT_SECRET secret not set", 500);
    }
    if (!SERVICE_ROLE) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return bad("Server misconfigured: service role missing", 500);
    }

    let body: { wallet?: string; message?: string; signature?: string; displayName?: string };
    try { body = await req.json(); } catch { return bad("Invalid JSON"); }
    const { wallet, message, signature, displayName } = body;
    if (!wallet || !message || !signature) return bad("wallet, message, signature required");

    // 1. Verify the EIP-191 signature recovers to the claimed address
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) return bad("Malformed wallet address");
    let recovered: string;
    try {
      recovered = recoverAddress(message, signature);
    } catch (err) {
      console.error("recover failed", err);
      return bad("Malformed signature");
    }
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return bad("Signature does not match wallet");
    }

    // 2. Anti-replay: message must contain wallet + recent timestamp
    if (!message.toLowerCase().includes(wallet.toLowerCase())) {
      return bad("Message must include the wallet address");
    }
    const m = message.match(/Issued at:\s*(\S+)/);
    if (!m) return bad("Message must include 'Issued at: <ISO timestamp>'");
    const issued = Date.parse(m[1]);
    if (!Number.isFinite(issued)) return bad("Bad timestamp");
    if (Math.abs(Date.now() - issued) > MAX_CLOCK_SKEW_MS) return bad("Message expired");

    // 3. Upsert user. Supabase auth validates the email TLD, so we use .app.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const walletLc = wallet.toLowerCase();
    const email = `${walletLc}@wallet.hoodhaven.app`;
    const cleanName = (displayName || "").trim().slice(0, 16);
    const defaultName = `${walletLc.slice(0, 6)}…${walletLc.slice(-4)}`;

    // Try create first — if user already exists we'll do a paginated lookup
    let user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null = null;

    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { wallet_address: walletLc, display_name: cleanName || defaultName },
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase() || "";
      const alreadyExists = msg.includes("already") || msg.includes("registered") || createErr.code === "email_exists";
      if (!alreadyExists) {
        console.error("createUser failed", createErr);
        return bad(`Create user failed: ${createErr.message}`, 500);
      }
      // User exists — find them. listUsers caps perPage at 1000 in newer SDK versions.
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) {
        console.error("listUsers failed", listErr);
        return bad(`List users failed: ${listErr.message}`, 500);
      }
      user = list.users.find((u) => u.email === email) ?? null;
      if (!user) return bad("Existing user not found by email — try again", 500);
    } else {
      user = createData.user!;
    }

    // Update display name if the player provided a new one
    if (cleanName && user.user_metadata?.display_name !== cleanName) {
      const { data: upData, error: upErr } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata || {}), display_name: cleanName },
      });
      if (upErr) {
        console.error("updateUserById failed", upErr);
      } else {
        user = upData.user;
      }
    }

    // 4. Mint Supabase access token (HS256 with project JWT secret)
    const now = Math.floor(Date.now() / 1000);
    const exp = now + SESSION_LIFETIME_S;
    const access_token = await signJWT({
      aud: "authenticated",
      iss: `${SUPABASE_URL}/auth/v1`,
      sub: user.id,
      email: user.email,
      role: "authenticated",
      iat: now,
      exp,
      app_metadata: user.app_metadata ?? { provider: "wallet" },
      user_metadata: user.user_metadata ?? {},
    });

    return new Response(
      JSON.stringify({
        access_token,
        expires_at: exp,
        user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
      }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (err) {
    console.error("Unhandled error in evm-auth:", err);
    const msg = err instanceof Error ? `${err.message}` : String(err);
    return bad(`Server error: ${msg}`, 500);
  }
});
