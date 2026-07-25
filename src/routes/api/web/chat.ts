import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, serviceClient, buildLyraPrompt, webCorsPreflight, withWebCors } from "@/lib/web-auth";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export const Route = createFileRoute("/api/web/chat")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      POST: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return withWebCors(new Response("Missing LOVABLE_API_KEY", { status: 500 }));

        let body: { text?: string; image?: string | null; images?: string[] | null };
        try { body = await request.json(); } catch { return withWebCors(new Response("Invalid JSON", { status: 400 })); }
        const text = (body.text || "").trim();
        const images: string[] = Array.isArray(body.images) && body.images.length
          ? body.images.filter((x): x is string => typeof x === "string" && x.length > 0)
          : (body.image ? [body.image] : []);
        if (!text && images.length === 0) return withWebCors(new Response("empty", { status: 400 }));

        const sb = serviceClient();
        const { data: profile } = await sb
          .from("user_profiles")
          .select("display_name, gender, in_transition")
          .eq("user_id", auth.userId)
          .maybeSingle();
        const systemPrompt = buildLyraPrompt(profile ?? null, auth.email);
        // Save user message
        await sb.from("web_messages").insert({
          user_id: auth.userId,
          role: "user",
          content: text,
          images,
        });

        // Load recent history for model context (kept short for latency;
        // long-term memory is preserved in DB and shown in the UI).
        const { data: hist } = await sb
          .from("web_messages")
          .select("role, content, images, created_at")
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(60);
        const history = (hist ?? []).slice().reverse();

        const messages: { role: string; content: string | Part[] }[] = [
          { role: "system", content: systemPrompt },
        ];
        for (let i = 0; i < history.length; i++) {
          const m = history[i];
          const isLastUser = i === history.length - 1 && m.role === "user";
          const imgs = Array.isArray(m.images) ? (m.images as string[]) : [];
          if (isLastUser && imgs.length) {
            const parts: Part[] = [];
            if (m.content) parts.push({ type: "text", text: m.content });
            for (const url of imgs) parts.push({ type: "image_url", image_url: { url } });
            messages.push({ role: m.role, content: parts });
          } else {
            messages.push({ role: m.role, content: m.content });
          }
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
          body: JSON.stringify({ model: "google/gemini-3-flash-preview", stream: true, messages }),
        });

        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text().catch(() => "");
          return withWebCors(new Response(`AI error ${upstream.status}: ${t.slice(0, 200)}`, { status: upstream.status }));
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let full = "";
        const stream = new ReadableStream({
          async start(controller) {
            const reader = upstream.body!.getReader();
            let buf = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const t = line.trim();
                  if (!t.startsWith("data:")) continue;
                  const payload = t.slice(5).trim();
                  if (payload === "[DONE]") continue;
                  try {
                    const j = JSON.parse(payload);
                    const delta = j.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta) {
                      full += delta;
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {}
                }
              }
            } finally {
              if (full) {
                await sb.from("web_messages").insert({
                  user_id: auth.userId, role: "assistant", content: full, images: [],
                });
              }
              controller.close();
            }
          },
        });
        return withWebCors(new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } }));
      },
    },
  },
});