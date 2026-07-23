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