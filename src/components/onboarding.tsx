import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Upload, User as UserIcon } from "lucide-react";
import { THEME_LIST, getTheme, DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";
import { avatarsFor, type Gender } from "@/lib/user-avatars";
import { LYRA_AVATARS, DEFAULT_LYRA_AVATAR } from "@/lib/lyra-avatars";

export type OnboardingResult = {
  display_name: string;
  gender: Gender;
  avatar_url: string;
  lyra_avatar_url: string;
  theme: ThemeId;
};

export function Onboarding({
  token,
  onDone,
  apiUrl,
}: {
  token: string;
  onDone: (r: OnboardingResult) => void;
  apiUrl: (p: string) => string;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [lyraAvatar, setLyraAvatar] = useState<string>(DEFAULT_LYRA_AVATAR);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const active = getTheme(theme);
  const avatarChoices = avatarsFor(gender);

  function handleFile(f: File) {
    if (f.size > 4_000_000) { setErr("Image trop grosse (max 4 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  function handleLyraFile(f: File) {
    if (f.size > 4_000_000) { setErr("Image trop grosse (max 4 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = () => setLyraAvatar(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  async function finish() {
    if (!name.trim() || !gender) return;
    setSaving(true); setErr(null);
    const body = {
      display_name: name.trim(),
      gender,
      avatar_url: avatar || avatarChoices[0],
      lyra_avatar_url: lyraAvatar || DEFAULT_LYRA_AVATAR,
      theme,
      onboarded: true,
    };
    const r = await fetch(apiUrl("/api/web/profile"), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) { setErr(await r.text().catch(() => "erreur")); setSaving(false); return; }
    onDone({ ...body, avatar_url: body.avatar_url });
  }

  const canNext = [
    () => name.trim().length > 0 && !!gender,
    () => avatar.length > 0,
    () => lyraAvatar.length > 0,
    () => true,
    () => true,
  ][step]?.() ?? true;

  return (
    <div className="h-[100dvh] w-full text-white relative overflow-hidden"
         style={{ background: active.background }}>
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col px-6 pt-10 pb-6">
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-white" : "bg-white/30")} />
          ))}
        </div>
        <h1 className="text-2xl font-semibold">Bienvenue 💕</h1>
        <p className="mt-1 text-sm text-white/80">Prenons deux minutes pour personnaliser Lyra.</p>

        <div className="mt-6 flex-1 overflow-y-auto">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/70">Ton prénom</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Léa"
                  className="mt-2 w-full rounded-2xl bg-white/90 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/70">Comment Lyra doit-elle s'adresser à toi ?</label>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <GenderCard label="Femme" selected={gender === "female"} onClick={() => setGender("female")} emoji="👩" />
                  <GenderCard label="Homme" selected={gender === "male"} onClick={() => setGender("male")} emoji="👨" />
                  <GenderCard label="Non binaire" selected={gender === "nonbinary"} onClick={() => setGender("nonbinary")} emoji="🧑" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-white/80">Choisis un avatar (ou importe une photo) — c'est comme ça que Lyra te "voit".</p>
              <div className="grid grid-cols-4 gap-3">
                {avatarChoices.map((url) => (
                  <button key={url} onClick={() => setAvatar(url)}
                    className={"h-16 w-16 overflow-hidden rounded-full ring-2 transition " + (avatar === url ? "ring-white scale-105" : "ring-white/30")}>
                    <img src={url} alt="" className="h-full w-full object-cover bg-white/40" />
                  </button>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white/25 ring-2 ring-white/40 hover:bg-white/35">
                  <Upload className="h-5 w-5" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
                </label>
              </div>
              {avatar && (
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
                  <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/60" />
                  <span className="text-sm text-white/90">Aperçu de ton avatar</span>
                </div>
              )}
              {err && <p className="text-xs text-white/90">{err}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-white/80">Et Lyra, à quoi ressemble-t-elle pour toi ? (tu pourras changer quand tu veux)</p>
              <div className="flex flex-wrap items-center gap-3">
                {LYRA_AVATARS.map((url) => (
                  <button key={url} onClick={() => setLyraAvatar(url)}
                    className={"h-16 w-16 overflow-hidden rounded-full ring-2 transition " + (lyraAvatar === url ? "ring-white scale-105" : "ring-white/30")}>
                    <img src={url} alt="" className="h-full w-full object-cover bg-white/40" />
                  </button>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white/25 ring-2 ring-white/40 hover:bg-white/35">
                  <Upload className="h-5 w-5" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLyraFile(f); e.currentTarget.value = ""; }} />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-white/80">Choisis l'ambiance de couleurs de ton espace.</p>
              <div className="grid grid-cols-2 gap-3">
                {THEME_LIST.map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className={"overflow-hidden rounded-2xl ring-2 text-left transition " + (theme === t.id ? "ring-white scale-[1.02]" : "ring-white/20")}>
                    <div className="h-16 w-full" style={{ background: t.background }} />
                    <div className="flex items-center justify-between bg-white/15 px-3 py-2 backdrop-blur">
                      <span className="text-sm">{t.label}</span>
                      {theme === t.id && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-sm">
              <p className="text-white/80">Récap :</p>
              <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
                {avatar
                  ? <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/50" />
                  : <UserIcon className="h-14 w-14 rounded-full bg-white/20 p-3" />}
                <div>
                  <p className="font-semibold">{name || "—"}</p>
                  <p className="text-white/80">{gender === "male" ? "Homme" : gender === "nonbinary" ? "Non binaire" : "Femme"}</p>
                  <p className="text-white/70">Ambiance : {getTheme(theme).label}</p>
                </div>
                <img src={lyraAvatar} alt="Lyra" className="ml-auto h-14 w-14 rounded-full object-cover ring-2 ring-white/50" />
              </div>
              <p className="text-white/70 text-xs">
                Ta mémoire, tes messages et ton bot Telegram resteront strictement séparés des autres profils.
              </p>
              {err && <p className="text-xs text-white/90">{err}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-4 py-2 text-sm ring-1 ring-white/30 disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" /> Précédent
          </button>
          {step < 4 ? (
            <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}
              className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2 text-sm font-semibold text-pink-600 shadow disabled:opacity-40">
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving}
              className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2 text-sm font-semibold text-pink-600 shadow disabled:opacity-60">
              {saving ? "…" : "Commencer"} <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GenderCard({ label, selected, onClick, emoji }: { label: string; selected: boolean; onClick: () => void; emoji: string }) {
  return (
    <button onClick={onClick}
      className={"flex flex-col items-center gap-2 rounded-2xl p-5 backdrop-blur ring-2 transition " +
        (selected ? "bg-white/30 ring-white scale-[1.02]" : "bg-white/15 ring-white/20 hover:bg-white/20")}>
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}