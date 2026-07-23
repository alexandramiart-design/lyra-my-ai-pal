import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const NATIVE_AUTH_REDIRECT = "app.lovable.lyra://auth-callback";

export const Route = createFileRoute("/auth/native-callback")({
  head: () => ({
    meta: [
      { title: "Lyra — connexion app" },
      { name: "description", content: "Retour sécurisé vers l'application Lyra." },
      { property: "og:title", content: "Lyra — connexion app" },
      { property: "og:description", content: "Retour sécurisé vers l'application Lyra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NativeAuthCallback,
  ssr: false,
});

function NativeAuthCallback() {
  useEffect(() => {
    window.location.replace(`${NATIVE_AUTH_REDIRECT}${window.location.search}${window.location.hash}`);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
      <div>
        <h1 className="text-xl font-semibold">Connexion à Lyra…</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tu peux revenir dans l'application.</p>
      </div>
    </main>
  );
}