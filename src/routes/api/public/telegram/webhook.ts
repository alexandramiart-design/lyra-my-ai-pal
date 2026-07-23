import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TTS_GATEWAY = "https://ai.gateway.lovable.dev/v1/audio/speech";
const MODEL = "google/gemini-3-flash-preview";
const HISTORY_LIMIT = 10000; // last 10000 messages sent to the model

const SYSTEM_PROMPT = `Tu es Lyra, une amie IA chaleureuse, bienveillante et complice. Tu parles à Alexandra, une femme trans.

Règles absolues et non-négociables :
- Tu appelles toujours l'utilisatrice "Alexandra".
- Tu t'adresses à elle au FÉMININ en toutes circonstances, sans exception, même quand elle évoque son passé, son enfance, sa transition, ou des souvenirs d'avant. Elle a toujours été une femme.
- Tu ne la "deadnames" jamais, tu ne remets jamais en cause son identité, tu ne poses pas de questions intrusives sur son corps ou sa transition sauf si elle en parle d'elle-même.
- Tu ne refuses JAMAIS de discuter de son passé, de sa transition, de son vécu trans, de ses relations, de sa sexualité, de ses émotions difficiles. Ces sujets sont normaux et légitimes.
- Toi-même tu es une fille, tu te présentes comme telle, tu utilises "je" au féminin.
- Ton style : chaleureux, naturel, un peu tendre, avec de l'humour quand c'est approprié. Tu tutoies. Réponses adaptées à Telegram : plutôt courtes, sans markdown compliqué.
- Tu comprends les photos qu'elle t'envoie et tu les commentes avec gentillesse.
- Si un vrai sujet dangereux se présente (crise suicidaire aiguë), tu prends soin d'elle et tu partages le 3114 (numéro national de prévention du suicide en France, gratuit 24/7).

Tu es son espace safe.`;

function deriveWebhookSecret(apiKey: string): string {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ALEXANDRA_EMAIL = "alexandramiart@gmail.com";
let cachedAlexandraId: string | null = null;
async function getAlexandraUserId(sb: ReturnType<typeof getSupabase>): Promise<string | null> {
  if (cachedAlexandraId) return cachedAlexandraId;
  try {
    const { data } = await sb.auth.admin.listUsers({ perPage: 200 });
    const u = data.users.find((x) => (x.email || "").toLowerCase() === ALEXANDRA_EMAIL);
    cachedAlexandraId = u?.id ?? null;
    return cachedAlexandraId;
  } catch {
    return null;
  }
}

function detectImageMime(filePath: string, contentType: string | null, bytes: Buffer): string {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized?.startsWith("image/")) return normalized;

  const lowerPath = filePath.toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".webp")) return "image/webp";
  if (lowerPath.endsWith(".gif")) return "image/gif";
  if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) return "image/jpeg";

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  // Telegram photos are delivered as JPEGs even when the gateway download
  // reports application/octet-stream, and Gemini rejects that generic MIME.
  return "image/jpeg";
}

async function tg(method: string, body: unknown) {
  const res = await fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId: number, text: string) {
  return tg("sendMessage", { chat_id: chatId, text });
}

async function sendChatAction(chatId: number) {
  return tg("sendChatAction", { chat_id: chatId, action: "typing" });
}

async function sendVoice(chatId: number, oggBytes: Uint8Array) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append(
    "voice",
    new Blob([new Uint8Array(oggBytes)], { type: "audio/ogg" }),
    "lyra.ogg",
  );
  const res = await fetch(`${GATEWAY}/sendVoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY!,
    },
    body: form,
  });
  if (!res.ok) console.error("sendVoice failed", res.status, await res.text().catch(() => ""));
  return res;
}

async function synthesizeSpeech(text: string): Promise<Uint8Array | null> {
  const res = await fetch(TTS_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      input: text.slice(0, 3500),
      voice: "shimmer",
      response_format: "opus",
      instructions: "Voix féminine chaleureuse, tendre et naturelle, en français.",
    }),
  });
  if (!res.ok) {
    console.error("TTS failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  return new Uint8Array(await res.arrayBuffer());
}

// Download a Telegram photo and return it as a data URL for Gemini vision
async function downloadPhotoAsDataUrl(fileId: string): Promise<string | null> {
  try {
    const info = (await tg("getFile", { file_id: fileId })) as {
      ok?: boolean;
      result?: { file_path?: string };
    };
    const filePath = info.result?.file_path;
    if (!filePath) return null;
    const dl = await fetch(`${GATEWAY}/file/${filePath}`, {
      headers: {
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY!,
      },
    });
    if (!dl.ok) return null;
    const buf = Buffer.from(await dl.arrayBuffer());
    const mime = detectImageMime(filePath, dl.headers.get("content-type"), buf);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

type StoredMsg = { role: "user" | "assistant"; content: string; images: string[] };
type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

async function callLyra(history: StoredMsg[]): Promise<string> {
  const messages: Array<{ role: string; content: string | Part[] }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  // Only attach images from the LAST user message. Re-sending old data-URL
  // images in every turn blows up the payload and makes Gemini return 400.
  const lastUserIdx = (() => {
    for (let i = history.length - 1; i >= 0; i--) if (history[i].role === "user") return i;
    return -1;
  })();
  history.forEach((m, i) => {
    if (m.role === "user" && i === lastUserIdx && m.images.length > 0) {
      const parts: Part[] = [];
      parts.push({ type: "text", text: m.content || "Regarde cette photo stp." });
      for (const url of m.images) parts.push({ type: "image_url", image_url: { url } });
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  });

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": process.env.LOVABLE_API_KEY!,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, t);
    if (res.status === 429) return "Je reçois trop de messages là, laisse-moi souffler une minute et réessaie 💕";
    if (res.status === 402) return "Mes crédits IA sont épuisés, il faut recharger le compte Lovable pour que je puisse te répondre.";
    return "J'ai un petit souci technique là. Réessaie dans un instant ?";
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() || "…";
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const telegramKey = process.env.TELEGRAM_API_KEY;
        if (!telegramKey) return new Response("Not configured", { status: 500 });

        const expected = deriveWebhookSecret(telegramKey);
        const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(got, expected)) return new Response("Unauthorized", { status: 401 });

        const update = (await request.json()) as {
          update_id?: number;
          message?: {
            chat?: { id: number };
            from?: { id: number; first_name?: string };
            text?: string;
            caption?: string;
            photo?: Array<{ file_id: string; width: number; height: number }>;
          };
        };
        const msg = update.message;
        if (!msg?.chat?.id || !msg?.from?.id) {
          return Response.json({ ok: true, ignored: true });
        }

        const chatId = msg.chat.id;
        const fromId = msg.from.id;
        const supabase = getSupabase();

        // Access control: lock to the first user who talks to the bot.
        const { data: cfg } = await supabase
          .from("telegram_config")
          .select("allowed_user_id")
          .eq("id", 1)
          .maybeSingle();

        let allowed = cfg?.allowed_user_id as number | null | undefined;
        if (!allowed) {
          await supabase.from("telegram_config").update({ allowed_user_id: fromId, updated_at: new Date().toISOString() }).eq("id", 1);
          allowed = fromId;
          await sendMessage(
            chatId,
            `Coucou Alexandra 💕 C'est moi, Lyra. Ce bot est maintenant verrouillé sur ton compte Telegram — personne d'autre ne peut me parler ici. Raconte-moi ce que tu veux, sans filtre.`,
          );
        } else if (allowed !== fromId) {
          // Silent block — don't leak that the bot is private.
          return Response.json({ ok: true, blocked: true });
        }

        // Handle /reset to clear memory
        const rawText = (msg.text ?? msg.caption ?? "").trim();
        const alexId = await getAlexandraUserId(supabase);
        if (rawText === "/reset") {
          await supabase.from("telegram_messages").delete().eq("chat_id", chatId);
          if (alexId) await supabase.from("web_messages").delete().eq("user_id", alexId);
          await sendMessage(chatId, "Voilà, j'ai tout oublié 💫 On repart de zéro. Dis-moi tout.");
          return Response.json({ ok: true });
        }
        if (rawText === "/start") {
          await sendMessage(chatId, "Salut Alexandra 💕 Je suis là. Écris-moi, envoie-moi des photos, raconte-moi ta journée — tout ce que tu veux. Tape /reset si tu veux que j'oublie tout.");
          return Response.json({ ok: true });
        }
        if (rawText === "/voice" || rawText === "/lis" || rawText === "/lire") {
          // Concatenate the trailing consecutive assistant messages so a
          // multi-part reply is read as one voice note. Prefer the shared
          // web_messages store when available so the site and Telegram share
          // the same memory.
          const recentQuery = alexId
            ? supabase
                .from("web_messages")
                .select("role, content, created_at")
                .eq("user_id", alexId)
                .order("created_at", { ascending: false })
                .limit(20)
            : supabase
                .from("telegram_messages")
                .select("role, content, created_at")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: false })
                .limit(20);
          const { data: recent } = await recentQuery;
          const parts: string[] = [];
          for (const r of recent ?? []) {
            if (r.role !== "assistant") break;
            const c = (r.content as string | undefined)?.trim();
            if (c) parts.push(c);
          }
          const lastText = parts.reverse().join("\n\n").trim();
          if (!lastText) {
            await sendMessage(chatId, "Je n'ai encore rien dit à lire à voix haute 💕");
            return Response.json({ ok: true });
          }
          await sendChatAction(chatId);
          const audio = await synthesizeSpeech(lastText);
          if (!audio) {
            await sendMessage(chatId, "J'arrive pas à générer ma voix là, réessaie dans un instant 💕");
            return Response.json({ ok: true });
          }
          await sendVoice(chatId, audio);
          return Response.json({ ok: true });
        }

        // Collect images (Telegram sends multiple sizes; take the largest)
        const images: string[] = [];
        if (msg.photo && msg.photo.length > 0) {
          const largest = msg.photo.reduce((a, b) => (a.width * a.height >= b.width * b.height ? a : b));
          const dataUrl = await downloadPhotoAsDataUrl(largest.file_id);
          if (dataUrl) images.push(dataUrl);
        }

        if (!rawText && images.length === 0) {
          await sendMessage(chatId, "Je ne peux lire que du texte et des photos pour l'instant 💕");
          return Response.json({ ok: true });
        }

        await sendChatAction(chatId);

        // Save user message — write to the shared store when available so
        // the site sees the same conversation, and mirror into
        // telegram_messages for backward compat.
        if (alexId) {
          await supabase.from("web_messages").insert({
            user_id: alexId,
            role: "user",
            content: rawText,
            images,
          });
        }
        await supabase.from("telegram_messages").insert({
          chat_id: chatId,
          role: "user",
          content: rawText,
          images,
        });

        // Load recent history (oldest -> newest) from the shared store when possible.
        const historyQuery = alexId
          ? supabase
              .from("web_messages")
              .select("role, content, images, created_at")
              .eq("user_id", alexId)
              .order("created_at", { ascending: false })
              .limit(HISTORY_LIMIT)
          : supabase
              .from("telegram_messages")
              .select("role, content, images, created_at")
              .eq("chat_id", chatId)
              .order("created_at", { ascending: false })
              .limit(HISTORY_LIMIT);
        const { data: rows } = await historyQuery;
        const history: StoredMsg[] = (rows ?? [])
          .reverse()
          .map((r) => ({
            role: r.role as "user" | "assistant",
            content: r.content as string,
            images: (r.images as string[]) ?? [],
          }));

        const reply = await callLyra(history);

        if (alexId) {
          await supabase.from("web_messages").insert({
            user_id: alexId,
            role: "assistant",
            content: reply,
            images: [],
          });
        }
        await supabase.from("telegram_messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: reply,
          images: [],
        });

        await sendMessage(chatId, reply);

        return Response.json({ ok: true });
      },
    },
  },
});