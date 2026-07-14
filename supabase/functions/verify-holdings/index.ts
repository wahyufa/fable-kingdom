// HoodHaven — Knight's Crest holdings check
// Reads the signed-in wallet's $FADOM balance on Robinhood Chain and stamps
// `crest: true/false` into the user's metadata. The crest then shows on the
// start screen, unlocks the GILDED skin, and is copied onto every leaderboard
// row by the scores insert trigger (see docs/token-utility-setup.md).
//
// Read-only on-chain: one eth_call (balanceOf), no keys, no transfers.
//
// Deploy:   supabase functions deploy verify-holdings --no-verify-jwt
//           (we validate the caller's JWT ourselves via auth.getUser — the
//            platform check would also work, but this keeps error responses
//            CORS-friendly and consistent with the game's other functions)
// Secrets:  FADOM_TOKEN_ADDRESS   — ERC-20 contract on Robinhood Chain
//           FADOM_CREST_THRESHOLD — whole tokens required (default 100000)
//           FADOM_DECIMALS        — token decimals (default 18)
//           FADOM_RPC_URL         — override RPC (default public mainnet)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN_ADDRESS = Deno.env.get("FADOM_TOKEN_ADDRESS") || "";
const THRESHOLD = BigInt(Deno.env.get("FADOM_CREST_THRESHOLD") || "100000");
const DECIMALS = BigInt(Deno.env.get("FADOM_DECIMALS") || "18");
const RPC_URL = Deno.env.get("FADOM_RPC_URL") || "https://rpc.mainnet.chain.robinhood.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// ERC-20 balanceOf(address) — selector 0x70a08231, address left-padded to 32B
async function fetchBalance(wallet: string): Promise<bigint> {
  const data = "0x70a08231" + wallet.toLowerCase().replace("0x", "").padStart(64, "0");
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: TOKEN_ADDRESS, data }, "latest"],
    }),
  });
  if (!res.ok) throw new Error(`rpc http ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`rpc: ${json.error.message}`);
  // Empty result ("0x") means the contract doesn't exist / reverted — treat as 0
  const hex = json.result && json.result !== "0x" ? json.result : "0x0";
  return BigInt(hex);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("POST only", 405);

  try {
    if (!TOKEN_ADDRESS) return bad("Server misconfigured: FADOM_TOKEN_ADDRESS not set", 500);
    if (!/^0x[0-9a-fA-F]{40}$/.test(TOKEN_ADDRESS)) {
      return bad("Server misconfigured: FADOM_TOKEN_ADDRESS malformed", 500);
    }

    // Caller identity comes from their Supabase JWT — never from the body,
    // so nobody can ask about (or stamp) someone else's wallet.
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return bad("Missing bearer token", 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return bad("Invalid session", 401);
    const user = userData.user;

    const wallet = String(user.user_metadata?.wallet_address || "");
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) return bad("Account has no EVM wallet", 400);

    const balance = await fetchBalance(wallet);
    const crest = balance >= THRESHOLD * 10n ** DECIMALS;

    // Stamp the result so the scores insert trigger can copy it per-row
    const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        crest,
        crest_balance: balance.toString(),
        crest_checked_at: new Date().toISOString(),
      },
    });
    if (upErr) console.error("crest stamp failed", upErr);

    return new Response(JSON.stringify({ crest, balance: balance.toString() }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error in verify-holdings:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return bad(`Server error: ${msg}`, 500);
  }
});
