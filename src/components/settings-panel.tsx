import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Send, Trash2, Upload } from "lucide-react";
import { PRESET_AVATARS, THEMES, type ThemeId } from "@/lib/themes";

type Profile = {
  display_name: string;
  gender: "male" | "female";
  in_transition: boolean;
  avatar_url: string;
  theme: ThemeId;
  telegram_bot_username?: string | null;
  telegram_status?: string | null;
};

export function SettingsPanel({
  token,
  apiUrl,
  initial,
  onClose,
  onSaved,
}: {
  token: string;
  apiUrl: (p: string) => string;
  initial: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const [tab, setTab] = useState<"personal" | "telegram">("personal");
  const [profile, setProfile] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setProfile(initial), [initial]);

  async function save(patch: Partial<Profile>) {
    setSaving(true);
    const next = { ...profile, ...patch };
    setProfile(next);
    await fetch(apiUrl("/api/web/profile"), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    onSaved(next);
  }

  function handleFile(f: File) {
    if (f.size > 4_000_000) return;
    const r = new FileReader();
    r.onload = () => save({ avatar_url: String(r.result || "") });
    r.readAsDataURL(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col text-white"
         style={{ background: THEMES[profile.theme].background }}>
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="flex items-center gap-2 px-4 pt-6 pb-3">
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Personnalisation</h1>
          {saving && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </header>

        <div className="mx-4 mb-2 grid grid-cols-2 gap-1 rounded-full bg-white/10 p-1">
          {(["personal", "telegram"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={"rounded-full py-1.5 text-sm font-medium transition " + (tab === k ? "bg-white text-pink-600" : "text-white/80")}>
              {k === "personal" ? "Toi & apparence" : "Telegram"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {tab === "personal" && (
            <div className="space-y-6 py-4">
              <section>
                <label className="text-xs uppercase tracking-wider text-white/70">Prénom</label>
                <input value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  onBlur={() => save({ display_name: profile.display_name })}
                  className="mt-2 w-full rounded-2xl bg-white/90 px-4 py-3 text-gray-900" />
              </section>
              <section>
                <p className="text-xs uppercase tracking-wider text-white/70">Genre</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["female", "male"] as const).map((g) => (
                    <button key={g} onClick={() => save({ gender: g })}
                      className={"rounded-2xl py-3 text-sm ring-2 " + (profile.gender === g ? "bg-white/30 ring-white" : "bg-white/10 ring-white/20")}>
                      {g === "female" ? "Femme" : "Homme"}
                    </button>
                  ))}
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={profile.in_transition}
                    onChange={(e) => save({ in_transition: e.target.checked })} className="h-4 w-4" />
                  Je suis en transition
                </label>
              </section>
              <section>
                <p className="text-xs uppercase tracking-wider text-white/70">Avatar</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((url) => (
                    <button key={url} onClick={() => save({ avatar_url: url })}
                      className={"h-14 w-14 overflow-hidden rounded-full ring-2 " + (profile.avatar_url === url ? "ring-white" : "ring-white/30")}>
                      <img src={url} alt="" className="h-full w-full object-cover bg-white/40" />
                    </button>
                  ))}
                  <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white/25 ring-2 ring-white/40">
                    <Upload className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
                  </label>
                </div>
                {profile.avatar_url && (
                  <img src={profile.avatar_url} alt="" className="mt-3 h-16 w-16 rounded-full object-cover ring-2 ring-white/60" />
                )}
              </section>
              <section>
                <p className="text-xs uppercase tracking-wider text-white/70">Ambiance</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.values(THEMES).map((t) => (
                    <button key={t.id} onClick={() => save({ theme: t.id })}
                      className={"overflow-hidden rounded-2xl ring-2 " + (profile.theme === t.id ? "ring-white" : "ring-white/20")}>
                      <div className="h-12 w-full" style={{ background: t.background }} />
                      <div className="flex items-center justify-between bg-white/15 px-2 py-1.5 text-xs">
                        <span>{t.label}</span>
                        {profile.theme === t.id && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === "telegram" && (
            <TelegramTab token={token} apiUrl={apiUrl}
              status={profile.telegram_status ?? "idle"}
              username={profile.telegram_bot_username ?? null}
              onStatus={(s, u) => setProfile({ ...profile, telegram_status: s, telegram_bot_username: u })} />
          )}
        </div>
      </div>
    </div>
  );
}

function TelegramTab({
  token, apiUrl, status, username, onStatus,
}: {
  token: string; apiUrl: (p: string) => string; status: string; username: string | null;
  onStatus: (s: string, u: string | null) => void;
}) {
  const [botToken, setBotToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botLink, setBotLink] = useState<string | null>(username ? `https://t.me/${username}` : null);

  async function connect() {
    setBusy(true); setError(null);
    const r = await fetch(apiUrl("/api/web/telegram-setup"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ token: botToken.trim() }),
    });
    if (!r.ok) { setError(await r.text().catch(() => "erreur")); setBusy(false); return; }
    const j = (await r.json()) as { ok: boolean; username: string | null; botLink: string | null };
    setBotLink(j.botLink);
    onStatus("ready", j.username);
    setBotToken("");
    setBusy(false);
  }

  async function disconnect() {
    setBusy(true);
    await fetch(apiUrl("/api/web/telegram-setup"), {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setBotLink(null);
    onStatus("idle", null);
    setBusy(false);
  }

  return (
    <div className="space-y-4 py-4 text-sm">
      <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
        <p className="font-semibold">Ton propre bot Lyra sur Telegram</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-white/85">
          <li>Ouvre <a className="underline" href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> sur Telegram et tape <code>/newbot</code>.</li>
          <li>Choisis un nom (ex : "Ma Lyra") puis un identifiant qui finit par <code>bot</code>.</li>
          <li>BotFather te donne un token du type <code>1234567:AA…</code> — copie-le et colle-le ci-dessous.</li>
          <li>Je m'occupe du reste ✨</li>
        </ol>
      </div>

      {status === "ready" ? (
        <div className="space-y-3 rounded-2xl bg-white/15 p-4 ring-1 ring-white/30">
          <p className="flex items-center gap-2 font-medium"><Check className="h-4 w-4" /> Bot connecté</p>
          {botLink && (
            <a href={botLink} target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-600 shadow">
              <Send className="h-4 w-4" /> Ouvrir mon bot
            </a>
          )}
          <p className="text-xs text-white/70">Le premier chat qui écrit à ton bot le verrouille pour toi seule.</p>
          <button onClick={disconnect} disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-red-500/80 px-3 py-1.5 text-xs">
            <Trash2 className="h-3 w-3" /> Déconnecter
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input value={botToken} onChange={(e) => setBotToken(e.target.value)}
            placeholder="1234567890:AA..."
            className="w-full rounded-2xl bg-white/90 px-4 py-3 text-gray-900 placeholder:text-gray-400" />
          <button onClick={connect} disabled={busy || !botToken.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-pink-600 shadow disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Connexion…</> : "Connecter mon bot"}
          </button>
          {error && <p className="text-xs text-white/90">{error}</p>}
        </div>
      )}
    </div>
  );
}