import { createFileRoute } from "@tanstack/react-router";
import { requireAlexandra, webCorsPreflight, withWebCors } from "@/lib/web-auth";

export const Route = createFileRoute("/api/web/transcribe")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      POST: async ({ request }) => {
        const auth = await requireAlexandra(request);
        if (!auth.ok) return withWebCors(auth.response);
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return withWebCors(new Response("Missing LOVABLE_API_KEY", { status: 500 }));

        const inForm = await request.formData();
        const file = inForm.get("file");
        if (!(file instanceof Blob)) return withWebCors(new Response("file required", { status: 400 }));

        const outForm = new FormData();
        outForm.append("file", file, "audio.webm");
        outForm.append("model", "openai/gpt-4o-mini-transcribe");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Lovable-API-Key": key },
          body: outForm,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return withWebCors(new Response(`STT error ${res.status}: ${t.slice(0, 200)}`, { status: res.status }));
        }
        const j = await res.json();
        return withWebCors(Response.json({ text: j.text ?? "" }));
      },
    },
  },
});