import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, serviceClient, buildLyraPrompt, webCorsPreflight, withWebCors } from "@/lib/web-auth";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

type ImageGatewayResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  choices?: Array<{
    message?: {
      images?: Array<{ image_url?: { url?: string }; url?: string }>;
    };
  }>;
  error?: { message?: string };
};

async function enhanceImagePrompt(key: string, text: string): Promise<string> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You rewrite a user's short (often French) image request into ONE rich English image-generation prompt. Rules: keep the user's exact subject and intent, never change it. Make emotions REAL and human: describe the precise facial expression (eye crinkles, open mouth laugh with visible teeth, raised cheeks, head tilted back for laughter; watery eyes and downturned mouth for sadness), body language and hands. Add photographic detail: camera framing, 50mm lens, natural lighting, depth of field, skin texture with pores and imperfections, realistic hair. Avoid plastic/CGI/airbrushed looks, avoid text or watermarks. If the request is clearly a drawing/cartoon/illustration, keep that style instead of photorealism but still make the emotion expressive. Answer with the prompt only, no quotes, no preamble, max 90 words.",
          },
          { role: "user", content: text },
        ],
      }),
    });
    if (!r.ok) return text;
    const j = (await r.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const out = j?.choices?.[0]?.message?.content;
    return typeof out === "string" && out.trim().length > 10 ? out.trim() : text;
  } catch {
    return text;
  }
}

/** Détecte le format/ratio demandé par l'utilisateur (carré, portrait, 16:9, bannière...). */
function detectImageFormat(lower: string): { ratio: string; hint: string } | null {
  const explicit = lower.match(/\b(\d{1,2})\s*[:x\/]\s*(\d{1,2})\b/);
  if (explicit) return { ratio: `${explicit[1]}:${explicit[2]}`, hint: `aspect ratio ${explicit[1]}:${explicit[2]}` };
  if (/(carre|square|instagram post|1:1)/.test(lower)) return { ratio: "1:1", hint: "square 1:1 composition" };
  if (/(story|stories|tiktok|reel|vertical|portrait|fond d'ecran de telephone|wallpaper telephone|mobile)/.test(lower))
    return { ratio: "9:16", hint: "vertical 9:16 full-frame composition" };
  if (/(paysage|horizontal|banniere|banner|cinematique|cinematic|widescreen|youtube|couverture|wallpaper|fond d'ecran)/.test(lower))
    return { ratio: "16:9", hint: "wide 16:9 cinematic composition" };
  if (/(ultra ?wide|panorama|panoramique)/.test(lower)) return { ratio: "21:9", hint: "ultrawide 21:9 panoramic composition" };
  if (/(affiche|poster|a4|impression)/.test(lower)) return { ratio: "3:4", hint: "vertical 3:4 poster composition" };
  return null;
}

function imageResponseToDataUrl(json: ImageGatewayResponse): string | null {
  const direct = json.data?.[0]?.b64_json;
  if (direct) return `data:image/png;base64,${direct}`;
  const dataUrl = json.data?.[0]?.url;
  if (dataUrl) return dataUrl;
  const messageImage = json.choices?.[0]?.message?.images?.[0];
  return messageImage?.image_url?.url ?? messageImage?.url ?? null;
}

async function generateImageDataUrl(key: string, prompt: string, format?: { ratio: string; hint: string } | null): Promise<string | null> {
  const models = ["google/gemini-3.1-flash-image", "google/gemini-3-pro-image"];
  const finalPrompt = format
    ? `${prompt}\n\nOutput format: ${format.hint}, aspect ratio exactly ${format.ratio}. Frame the whole subject inside this ratio, no borders, no letterboxing.`
    : prompt;
  for (const model of models) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: finalPrompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!response.ok) continue;
      const json = (await response.json()) as ImageGatewayResponse;
      const dataUrl = imageResponseToDataUrl(json);
      if (dataUrl) return dataUrl;
    } catch {}
  }
  return null;
}

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
        // Normalisation sans accents pour matcher "créé", "genere", "dessiné"...
        const lower = text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const hasVisualNoun = /(image|images|photo|photos|dessin|dessins|illustration|tableau|portrait|logo|affiche|wallpaper|fond d'ecran|selfie|avatar|visuel)/i.test(lower);
        const hasCreateVerb = /(dessin\w*|gener\w*|cre\w*|fabriq\w*|peins|peindre|fais(?:-|\s)?moi|imagine(?:-|\s)?moi|montre(?:-|\s)?moi|envoie(?:-|\s)?moi|donne(?:-|\s)?moi)/i.test(lower);
        const shortcut = /^(dessin\w*|gener\w*|cre\w*|fais)\b/i.test(lower);
        const imageIntent = (hasVisualNoun && hasCreateVerb) || shortcut;
        if (imageIntent && images.length === 0) {
          await sb.from("web_messages").insert({
            user_id: auth.userId, role: "user", content: text, images: [],
          });
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              let assistantText = "";
              let dataUrl: string | null = null;
              try {
                const finalPrompt = await enhanceImagePrompt(key, text);
                dataUrl = await generateImageDataUrl(key, finalPrompt, detectImageFormat(lower));
              } catch {}
              if (dataUrl) {
                const done = [
                  "Voilà, elle est prête 🎨 Dis-moi ce que tu en penses, ou ce que tu veux que je change.",
                  "Et voilà ! Je l'ai terminée 💫 Tu veux qu'on l'ajuste, ou on part sur autre chose ?",
                  "C'est fini, la voilà 🎨 Raconte-moi ce que tu en penses.",
                  "Terminé ! Elle est là 💕 Tu la gardes comme ça ou je retouche un détail ?",
                  "Voilà le résultat ✨ Dis-moi si ça te plaît ou ce que tu imaginais autrement.",
                ];
                assistantText = done[Math.floor(Math.random() * done.length)];
              } else {
                assistantText = "Oh mince, l'image n'a pas réussi à sortir. Réessaie avec une description un peu plus précise 💕";
              }
              controller.enqueue(encoder.encode(assistantText));
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
            let holding = false; // once a "{" appears, buffer until the end (possible tool JSON)
            let held = "";
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
                      if (!holding && delta.includes("{")) holding = true;
                      if (holding) held += delta;
                      else controller.enqueue(encoder.encode(delta));
                    }
                  } catch {}
                }
              }
            } finally {
              // The model sometimes emits a { "action": "generate_image", "prompt": "..." }
              // block instead of triggering the image path. Honour it here.
              let dataUrl: string | null = null;
              const match = full.match(/\{[^{}]*"action"\s*:\s*"generate_image"[^{}]*\}/);
              if (match) {
                let imgPrompt = "";
                try {
                  imgPrompt = String(JSON.parse(match[0]).prompt ?? "");
                } catch {
                  imgPrompt = match[0].match(/"prompt"\s*:\s*"([^"]+)"/)?.[1] ?? "";
                }
                if (imgPrompt) {
                  try { dataUrl = await generateImageDataUrl(key, imgPrompt, detectImageFormat(imgPrompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))); } catch {}
                }
                full = full.replace(match[0], "").replace(/\n{3,}/g, "\n\n").trim();
                held = held.replace(match[0], "").replace(/\n{3,}/g, "\n\n");
              }
              if (held) controller.enqueue(encoder.encode(held));
              if (full) {
                await sb.from("web_messages").insert({
                  user_id: auth.userId,
                  role: "assistant",
                  content: full,
                  images: dataUrl ? [dataUrl] : [],
                });
              }
              controller.close();
            }
          },
        });
        return withWebCors(
          new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Lyra-Image": "1" },
          }),
        );
      },
    },
  },
});