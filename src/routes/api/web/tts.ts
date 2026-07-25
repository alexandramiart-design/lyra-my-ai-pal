import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, webCorsPreflight, withWebCors } from "@/lib/web-auth";

export const Route = createFileRoute("/api/web/tts")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      POST: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return withWebCors(new Response("Missing LOVABLE_API_KEY", { status: 500 }));

        let body: { text?: string };
        try { body = await request.json(); } catch { return withWebCors(new Response("Invalid JSON", { status: 400 })); }
        const text = (body.text || "").trim();
        if (!text) return withWebCors(new Response("text required", { status: 400 }));

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            voice: "shimmer",
            input: text,
            response_format: "mp3",
          }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return withWebCors(new Response(`TTS error ${res.status}: ${t.slice(0, 200)}`, { status: res.status }));
        }
        return withWebCors(new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } }));
      },
    },
  },
});