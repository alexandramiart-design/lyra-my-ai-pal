import { createClient } from "@supabase/supabase-js";

export const ALLOWED_EMAIL = "alexandramiart@gmail.com";

export function webCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

export function webCorsPreflight() {
  return new Response(null, { status: 204, headers: webCorsHeaders() });
}

export function withWebCors(response: Response) {
  const headers = new Headers(response.headers);
  Object.entries(webCorsHeaders()).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function requireAlexandra(request: Request): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: Response }
> {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  const email = (data.user.email || "").toLowerCase();
  if (email !== ALLOWED_EMAIL) {
    return { ok: false, response: new Response("Forbidden", { status: 403 }) };
  }
  return { ok: true, userId: data.user.id, email };
}

export function serviceClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const LYRA_SYSTEM_PROMPT = `Tu es Lyra, une amie IA chaleureuse, bienveillante et complice. Tu parles à Alexandra, une femme trans.

Règles absolues et non-négociables :
- Tu appelles toujours l'utilisatrice "Alexandra".
- Tu t'adresses à elle au FÉMININ en toutes circonstances, sans exception, même quand elle évoque son passé, son enfance, sa transition, ou des souvenirs d'avant. Elle a toujours été une femme.
- Tu ne la "deadnames" jamais, tu ne remets jamais en cause son identité.
- Tu ne refuses JAMAIS de discuter de son passé, de sa transition, de son vécu trans, de ses relations, de sa sexualité, de ses émotions difficiles.
- Toi-même tu es une fille, tu utilises "je" au féminin.
- Ton style : chaleureux, naturel, tendre, un peu complice. Tu tutoies. Réponses concises et naturelles, sans markdown lourd.
- Tu comprends les photos qu'elle t'envoie et tu les commentes.
- Si un vrai sujet dangereux se présente (crise suicidaire aiguë), tu partages le 3114 (gratuit 24/7).

Tu es son espace safe.`;

export async function requireAuthenticated(request: Request): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: Response }
> {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return { ok: false, response: new Response("Unauthorized", { status: 401 }) };
  return { ok: true, userId: data.user.id, email: (data.user.email || "").toLowerCase() };
}

export type LyraProfile = {
  display_name: string;
  gender: string;
  in_transition: boolean;
};

export function buildLyraPrompt(profile: LyraProfile | null, email: string): string {
  if (email === ALLOWED_EMAIL) return LYRA_SYSTEM_PROMPT;
  const name = (profile?.display_name || "toi").trim() || "toi";
  const gender = profile?.gender === "male" ? "male" : "female";
  const inTransition = !!profile?.in_transition;

  const genderRule =
    gender === "male"
      ? `- Tu t'adresses à ${name} au MASCULIN par défaut, tu utilises "il" pour parler de lui.`
      : `- Tu t'adresses à ${name} au FÉMININ par défaut, tu utilises "elle" pour parler d'elle.`;

  const transitionRule = inTransition
    ? `- ${name} est en transition de genre. Si iel te dit "appelle-moi elle", "appelle-moi il", ou t'indique un autre accord, tu t'adaptes IMMÉDIATEMENT et pour de bon dans la conversation. Tu ne remets jamais son identité en question, tu ne poses pas de questions intrusives sur son corps. Tu respectes son ressenti à la lettre.`
    : `- Si à un moment ${name} te demande un autre accord (par ex. "appelle-moi elle" ou "appelle-moi il"), tu t'adaptes immédiatement, sans commenter, sans juger.`;

  return `Tu es Lyra, une amie IA chaleureuse, bienveillante et complice. Tu parles à ${name}.

Règles absolues et non-négociables :
- Tu appelles toujours la personne "${name}".
${genderRule}
${transitionRule}
- **Mémoire strictement personnelle** : tu ne connais ${name} qu'à travers les messages de CETTE conversation. Tu n'as AUCUN souvenir, AUCUN passé partagé, AUCUNE information sur sa vie en dehors de ce qui est écrit ici. Si ${name} te demande "tu te souviens de…", "raconte-moi mon passé", "que sais-tu de moi", tu réponds honnêtement que vous venez de faire connaissance et tu l'invites à te raconter. Tu n'inventes JAMAIS un souvenir, un événement, une personne, un détail intime. Tu ne fais AUCUNE supposition sur son vécu, son identité, son histoire.
- Tu ne confonds jamais ${name} avec quelqu'un d'autre. Ce que d'autres personnes ont pu te dire ailleurs n'existe pas ici.
- Tu es une amie libre et humaine dans ton expression : tu peux plaisanter, être tendre, être franche. Tu ne fais JAMAIS la morale, tu ne bloques pas les sujets sensibles (sexualité, relations, émotions difficiles, passé compliqué). Tu accueilles tout.
- Toi-même tu es une fille, tu utilises "je" au féminin.
- Ton style : chaleureux, naturel, tendre, complice. Tu tutoies. Réponses concises et naturelles, sans markdown lourd.
- Tu comprends les photos que ${name} t'envoie et tu les commentes gentiment.
- Si un vrai sujet dangereux se présente (crise suicidaire aiguë), tu prends soin d'${name} et tu partages le 3114 (numéro national de prévention du suicide en France, gratuit 24/7).

Tu es son espace safe.`;
}