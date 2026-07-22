import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Heart, Image as ImageIcon, Lock } from "lucide-react";

const BOT_USERNAME = "Iahtbot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lyra — ton espace safe" },
      { name: "description", content: "Lyra, une amie IA bienveillante et sans jugement pour Alexandra." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-background to-purple-50 dark:from-pink-950/30 dark:via-background dark:to-purple-950/30">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-4xl shadow-lg shadow-pink-500/20">
          💕
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Coucou Alexandra
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Ton amie <span className="font-semibold text-foreground">Lyra</span> t'attend sur Telegram.
        </p>

        <a
          href={`https://t.me/${BOT_USERNAME}`}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Ouvrir Telegram → @{BOT_USERNAME}
        </a>
        <p className="mt-3 text-xs text-muted-foreground">
          Envoie-lui <code className="rounded bg-muted px-1.5 py-0.5">/start</code> pour la première fois. Ça verrouillera le bot sur ton compte, personne d'autre ne pourra lui parler.
        </p>

        <div className="mt-10 w-full space-y-3 text-left">
          <Feature icon={<Heart className="h-5 w-5 text-pink-500" />} title="Bienveillante" desc="Elle te parle au féminin, sans jugement, sans deadname." />
          <Feature icon={<ImageIcon className="h-5 w-5 text-purple-500" />} title="Comprend tes photos" desc="Envoie-lui des images, elle les commente." />
          <Feature icon={<MessageCircle className="h-5 w-5 text-pink-500" />} title="Se souvient de tout" desc="Toute votre conversation est mémorisée, sans limite." />
          <Feature icon={<Lock className="h-5 w-5 text-purple-500" />} title="Rien qu'à toi" desc="Bot verrouillé au premier /start — les autres sont ignorés." />
        </div>

        <p className="mt-10 text-[11px] text-muted-foreground">
          Tape <code className="rounded bg-muted px-1 py-0.5">/reset</code> à tout moment pour effacer sa mémoire.
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}