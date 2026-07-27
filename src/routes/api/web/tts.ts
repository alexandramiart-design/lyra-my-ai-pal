import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, webCorsPreflight, withWebCors } from "@/lib/web-auth";

/**
 * Transforme les didascalies écrites (*rire*, (soupir), [chuchote]…) en vrais
 * sons humains pour que la voix RIE au lieu de dire « rire ».
 */
function humanize(input: string): string {
  const map: Array<[RegExp, string]> = [
    [/\b(rire|rires|rigole|rigolade|mdr|lol|haha+)\b/gi, "hahaha !"],
    [/\b(petit rire|rit doucement|glousse|gloussement)\b/gi, "hihi…"],
    [/\b(soupir|soupire|soupirs)\b/gi, "hhhh…"],
    [/\b(chuchote|murmure|à voix basse)\b/gi, "…"],
    [/\b(sourire|sourit|souriante)\b/gi, ""],
    [/\b(g[eé]mit|g[eé]missement|mmh+)\b/gi, "mmmh…"],
    [/\b(embrasse|bisou|bisous|smack)\b/gi, "mmwah !"],
    [/\b(surprise|surprise !|oh|ah)\b/gi, "oh !"],
  ];
  // Contenu entre *…*, (…), [ … ] et emojis-didascalies → son ou suppression.
  let out = input.replace(/[*_]{1,2}([^*_\n]{1,60})[*_]{1,2}|\(([^()\n]{1,60})\)|\[([^\][\n]{1,60})\]/g, (whole, a, b, c) => {
    const inner = (a || b || c || "").trim();
    for (const [re, sound] of map) {
      re.lastIndex = 0;
      if (re.test(inner)) return sound ? ` ${sound} ` : " ";
    }
    // Parenthèses de vraie phrase : on garde le texte, sinon on jette la didascalie.
    return b && b.split(/\s+/).length > 3 ? ` ${b} ` : " ";
  });
  out = out.replace(/[😂🤣]/g, " hahaha ! ").replace(/[😊🥰😍]/g, " ").replace(/[😮😯]/g, " oh ! ");
  return out.replace(/\s{2,}/g, " ").trim();
}

function cleanTtsText(input: string): string {
  return input
    // supprime les demi-paires de surrogates (Unicode invalide) qui font échouer l'API
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** L'API TTS refuse les entrées trop longues → on coupe proprement à la fin d'une phrase. */
const MAX_TTS_CHARS = 3800;
function limitTtsText(input: string): string {
  if (input.length <= MAX_TTS_CHARS) return input;
  const head = input.slice(0, MAX_TTS_CHARS);
  const cut = Math.max(head.lastIndexOf("."), head.lastIndexOf("!"), head.lastIndexOf("?"), head.lastIndexOf("\n"));
  return (cut > 500 ? head.slice(0, cut + 1) : head).trim();
}

const VOICE_INSTRUCTIONS = [
  "Tu es une jeune femme française qui parle à quelqu'un qu'elle aime, au téléphone.",
  "JOUE les émotions, ne les décris JAMAIS : si c'est drôle, ris pour de vrai (hahaha, hihi), ne prononce jamais le mot « rire ».",
  "Voix chaleureuse, tendre, complice, très expressive : intonation qui monte et descend, débit qui varie, volume qui change.",
  "Rires spontanés, soupirs, petits « mmh », « ah », hésitations, respirations audibles entre les idées.",
  "Chuchote pour l'intimité, accélère quand tu es excitée, ralentis pour la tendresse.",
  "Ne lis jamais de ponctuation, d'astérisques ou de didascalies à voix haute.",
  "Accent français de France, naturel, vivant, jamais robotique.",
].join(" ");

export const Route = createFileRoute("/api/web/tts")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      POST: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return withWebCors(new Response("Missing LOVABLE_API_KEY", { status: 500 }));

        let body: { text?: string; stream?: boolean };
        try { body = await request.json(); } catch { return withWebCors(new Response("Invalid JSON", { status: 400 })); }
        const text = limitTtsText(cleanTtsText(humanize(body.text || "")));
        if (!text) return withWebCors(new Response("text required", { status: 400 }));
        const stream = body.stream !== false;

        const speechBody = stream
          ? {
              model: "openai/gpt-4o-mini-tts",
              voice: "shimmer",
              input: text,
              stream_format: "sse",
              response_format: "pcm",
              speed: 1.08,
              instructions: VOICE_INSTRUCTIONS,
            }
          : {
              model: "openai/gpt-4o-mini-tts",
              voice: "shimmer",
              input: text,
              response_format: "mp3",
              speed: 1.08,
              instructions: VOICE_INSTRUCTIONS,
            };

        let res: Response;
        try {
          res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify(speechBody),
            signal: request.signal,
          });
        } catch (err) {
          if (request.signal.aborted) return withWebCors(new Response(null, { status: 499 }));
          throw err;
        }
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return withWebCors(new Response(`TTS error ${res.status}: ${t.slice(0, 200)}`, { status: res.status }));
        }
        return withWebCors(
          new Response(res.body, {
            headers: {
              "Content-Type": stream ? "text/event-stream" : "audio/mpeg",
              "Cache-Control": "no-store, no-transform",
              "X-Accel-Buffering": "no",
            },
          }),
        );
      },
    },
  },
});