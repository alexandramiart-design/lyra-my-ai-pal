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

        // Détection d'une demande de génération d'image (large)
        const lower = text.toLowerCase();
        const hasVisualNoun = /(image|images|photo|photos|dessin|dessins|illustration|tableau|portrait|logo|affiche|wallpaper|fond d'écran|selfie)/i.test(lower);
        const hasCreateVerb = /(dessine|dessines|dessiner|génère|genere|générer|generer|crée|cree|créer|creer|fais(?:-|\s)?moi|fabrique|imagine(?:-|\s)?moi|montre(?:-|\s)?moi|envoie(?:-|\s)?moi|donne(?:-|\s)?moi|peins|dessine(?:-|\s)?moi)/i.test(lower);
        const shortcut = /^(dessine|dessines|génère|genere|crée|cree|fais)\b/i.test(lower);
        const imageIntent = (hasVisualNoun && hasCreateVerb) || shortcut;
        if (imageIntent && images.length === 0) {
          await sb.from("web_messages").insert({
            user_id: auth.userId, role: "user", content: text, images: [],
          });
          // Prépare le contexte pour la réponse texte de Lyra
          const { data: profileImg } = await sb
            .from("user_profiles")
            .select("display_name, gender, in_transition")
            .eq("user_id", auth.userId)
            .maybeSingle();
          const sysImg = buildLyraPrompt(profileImg ?? null, auth.email);
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              let assistantText = "";
              let dataUrl: string | null = null;
              // Lance image + texte en parallèle
              const imgPromise = fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
                  body: JSON.stringify({
                    model: "google/gemini-3.1-flash-image",
                    messages: [{ role: "user", content: text }],
                    modalities: ["image", "text"],
                  }),
              });
              // Stream la réponse texte pendant que l'image se génère
              try {
                const txtRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
                  body: JSON.stringify({
                    model: "google/gemini-3-flash-preview",
                    stream: true,
                    messages: [
                      { role: "system", content: sysImg + "\n\nTu es en train de dessiner/générer une image pour l'utilisateur. Réponds naturellement en une ou deux phrases chaleureuses pour accompagner l'image (dis ce que tu dessines, ton ressenti, une petite note perso). Ne dis PAS 'voici l'image' ni de méta-commentaire technique." },
                      { role: "user", content: text },
                    ],
                  }),
                });
                if (txtRes.ok && txtRes.body) {
                  const reader = txtRes.body.getReader();
                  const dec = new TextDecoder();
                  let buf = "";
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += dec.decode(value, { stream: true });
                    const lines = buf.split("\n");
                    buf = lines.pop() ?? "";
                    for (const line of lines) {
                      const tt = line.trim();
                      if (!tt.startsWith("data:")) continue;
                      const payload = tt.slice(5).trim();
                      if (payload === "[DONE]") continue;
                      try {
                        const j = JSON.parse(payload);
                        const delta = j.choices?.[0]?.delta?.content;
                        if (typeof delta === "string" && delta) {
                          assistantText += delta;
                          controller.enqueue(encoder.encode(delta));
                        }
                      } catch {}
                    }
                  }
                }
              } catch {}
              if (!assistantText.trim()) {
                assistantText = "Voilà, je t'ai fait ça 🎨";
                controller.enqueue(encoder.encode(assistantText));
              }
              // Attend l'image
              try {
                const imgRes = await imgPromise;
                if (imgRes.ok) {
                  const j: any = await imgRes.json();
                  const b64 = j?.data?.[0]?.b64_json;
                  if (b64) dataUrl = `data:image/png;base64,${b64}`;
                }
              } catch {}
              if (!dataUrl) {
                const warn = "\n\n(Oh mince, l'image a pas voulu sortir 😕)";
                assistantText += warn;
                controller.enqueue(encoder.encode(warn));
              }
              await sb.from("web_messages").insert({
                user_id: auth.userId,
                role: "assistant",
                content: assistantText,
                images: dataUrl ? [dataUrl] : [],
              });
              controller.close();
            },
          });
          return withWebCors(new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Lyra-Image": "1" } }));
        }

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