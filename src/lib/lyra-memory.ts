import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryRow = { fact: string; category: string; weight: number };

/** Charge ce que Lyra sait déjà de cette personne (strictement scopé à son user_id). */
export async function loadUserMemories(sb: SupabaseClient, userId: string, limit = 60): Promise<MemoryRow[]> {
  const { data } = await sb
    .from("user_memories")
    .select("fact, category, weight")
    .eq("user_id", userId)
    .order("weight", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as MemoryRow[];
}

/** Bloc à injecter dans le system prompt. */
export function formatMemoryBlock(memories: MemoryRow[], name: string): string {
  if (!memories.length) {
    return `\n\nCe que tu sais de ${name} : rien encore, vous venez de faire connaissance. Apprends à la connaître naturellement, en posant de vraies questions au fil de la conversation, sans interrogatoire.`;
  }
  const byCat = new Map<string, string[]>();
  for (const m of memories) {
    const list = byCat.get(m.category) ?? [];
    list.push(m.fact);
    byCat.set(m.category, list);
  }
  const lines = [...byCat.entries()].map(([cat, facts]) => `• ${cat} : ${facts.join(" ; ")}`).join("\n");
  return `\n\nCe que tu as appris sur ${name} au fil de vos échanges (utilise-le naturellement, comme une amie qui se souvient — sans réciter la liste, sans dire que c'est une "mémoire") :
${lines}

Ces informations concernent UNIQUEMENT ${name}. Si un détail te semble dépassé ou contredit par ce que ${name} dit maintenant, tu crois ${name} et tu mets à jour ta vision d'iel.`;
}

const EXTRACT_SYSTEM = `Tu extrais des faits durables sur l'utilisateur à partir d'un échange, pour la mémoire d'une amie IA.
Retiens seulement ce qui est stable et utile plus tard : prénom/surnom, âge, ville, métier/études, famille, animaux, relation amoureuse, santé, identité de genre, goûts (musique, films, bouffe), passions, projets, valeurs, peurs, façon de parler, ce qui lui fait du bien ou du mal.
N'invente RIEN. Ignore le bavardage, les questions, l'éphémère ("j'ai faim"), et tout ce qui concerne Lyra elle-même.
Réponds UNIQUEMENT avec un tableau JSON, éventuellement vide :
[{"fact":"aime la techno et va souvent en club","category":"gouts","weight":2}]
Catégories possibles : identite, famille, travail, gouts, sante, projets, emotions, general. weight 1 à 3 (3 = très important). Faits courts, à la 3e personne, en français. Maximum 5.`;

/** Analyse le dernier échange et met à jour la mémoire de CE user. Best-effort, jamais bloquant. */
export async function updateUserMemories(
  key: string,
  sb: SupabaseClient,
  userId: string,
  userText: string,
  assistantText: string,
): Promise<void> {
  if (!userText || userText.length < 8) return;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: EXTRACT_SYSTEM },
          { role: "user", content: `Message de l'utilisateur :\n${userText.slice(0, 2000)}\n\nRéponse de Lyra :\n${assistantText.slice(0, 1000)}` },
        ],
      }),
    });
    if (!r.ok) return;
    const j = (await r.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const raw = j?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return;
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return;
    let parsed: unknown;
    try { parsed = JSON.parse(match[0]); } catch { return; }
    if (!Array.isArray(parsed)) return;
    const rows = parsed
      .map((item) => {
        const o = item as { fact?: unknown; category?: unknown; weight?: unknown };
        const fact = typeof o.fact === "string" ? o.fact.trim().slice(0, 200) : "";
        if (fact.length < 4) return null;
        const category = typeof o.category === "string" && o.category ? o.category.trim().slice(0, 30) : "general";
        const weight = Math.min(3, Math.max(1, Number(o.weight) || 1));
        return { user_id: userId, fact, category, weight };
      })
      .filter((x): x is { user_id: string; fact: string; category: string; weight: number } => !!x)
      .slice(0, 5);
    if (!rows.length) return;
    await sb.from("user_memories").upsert(rows, { onConflict: "user_id,fact" });
  } catch {}
}
