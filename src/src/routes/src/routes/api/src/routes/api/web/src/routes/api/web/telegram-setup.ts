import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { requireAuthenticated, serviceClient, webCorsPreflight, withWebCors } from "@/lib/web-auth";

const PUBLIC_APP_URL = "https://sweet-git-sparkle.lovable.app";

function deriveSecret(userId: string, token: string): string {
  return createHash("sha256").update(`lyra-telegram:${userId}:${token}`).digest("base64url");
}

async function tg(token: string, method: string, body?: unknown): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  return (await res.json()) as { ok: boolean; result?: unknown; description?: string };
}

export const Route = createFileRoute("/api/web/telegram-setup")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      POST: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);

        let body: { token?: string };
        try { body = await request.json(); } catch { return withWebCors(new Response("Invalid JSON", { status: 400 })); }
        const token = (body.token || "").trim();
        if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
          return withWebCors(new Response("Token invalide", { status: 400 }));
        }

        // Validate token
        const me = await tg(token, "getMe");
        if (!me.ok) return withWebCors(new Response(`Telegram: ${me.description || "token refusé"}`, { status: 400 }));
        const info = me.result as { username?: string };

        const secret = deriveSecret(auth.userId, token);
        const webhookUrl = `${PUBLIC_APP_URL}/api/public/telegram/webhook?u=${auth.userId}`;
        const set = await tg(token, "setWebhook", {
          url: webhookUrl,
          secret_token: secret,
          allowed_updates: ["message", "edited_message"],
          drop_pending_updates: true,
        });
        if (!set.ok) return withWebCors(new Response(`Webhook: ${set.description || "échec"}`, { status: 400 }));

        const sb = serviceClient();
        const patch = {
          telegram_bot_token: token,
          telegram_bot_username: info.username ?? null,
          telegram_webhook_secret: secret,
          telegram_chat_id: null,
          telegram_status: "ready",
        };
        const { data: existing } = await sb
          .from("user_profiles").select("user_id").eq("user_id", auth.userId).maybeSingle();
        if (!existing) {
          await sb.from("user_profiles").insert({ user_id: auth.userId, ...patch });
        } else {
          await sb.from("user_profiles").update(patch).eq("user_id", auth.userId);
        }

        return withWebCors(Response.json({
          ok: true,
          username: info.username ?? null,
          botLink: info.username ? `https://t.me/${info.username}` : null,
        }));
      },
      DELETE: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const sb = serviceClient();
        const { data: prof } = await sb.from("user_profiles")
          .select("telegram_bot_token").eq("user_id", auth.userId).maybeSingle();
        const token = (prof?.telegram_bot_token as string | undefined) || null;
        if (token) { try { await tg(token, "deleteWebhook", { drop_pending_updates: true }); } catch {} }
        await sb.from("user_profiles").update({
          telegram_bot_token: null,
          telegram_bot_username: null,
          telegram_webhook_secret: null,
          telegram_chat_id: null,
          telegram_status: "idle",
        }).eq("user_id", auth.userId);
        return withWebCors(Response.json({ ok: true }));
      },
    },
  },
});