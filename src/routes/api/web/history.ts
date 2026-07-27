import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, serviceClient, webCorsPreflight, withWebCors } from "@/lib/web-auth";

export const Route = createFileRoute("/api/web/history")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      GET: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const sb = serviceClient();
        const { data, error } = await sb
          .from("web_messages")
          .select("id, role, content, images, created_at")
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: true })
          .limit(10000);
        if (error) return withWebCors(new Response(error.message, { status: 500 }));
        return withWebCors(Response.json({ messages: data ?? [] }));
      },
      DELETE: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const sb = serviceClient();
        // Oubli total : messages web, messages Telegram et souvenirs appris.
        const results = await Promise.all([
          sb.from("web_messages").delete().eq("user_id", auth.userId),
          sb.from("telegram_messages").delete().eq("user_id", auth.userId),
          sb.from("user_memories").delete().eq("user_id", auth.userId),
        ]);
        const failed = results.find((r) => r.error);
        if (failed?.error) return withWebCors(new Response(failed.error.message, { status: 500 }));
        return withWebCors(Response.json({ ok: true }));
      },
    },
  },
});