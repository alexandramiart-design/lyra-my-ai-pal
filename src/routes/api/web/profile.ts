import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, serviceClient, webCorsPreflight, withWebCors } from "@/lib/web-auth";

type ProfileInput = {
  display_name?: string;
  gender?: string;
  in_transition?: boolean;
  avatar_url?: string;
  lyra_avatar_url?: string;
  theme?: string;
  onboarded?: boolean;
};

export const Route = createFileRoute("/api/web/profile")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      GET: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const sb = serviceClient();
        const { data } = await sb
          .from("user_profiles")
          .select(
            "display_name, gender, in_transition, avatar_url, lyra_avatar_url, theme, telegram_bot_username, telegram_status, telegram_chat_id, onboarded_at",
          )
          .eq("user_id", auth.userId)
          .maybeSingle();
        return withWebCors(Response.json({ profile: data, email: auth.email }));
      },
      PUT: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        let body: ProfileInput;
        try { body = await request.json(); } catch { return withWebCors(new Response("Invalid JSON", { status: 400 })); }

        const patch: Record<string, unknown> = {};
        if (typeof body.display_name === "string") patch.display_name = body.display_name.trim().slice(0, 60);
        if (body.gender === "male" || body.gender === "female") patch.gender = body.gender;
        if (typeof body.in_transition === "boolean") patch.in_transition = body.in_transition;
        if (typeof body.avatar_url === "string") patch.avatar_url = body.avatar_url.slice(0, 500000);
        if (typeof body.lyra_avatar_url === "string") patch.lyra_avatar_url = body.lyra_avatar_url.slice(0, 500000);
        if (typeof body.theme === "string") patch.theme = body.theme.slice(0, 20);
        if (body.onboarded) patch.onboarded_at = new Date().toISOString();

        const sb = serviceClient();
        const { data: existing } = await sb
          .from("user_profiles").select("user_id").eq("user_id", auth.userId).maybeSingle();

        if (!existing) {
          const { error } = await sb.from("user_profiles").insert({ user_id: auth.userId, ...patch });
          if (error) return withWebCors(new Response(error.message, { status: 500 }));
        } else {
          const { error } = await sb.from("user_profiles").update(patch).eq("user_id", auth.userId);
          if (error) return withWebCors(new Response(error.message, { status: 500 }));
        }
        return withWebCors(Response.json({ ok: true }));
      },
    },
  },
});