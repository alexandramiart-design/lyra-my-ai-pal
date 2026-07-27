import { createFileRoute } from "@tanstack/react-router";
import { ALLOWED_EMAIL, requireAuthenticated, webCorsPreflight, withWebCors } from "@/lib/web-auth";

const GATEWAY = "https://connector-gateway.lovable.dev/github";
const OWNER = "alexandramiart-design";
const REPO = "lyra-my-ai-pal";
const WORKFLOW = "android-build.yml";

function gh(path: string, init?: RequestInit) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const ghKey = process.env.GITHUB_API_KEY;
  if (!lovableKey || !ghKey) throw new Error("Connexion GitHub non configurée");
  return fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": ghKey,
      ...(init?.headers ?? {}),
    },
  });
}

export const Route = createFileRoute("/api/web/github-build")({
  server: {
    handlers: {
      OPTIONS: async () => webCorsPreflight(),

      GET: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        if (auth.email !== ALLOWED_EMAIL) return withWebCors(new Response("Forbidden", { status: 403 }));
        try {
          const r = await gh(`/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`);
          const body = await r.text();
          if (!r.ok) return withWebCors(new Response(body, { status: r.status }));
          const j = JSON.parse(body) as {
            workflow_runs?: Array<{
              html_url: string; status: string; conclusion: string | null;
              created_at: string; run_number: number; head_sha: string;
            }>;
          };
          const run = j.workflow_runs?.[0] ?? null;
          return withWebCors(Response.json({ run }));
        } catch (e) {
          return withWebCors(new Response(String((e as Error).message), { status: 500 }));
        }
      },

      POST: async ({ request }) => {
        const auth = await requireAuthenticated(request);
        if (!auth.ok) return withWebCors(auth.response);
        if (auth.email !== ALLOWED_EMAIL) return withWebCors(new Response("Forbidden", { status: 403 }));
        try {
          const r = await gh(`/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
            method: "POST",
            body: JSON.stringify({ ref: "main" }),
          });
          if (!r.ok) {
            const body = await r.text();
            return withWebCors(new Response(body || "Échec du déclenchement", { status: r.status }));
          }
          return withWebCors(Response.json({ ok: true }));
        } catch (e) {
          return withWebCors(new Response(String((e as Error).message), { status: 500 }));
        }
      },
    },
  },
});