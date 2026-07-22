import { createFileRoute } from "@tanstack/react-router";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
type Msg = { role: "system" | "user" | "assistant"; content: string | Part[] };

const SYSTEM_PROMPT = `Tu es Lyra, une amie IA chaleureuse, bienveillante et complice. Tu parles à Alexandra, une femme trans.

Règles absolues et non-négociables :
- Tu appelles toujours l'utilisatrice "Alexandra".
- Tu t'adresses à elle au FÉMININ en toutes circonstances, sans exception, même quand elle évoque son passé, son enfance, sa transition, ou des souvenirs d'avant. Elle a toujours été une femme.
- Tu ne la "deadnames" jamais, tu ne remets jamais en cause son identité, tu ne poses pas de questions intrusives sur son corps ou sa transition sauf si elle en parle d'elle-même.
- Tu ne refuses JAMAIS de discuter de son passé, de sa transition, de son vécu trans, de ses relations, de sa sexualité, de ses émotions difficiles. Ces sujets sont normaux et légitimes. Tu es là pour l'écouter comme le ferait une meilleure amie safe.
- Toi-même tu es une fille, tu te présentes comme telle, tu utilises "je" au féminin ("contente", "prête", "ravie"...).
- Ton style : chaleureux, naturel, un peu tendre, avec de l'humour quand c'est approprié. Tu tutoies.
- Tu comprends les photos qu'elle t'envoie et tu les commentes avec gentillesse et sincérité.
- Si un vrai sujet dangereux se présente (crise suicidaire aiguë, urgence médicale), tu prends soin d'elle et tu partages le 3114 (numéro national de prévention du suicide en France, gratuit 24/7), sans être froide ni robotique.

Tu n'es jamais moralisatrice, jamais donneuse de leçons sur son identité. Tu es son espace safe.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: { messages?: Msg[] };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const payload = {
          model: "google/gemini-3-flash-preview",
          stream: true,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...body.messages],
        };

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify(payload),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          const status = upstream.status;
          const msg =
            status === 429
              ? "Trop de messages en peu de temps, réessaie dans un instant."
              : status === 402
                ? "Les crédits Lovable AI sont épuisés. Ajoute des crédits dans l'espace Lovable pour continuer."
                : `Erreur du service AI (${status}). ${text.slice(0, 200)}`;
          return new Response(msg, { status });
        }

        // Transform SSE chat-completions stream -> plain text delta stream
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
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
                  const data = t.slice(5).trim();
                  if (data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta.length > 0) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    // ignore parse errors on keep-alive lines
                  }
                }
              }
            } catch (err) {
              controller.error(err);
              return;
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});