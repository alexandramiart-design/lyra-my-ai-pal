import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticated, webCorsPreflight, withWebCors } from "@/lib/web-auth";

export const Route = createFileRoute("/api/web/transcribe")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),
      POST: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return withWebCors(new Response("Missing LOVABLE_API_KEY", { status: 500 }));

        const inForm = await request.formData();
        const file = inForm.get("file");
        if (!(file instanceof Blob)) return withWebCors(new Response("file required", { status: 400 }));

        // Guard against silence / near-empty audio → sinon gpt-4o-transcribe
        // hallucine des phrases ("Merci.", "Sous-titres…", ou reprend le prompt).
        // Seuil relevé : en dessous de ~25 Ko webm/opus = quasi silence/bruit.
        if (file.size < 25000) {
          return withWebCors(Response.json({ text: "" }));
        }

        const outForm = new FormData();
        outForm.append("file", file, "audio.webm");
        outForm.append("model", "openai/gpt-4o-transcribe");
        // Force French recognition — bare ISO-639-1 code.
        outForm.append("language", "fr");
        // Pas de prompt de biais — injecter des prénoms ou du vocabulaire
        // pousse le modèle à halluciner ces mots quand l'utilisateur ne parle pas.
        // Température basse pour limiter davantage les hallucinations.
        outForm.append("temperature", "0");

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
        const raw = String(j.text ?? "").trim();
        // Filtre anti-hallucinations Whisper connues (silence → phrases parasites)
        const norm = raw.toLowerCase().replace(/[.!?…,'"«»\s]+/g, " ").trim();
        const HALLUCINATIONS = [
          "merci", "merci .", "merci d avoir regarde", "merci d avoir regarde cette video",
          "sous titres realises par la communaute d amara org",
          "sous titrage st 501", "sous titres", "abonnez vous",
          "je vous remercie", "a bientot", "au revoir", "salut",
          "bonne journee", "bonne soiree", "hello", "hello world", "bonjour", "bonsoir", "…", ".",
        ];
        const HALLUCINATION_PREFIXES = [
          "sous titres", "sous titrage", "merci d avoir regarde",
          "abonnez vous", "n hesitez pas a", "like et abonnez",
          "merci a tous", "a la prochaine",
        ];
        const isHallucinationPrefix = HALLUCINATION_PREFIXES.some((p) => norm.startsWith(p));
        // Filtre aussi les transcriptions ultra-courtes (1-2 mots) qui sont
        // presque toujours des hallucinations sur du silence.
        const wordCount = norm.split(" ").filter(Boolean).length;
        if (!raw || raw.length < 4 || wordCount < 2 || HALLUCINATIONS.includes(norm) || isHallucinationPrefix) {
          return withWebCors(Response.json({ text: "" }));
        }
        if (wordCount <= 2 && raw.length <= 16) {
          return withWebCors(Response.json({ text: "" }));
        }
        // Rejette aussi les répétitions du même mot (autre pattern d'hallu Whisper)
        const words = norm.split(" ").filter(Boolean);
        const unique = new Set(words);
        if (words.length >= 3 && unique.size === 1) {
          return withWebCors(Response.json({ text: "" }));
        }
        return withWebCors(Response.json({ text: raw }));
      },
    },
  },
});