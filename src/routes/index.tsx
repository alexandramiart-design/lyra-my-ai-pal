import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, Send, Volume2, Trash2, Sparkles, ImagePlus, X, Speaker, Bluetooth, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Session } from "@supabase/supabase-js";
import { SideNotch } from "@/components/side-notch";
import { Onboarding } from "@/components/onboarding";
import { SettingsPanel } from "@/components/settings-panel";
import { THEMES, type ThemeId } from "@/lib/themes";
import { hasNativeAudioRouter, listNativeOutputs, setNativeOutput, resetNativeOutput, type NativeAudioKind } from "@/lib/audio-router";
import lyraAvatarAsset from "@/assets/lyra-avatar.png.asset.json";
import userAvatarAsset from "@/assets/user-avatar.png.asset.json";
const lyraAvatar = lyraAvatarAsset.url;
const alexandraAvatar = userAvatarAsset.url;

const ALLOWED_EMAIL = "alexandramiart@gmail.com";
const PUBLIC_APP_URL = "https://sweet-git-sparkle.lovable.app";
const NATIVE_AUTH_REDIRECT = "app.lovable.lyra://auth-callback";
const NATIVE_AUTH_WEB_CALLBACK = `${PUBLIC_APP_URL}/auth/native-callback`;

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

function isNativeApp() {
  return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
}

type AudioOutput = { deviceId: string; label: string; kind: "earpiece" | "speakerphone" | "bluetooth" | "other" };

function classifyAudioOutput(label: string): AudioOutput["kind"] {
  const raw = label.toLowerCase();
  if (/bluetooth|bt|airpods|buds|beats|jbl|sony|bose|casque|headset|headphone/i.test(raw)) return "bluetooth";
  if (/earpiece|receiver|oreille|écouteur interne|ear speaker/i.test(raw)) return "earpiece";
  if (/speakerphone|loudspeaker|haut-parleur|speaker/i.test(raw)) return "speakerphone";
  return "other";
}

function normalizeAudioOutputs(devices: MediaDeviceInfo[]): AudioOutput[] {
  const raw = devices.filter((d) => d.kind === "audiooutput" && d.deviceId !== "communications");
  const bluetooth: AudioOutput[] = [];
  const seenBt = new Set<string>();
  let earpieceDev: MediaDeviceInfo | undefined;
  let speakerDev: MediaDeviceInfo | undefined;
  for (const d of raw) {
    const label = d.label?.trim() || "";
    const kind = classifyAudioOutput(label);
    if (kind === "bluetooth") {
      const key = label.toLowerCase();
      if (seenBt.has(key)) continue;
      seenBt.add(key);
      bluetooth.push({ deviceId: d.deviceId, label: label || "Casque Bluetooth", kind: "bluetooth" });
    } else if (kind === "earpiece" && !earpieceDev) {
      earpieceDev = d;
    } else if (kind === "speakerphone" && !speakerDev) {
      speakerDev = d;
    }
  }
  const defaultDev = raw.find((d) => d.deviceId === "default");
  const fallbackId = earpieceDev?.deviceId || speakerDev?.deviceId || defaultDev?.deviceId || "default";
  const outs: AudioOutput[] = [
    { deviceId: (earpieceDev?.deviceId || fallbackId) + "#earpiece", label: "Téléphone", kind: "earpiece" },
    { deviceId: (speakerDev?.deviceId || fallbackId) + "#speakerphone", label: "Haut-parleur", kind: "speakerphone" },
    ...bluetooth,
  ];
  return outs;
}

// Build AudioOutput[] from the native Android AudioRouter plugin.
// deviceId is encoded as "native:<kind>:<id>" so onSelectOutput can route natively.
async function nativeAudioOutputs(): Promise<AudioOutput[]> {
  const devs = await listNativeOutputs();
  if (!devs.length) return [];
  const outs: AudioOutput[] = [];
  const seen = new Set<string>();
  // Always show Téléphone + Haut-parleur first, then any BT/wired headset.
  const ear = devs.find((d) => d.kind === "earpiece");
  const spk = devs.find((d) => d.kind === "speakerphone");
  outs.push({ deviceId: `native:earpiece:${ear?.id ?? "earpiece"}`, label: "Téléphone", kind: "earpiece" });
  outs.push({ deviceId: `native:speakerphone:${spk?.id ?? "speakerphone"}`, label: "Haut-parleur", kind: "speakerphone" });
  for (const d of devs) {
    if (d.kind !== "bluetooth" && d.kind !== "wired") continue;
    const key = `${d.kind}:${(d.label || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    outs.push({
      deviceId: `native:${d.kind}:${d.id}`,
      label: d.label || (d.kind === "bluetooth" ? "Casque Bluetooth" : "Écouteurs filaires"),
      kind: "bluetooth",
    });
  }
  return outs;
}

function resolveSinkId(deviceId: string): string {
  // Virtual entries map to the real default/built-in sink.
  return deviceId.replace(/#(earpiece|speakerphone)$/, "");
}

function apiUrl(path: string) {
  return isNativeApp() ? `${PUBLIC_APP_URL}${path}` : path;
}

function getOAuthParams(url: string) {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const hash = new URLSearchParams(parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash);
  return { parsed, query, hash };
}

async function handleNativeOAuthCallback(url: string) {
  if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return false;
  const { query, hash } = getOAuthParams(url);
  const returnedState = query.get("state") || hash.get("state");
  const expectedState = window.localStorage.getItem("lyra-native-oauth-state");
  window.localStorage.removeItem("lyra-native-oauth-state");
  if (expectedState && returnedState && expectedState !== returnedState) return true;

  const error = query.get("error_description") || query.get("error") || hash.get("error_description") || hash.get("error");
  if (error) return true;

  const accessToken = hash.get("access_token") || query.get("access_token");
  const refreshToken = hash.get("refresh_token") || query.get("refresh_token");
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    return true;
  }

  if (query.get("code")) {
    await supabase.auth.exchangeCodeForSession(url);
    return true;
  }

  return true;
}

async function signInNativeGoogle() {
  // Utilise le broker Lovable managé, puis repasse par une page publique qui
  // ouvre immédiatement le deep link Android pour revenir dans l'APK.
  const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: NATIVE_AUTH_WEB_CALLBACK });
  if (r.error) throw r.error instanceof Error ? r.error : new Error(String(r.error));
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lyra — ton espace safe" },
      { name: "description", content: "Lyra, amie IA safe pour Alexandra." },
      { property: "og:title", content: "Lyra — ton espace safe" },
      { property: "og:description", content: "Lyra, amie IA safe pour Alexandra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
  ssr: false,
});

type Msg = { id: string; role: "user" | "assistant"; content: string; images?: string[] };

type ServerProfile = {
  display_name: string;
  gender: "male" | "female";
  in_transition: boolean;
  avatar_url: string;
  theme: ThemeId;
  telegram_bot_username?: string | null;
  telegram_status?: string | null;
  onboarded_at?: string | null;
};

export function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); setProfileLoaded(false); return; }
    (async () => {
      const r = await fetch(apiUrl("/api/web/profile"), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (r.ok) {
        const j = (await r.json()) as { profile: ServerProfile | null };
        setProfile(j.profile);
      }
      setProfileLoaded(true);
    })();
  }, [session]);

  useEffect(() => {
    if (!isNativeApp()) return;
    let removeListener: (() => void) | undefined;
    void import("@capacitor/app").then(({ App }) =>
      App.addListener("appUrlOpen", async ({ url }) => {
        const handled = await handleNativeOAuthCallback(url);
        if (handled) {
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
          } catch {}
        }
      }),
    ).then((listener) => {
      removeListener = () => listener.remove();
    });
    return () => removeListener?.();
  }, []);

  if (!ready) return <Shell><div className="text-white/70">…</div></Shell>;
  if (!session) return <SignIn />;
  const email = (session.user.email || "").toLowerCase();
  const isOwner = email === ALLOWED_EMAIL;

  if (!profileLoaded) return <Shell><div className="text-white/70">…</div></Shell>;

  if (!isOwner && (!profile || !profile.onboarded_at)) {
    return (
      <Onboarding
        token={session.access_token}
        apiUrl={apiUrl}
        onDone={async () => {
          const r = await fetch(apiUrl("/api/web/profile"), {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (r.ok) {
            const j = (await r.json()) as { profile: ServerProfile | null };
            setProfile(j.profile);
          }
        }}
      />
    );
  }

  const effectiveProfile: ServerProfile = isOwner
    ? {
        display_name: "Alexandra",
        gender: "female",
        in_transition: false,
        avatar_url: alexandraAvatar,
        theme: "pink",
        telegram_bot_username: profile?.telegram_bot_username ?? null,
        telegram_status: profile?.telegram_status ?? "idle",
      }
    : (profile as ServerProfile);

  return (
    <Chat
      token={session.access_token}
      profile={effectiveProfile}
      isOwner={isOwner}
      onProfileUpdated={setProfile}
    />
  );
}

function Shell({ children, theme = "pink" }: { children: React.ReactNode; theme?: ThemeId }) {
  const t = THEMES[theme] ?? THEMES.pink;
  return (
    <div className="h-[100dvh] w-full text-white relative overflow-hidden"
         style={{ background: t.background }}>
      <div className="pointer-events-none absolute inset-0"
           style={{ background: "radial-gradient(1200px 400px at 50% -10%, rgba(255,255,255,0.35), transparent 60%)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col">
        {children}
      </div>
    </div>
  );
}

function SignIn() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function signIn() {
    setLoading(true); setErr(null);
    if (isNativeApp()) {
      try {
        await signInNativeGoogle();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
      return;
    }
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { setErr(r.error instanceof Error ? r.error.message : String(r.error)); setLoading(false); }
  }
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-2xl ring-1 ring-white/40 text-5xl">💖</div>
        <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm">Lyra</h1>
        <p className="mt-2 text-white/90">Ton espace safe, rien qu'à toi.</p>
        <button onClick={signIn} disabled={loading}
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-600 shadow-xl transition hover:scale-[1.02] disabled:opacity-60">
          <GoogleIcon />
          {loading ? "…" : "Se connecter avec Google"}
        </button>
        {err && <p className="mt-4 text-xs text-white/90">{err}</p>}
        <p className="mt-6 text-[11px] text-white/70">Ton espace safe, personnel et privé.</p>
      </div>
    </Shell>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.4l6.4-6.4C34.6 2.9 29.7 1 24 1 14.8 1 7 6.3 3.3 14.1l7.5 5.8C12.6 13.9 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.8 6.7-17.2z"/><path fill="#FBBC05" d="M10.8 28.4c-.6-1.7-.9-3.5-.9-5.4s.3-3.7.9-5.4l-7.5-5.8C1.4 15.6 0 19.6 0 23c0 3.4 1.4 7.4 3.3 11.2l7.5-5.8z"/><path fill="#34A853" d="M24 45c6.3 0 11.7-2 15.6-5.6l-7.3-5.7c-2 1.4-4.6 2.3-8.3 2.3-6.1 0-11.4-4.4-13.2-10.4l-7.5 5.8C7 39.7 14.8 45 24 45z"/></svg>
  );
}

function Chat({
  token, profile, isOwner, onProfileUpdated,
}: {
  token: string;
  profile: ServerProfile;
  isOwner: boolean;
  onProfileUpdated: (p: ServerProfile) => void;
}) {
  const userAvatar = profile.avatar_url || null;
  const displayName = profile.display_name || "Toi";
  const theme = profile.theme;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pendingImgs, setPendingImgs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [inCall, setInCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
  const speakCancelRef = useRef(false);
  const [audioOutputs, setAudioOutputs] = useState<AudioOutput[]>([]);
  const [audioOutputId, setAudioOutputId] = useState<string>("default");

  // Apply the current audio route natively whenever it changes.
  useEffect(() => {
    if (!audioOutputId?.startsWith("native:")) return;
    const [, k, nid] = audioOutputId.split(":");
    setNativeOutput(k as NativeAudioKind, nid).catch(() => {});
  }, [audioOutputId]);

  const authH = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    (async () => {
      const r = await fetch(apiUrl("/api/web/history"), { headers: authH });
      if (r.ok) {
        const j = await r.json();
        setMsgs((j.messages || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content, images: m.images || [] })));
      }
    })();
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, sending]);

  async function sendText(text: string, images?: string[] | null, onSentence?: (s: string) => void) {
    const imgs = images && images.length ? images : [];
    if (!text.trim() && imgs.length === 0) return;
    setSending(true);
    const localUser: Msg = { id: crypto.randomUUID(), role: "user", content: text, images: imgs };
    setMsgs((m) => [...m, localUser]);
    setInput(""); setPendingImgs([]);

    const res = await fetch(apiUrl("/api/web/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authH },
      body: JSON.stringify({ text, images: imgs }),
    });
    if (!res.ok || !res.body) {
      const err = await res.text().catch(() => "erreur");
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: `❌ ${err.slice(0, 200)}` }]);
      setSending(false);
      return "";
    }
    const assistantId = crypto.randomUUID();
    setMsgs((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let spokenUpTo = 0;
    const flushSentences = (finalFlush = false) => {
      if (!onSentence) return;
      const pending = full.slice(spokenUpTo);
      const re = /[^.!?…\n]+[.!?…\n]+/g;
      let mm: RegExpExecArray | null;
      let last = 0;
      while ((mm = re.exec(pending)) !== null) {
        const s = mm[0].trim();
        if (s.length >= 2) onSentence(s);
        last = mm.index + mm[0].length;
      }
      spokenUpTo += last;
      if (finalFlush) {
        const tail = full.slice(spokenUpTo).trim();
        if (tail.length >= 2) { onSentence(tail); spokenUpTo = full.length; }
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      setMsgs((m) => m.map((x) => x.id === assistantId ? { ...x, content: full } : x));
      flushSentences();
    }
    flushSentences(true);
    setSending(false);
    if (res.headers.get("X-Lyra-Image") === "1") {
      try {
        const r = await fetch(apiUrl("/api/web/history"), { headers: authH });
        if (r.ok) {
          const j = await r.json();
          setMsgs((j.messages || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content, images: m.images || [] })));
        }
      } catch {}
    }
    return full;
  }

  async function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => setPendingImgs((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(f);
  }
  async function handleFiles(files: FileList) {
    for (const f of Array.from(files)) await handleFile(f);
  }

  // Recording (voice message)
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  async function startRecording(onStop?: (blob: Blob) => void) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
      } as MediaTrackConstraints,
    });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
    const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onStop?.(blob);
    };
    mr.start();
    mediaRecRef.current = mr;
    setRecording(true);
  }
  function stopRecording() {
    mediaRecRef.current?.stop();
    mediaRecRef.current = null;
    setRecording(false);
  }

  async function transcribe(blob: Blob): Promise<string> {
    const fd = new FormData();
    fd.append("file", blob, "audio.webm");
    const r = await fetch(apiUrl("/api/web/transcribe"), { method: "POST", headers: authH, body: fd });
    if (!r.ok) return "";
    const j = await r.json();
    return (j.text || "").trim();
  }

  async function fetchTts(text: string): Promise<Blob | null> {
    const r = await fetch(apiUrl("/api/web/tts"), {
      method: "POST", headers: { "Content-Type": "application/json", ...authH },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return new Blob([buf], { type: "audio/mpeg" });
  }
  async function playBlob(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    audioRef.current = a;
    try {
      const anyA = a as unknown as { setSinkId?: (id: string) => Promise<void> };
      if (audioOutputId && anyA.setSinkId) await anyA.setSinkId(resolveSinkId(audioOutputId));
    } catch {}
    await a.play().catch(() => {});
    return new Promise<void>((res) => {
      a.onended = () => { URL.revokeObjectURL(url); res(); };
      a.onerror = () => { URL.revokeObjectURL(url); res(); };
    });
  }
  async function speak(text: string): Promise<void> {
    const blob = await fetchTts(text);
    if (!blob) return;
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
    await playBlob(blob);
  }
  function enqueueSpeak(text: string) {
    if (speakCancelRef.current) return;
    const blobPromise = fetchTts(text);
    speakQueueRef.current = speakQueueRef.current.then(async () => {
      if (speakCancelRef.current) return;
      const b = await blobPromise;
      if (!b || speakCancelRef.current) return;
      await playBlob(b);
    });
  }
  function resetSpeakQueue() {
    speakCancelRef.current = false;
    speakQueueRef.current = Promise.resolve();
  }

  async function onMicPress() {
    if (recording) {
      // stop and send as voice → transcribe → send text
      const p = new Promise<Blob>((resolve) => {
        const mr = mediaRecRef.current;
        if (!mr) return resolve(new Blob());
        mr.onstop = () => {
          const s = mr.stream; s.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
        };
        mr.stop();
      });
      mediaRecRef.current = null;
      setRecording(false);
      const blob = await p;
      const text = await transcribe(blob);
      if (text) await sendText(text);
    } else {
      await startRecording();
    }
  }

  async function clearAll() {
    if (!confirm("Effacer toute la mémoire de Lyra ?")) return;
    await fetch(apiUrl("/api/web/history"), { method: "DELETE", headers: authH });
    setMsgs([]);
  }

  // Call mode: continuous listen → transcribe → reply → speak → loop
  const callActiveRef = useRef(false);
  const wakeLockRef = useRef<any>(null);
  const callStreamRef = useRef<MediaStream | null>(null);
  const callAcRef = useRef<AudioContext | null>(null);
  const keepAliveRef = useRef<number | null>(null);
  const deviceChangeHandlerRef = useRef<(() => void) | null>(null);
  const nativePollRef = useRef<number | null>(null);

  async function acquireWakeLock() {
    try {
      // @ts-ignore
      if (navigator.wakeLock?.request) {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener?.("release", () => {});
      }
    } catch {}
  }
  function releaseWakeLock() {
    try { wakeLockRef.current?.release?.(); } catch {}
    wakeLockRef.current = null;
  }

  async function startCall() {
    setInCall(true);
    callActiveRef.current = true;
    resetSpeakQueue();
    await acquireWakeLock();
    // Re-acquire wake lock when tab returns to foreground
    const visHandler = () => {
      if (document.visibilityState === "visible" && callActiveRef.current && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", visHandler);
    // Silent keep-alive tick (prevents some background throttling)
    keepAliveRef.current = window.setInterval(() => {}, 1000);
    // Persistent mic stream for the whole call
    try {
      callStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      callAcRef.current = new AudioContext();
      try {
        const refreshOutputs = async () => {
          let outs: AudioOutput[] = [];
          if (hasNativeAudioRouter()) {
            outs = await nativeAudioOutputs();
          }
          if (!outs.length) {
            const devs = await navigator.mediaDevices.enumerateDevices();
            outs = normalizeAudioOutputs(devs);
          }
          setAudioOutputs(outs);
          setAudioOutputId((prev) => {
            // Si la sortie précédente existe toujours, on la garde.
            if (prev && outs.some((o) => o.deviceId === prev)) return prev;
            // Nouveau casque branché → on bascule dessus automatiquement.
            const bt = outs.find((o) => o.kind === "bluetooth");
            if (bt) return bt.deviceId;
            // Défaut « comme un vrai appel » : écouteur du haut.
            const ear = outs.find((o) => o.kind === "earpiece");
            return ear?.deviceId || outs[0]?.deviceId || "default";
          });
        };
        await refreshOutputs();
        const handler = () => { refreshOutputs().catch(() => {}); };
        navigator.mediaDevices.addEventListener?.("devicechange", handler);
        deviceChangeHandlerRef.current = handler;
        // Poll every 3s on native — Android WebView doesn't always fire
        // devicechange when a Bluetooth headset connects/disconnects.
        if (hasNativeAudioRouter()) {
          const iv = window.setInterval(() => { refreshOutputs().catch(() => {}); }, 3000);
          nativePollRef.current = iv;
        }
      } catch {}
    } catch {
      endCall();
      document.removeEventListener("visibilitychange", visHandler);
      return;
    }
    enqueueSpeak("Coucou ma belle, je t'écoute.");
    await speakQueueRef.current;
    while (callActiveRef.current) {
      const blob = await recordUntilSilence();
      if (!callActiveRef.current) break;
      // Ne jamais envoyer une fenêtre sans vraie voix au serveur :
      // le STT peut inventer des mots sur du silence compressé.
      if (!blob || blob.size < 15000) continue;
      const text = await transcribe(blob);
      if (!text || text.trim().length < 2) continue;
      await sendText(text, null, (s) => { if (callActiveRef.current) enqueueSpeak(s); });
      await speakQueueRef.current;
    }
    document.removeEventListener("visibilitychange", visHandler);
  }
  function endCall() {
    callActiveRef.current = false;
    setInCall(false);
    speakCancelRef.current = true;
    audioRef.current?.pause();
    releaseWakeLock();
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
    if (deviceChangeHandlerRef.current) {
      try { navigator.mediaDevices.removeEventListener?.("devicechange", deviceChangeHandlerRef.current); } catch {}
      deviceChangeHandlerRef.current = null;
    }
    if (nativePollRef.current) { clearInterval(nativePollRef.current); nativePollRef.current = null; }
    resetNativeOutput().catch(() => {});
    try { callStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    callStreamRef.current = null;
    try { callAcRef.current?.close(); } catch {}
    callAcRef.current = null;
  }

  return (
    <Shell theme={theme}>
      <header className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <img src={lyraAvatar} alt="Lyra" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/60 shadow-md" />
          <div>
            <p className="text-sm font-semibold leading-none">Lyra</p>
            <p className="text-[11px] text-white/80">En ligne pour {displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => startCall()} title="Appel"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-1 ring-white/40 hover:bg-white/30 active:scale-95 transition">
            <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
            <Phone className="h-5 w-5" />
          </button>
          <button onClick={clearAll} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25" title="Effacer la mémoire">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <div className="mt-10 flex flex-col items-center text-center opacity-90">
            <Sparkles className="h-8 w-8" />
            <p className="mt-3 text-sm">Dis-moi tout, {displayName} 💕</p>
          </div>
        )}
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} onSpeak={() => speak(m.content)} userAvatar={userAvatar} />
        ))}
        {sending && (
          <div className="flex items-end gap-2 pl-1">
            <img src={lyraAvatar} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/40" />
            <div className="rounded-3xl rounded-bl-md bg-white/20 px-4 py-2 text-xs text-white/80 backdrop-blur ring-1 ring-white/30">Lyra écrit…</div>
          </div>
        )}
      </div>

      {pendingImgs.length > 0 && (
        <div className="mx-4 mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-white/15 p-2 backdrop-blur">
          {pendingImgs.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} className="h-14 w-14 rounded-lg object-cover" alt="" />
              <button
                onClick={() => setPendingImgs((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 rounded-full bg-black/60 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <span className="ml-1 text-xs">
            {pendingImgs.length} photo{pendingImgs.length > 1 ? "s" : ""} prête{pendingImgs.length > 1 ? "s" : ""}
          </span>
          <button onClick={() => setPendingImgs([])} className="ml-auto rounded-full bg-white/20 px-2 py-1 text-[11px]">Tout retirer</button>
        </div>
      )}

      <div className="shrink-0 flex items-end gap-2 bg-gradient-to-t from-black/20 to-transparent px-3 pb-4 pt-2 backdrop-blur-sm">
        <label className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur cursor-pointer">
          <ImagePlus className="h-5 w-5" />
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(input, pendingImgs); } }}
          rows={1} placeholder="Écris à Lyra…"
          className="min-h-11 max-h-32 flex-1 resize-none rounded-3xl bg-white/95 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
        />
        {input.trim() || pendingImgs.length > 0 ? (
          <button onClick={() => sendText(input, pendingImgs)} disabled={sending}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-pink-600 shadow-lg active:scale-95">
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button onClick={onMicPress}
            className={"flex h-11 w-11 items-center justify-center rounded-full shadow-lg active:scale-95 " + (recording ? "bg-red-500 text-white animate-pulse" : "bg-white text-pink-600")}
            title={recording ? "Envoyer le vocal" : "Message vocal"}>
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>

      {inCall && (
        <CallOverlay
          onEnd={endCall}
          theme={theme}
          outputs={audioOutputs}
          outputId={audioOutputId}
          onSelectOutput={(id) => {
            setAudioOutputId(id);
            // Native routing (Android): "native:<kind>:<id>" → AudioRouter plugin.
            if (id.startsWith("native:")) {
              const [, k, nid] = id.split(":");
              setNativeOutput(k as NativeAudioKind, nid).catch(() => {});
              return;
            }
            try {
              const anyA = audioRef.current as unknown as { setSinkId?: (id: string) => Promise<void> } | null;
              anyA?.setSinkId?.(resolveSinkId(id)).catch(() => {});
            } catch {}
          }}
        />
      )}
      <SideNotch
        onOpenSettings={() => setSettingsOpen(true)}
        telegramLink={
          profile.telegram_bot_username
            ? `https://t.me/${profile.telegram_bot_username}`
            : isOwner
              ? "https://t.me/Iahtbot"
              : null
        }
      />
      {settingsOpen && (
        <SettingsPanel
          token={token}
          apiUrl={apiUrl}
          initial={profile}
          onClose={() => setSettingsOpen(false)}
          onSaved={(p) => onProfileUpdated(p)}
        />
      )}
    </Shell>
  );

  // Record until ~0.9s of silence, or 30s max — reuses the persistent call stream.
  // Returns null when no sustained human voice was detected.
  async function recordUntilSilence(): Promise<Blob | null> {
    const stream = callStreamRef.current;
    const ac = callAcRef.current;
    if (!stream || !ac) return null;
    if (ac.state === "suspended") { try { await ac.resume(); } catch {} }
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
    const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.start(100);

    const src = ac.createMediaStreamSource(stream);
    const an = ac.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0.85;
    src.connect(an);
    const data = new Uint8Array(an.fftSize);

    const start = Date.now();
    let lastLoud = Date.now();
    let sawSound = false;
    let confirmedSpeech = false;
    let loudFrames = 0;
    let voicedMs = 0;
    let peakRms = 0;
    // Adaptive noise floor: sample the room during the first ~400ms of the
    // window and set the speech threshold above it, so a noisy room doesn't
    // fool the detector and a quiet room still catches soft speech.
    let noiseFloor = 0.012;
    let calibrated = false;
    const noiseSamples: number[] = [];
    return await new Promise((resolve) => {
      // setInterval keeps ticking even when the tab is hidden/screen off,
      // unlike requestAnimationFrame which pauses.
      const iv = window.setInterval(() => {
        if (!callActiveRef.current) { finish(); return; }
        an.getByteTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        const now = Date.now();
        if (!calibrated) {
          noiseSamples.push(rms);
          if (now - start > 400) {
            noiseSamples.sort((a, b) => a - b);
            const median = noiseSamples[Math.floor(noiseSamples.length / 2)] || 0.012;
            noiseFloor = Math.max(0.008, median);
            calibrated = true;
          }
        }
        peakRms = Math.max(peakRms, rms);
        const speechThreshold = Math.max(0.035, noiseFloor * 3.2);
        if (rms > speechThreshold) {
          lastLoud = now;
          sawSound = true;
          loudFrames += 1;
          voicedMs += 80;
          if (voicedMs >= 360 && loudFrames >= 4 && peakRms >= speechThreshold * 1.2) confirmedSpeech = true;
        }
        // Longer silence tail (900ms) so on ne coupe pas au milieu d'une phrase.
        if (sawSound && now - lastLoud > 900) return finish();
        // Max 30s per utterance for longer sentences.
        if (now - start > 30000) return finish();
        // Wait up to 8s for the user to start talking.
        if (!sawSound && now - start > 8000) return finish();
      }, 80);
      const finish = () => {
        clearInterval(iv);
        try { mr.stop(); } catch {}
        try { src.disconnect(); an.disconnect(); } catch {}
        setTimeout(() => {
          if (!confirmedSpeech) {
            resolve(null);
            return;
          }
          resolve(new Blob(chunks, { type: "audio/webm" }));
        }, 100);
      };
    });
  }
}

function Bubble({ m, onSpeak, userAvatar }: { m: Msg; onSpeak: () => void; userAvatar: string | null }) {
  const isUser = m.role === "user";
  const avatar = isUser ? userAvatar : lyraAvatar;
  return (
    <div className={"flex items-end gap-2 " + (isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <img src={lyraAvatar} alt="Lyra" className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/40" />
      )}
      <div className={"group max-w-[75%] rounded-3xl px-4 py-2.5 text-sm shadow-md " +
        (isUser
          ? "bg-white text-gray-900 rounded-br-md"
          : "bg-white/20 text-white backdrop-blur ring-1 ring-white/30 rounded-bl-md")}>
        {m.images?.map((src, i) => (
          <img key={i} src={src} alt="" className="mb-2 max-h-56 rounded-2xl object-cover" />
        ))}
        {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
        {!isUser && m.content && (
          <button onClick={onSpeak} className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/80 hover:text-white">
            <Volume2 className="h-3 w-3" /> Écouter
          </button>
        )}
      </div>
      {isUser && avatar && (
        <img src={avatar} alt="Toi" className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/40" />
      )}
    </div>
  );
}

function OutputIcon({ kind }: { kind: AudioOutput["kind"] }) {
  if (kind === "bluetooth") return <Bluetooth className="h-5 w-5 shrink-0 text-slate-700" />;
  if (kind === "earpiece") return <Phone className="h-5 w-5 shrink-0 text-slate-700" />;
  return <Speaker className="h-5 w-5 shrink-0 text-slate-700" />;
}

function CallOverlay({
  onEnd,
  theme = "pink",
  outputs,
  outputId,
  onSelectOutput,
}: {
  onEnd: () => void;
  theme?: ThemeId;
  outputs: AudioOutput[];
  outputId: string;
  onSelectOutput: (id: string) => void;
}) {
  const t = THEMES[theme] ?? THEMES.pink;
  const [pickerOpen, setPickerOpen] = useState(false);
  const current = outputs.find((o) => o.deviceId === outputId);
  const currentLabel = current?.label || (outputId === "default" ? "Haut-parleur du téléphone" : "Sortie audio");
  const currentKind = current?.kind || "other";
  const hasBluetooth = outputs.some((o) => o.kind === "bluetooth");
  const sheetTitle = hasBluetooth ? "Bluetooth" : "Sortie audio";
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white"
         style={{ background: t.callGradient }}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl animate-pulse" />
        <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-white/20 backdrop-blur ring-4 ring-white/40">
          <img src={lyraAvatar} alt="Lyra" className="h-full w-full object-cover" />
        </div>
      </div>
      <p className="mt-8 text-2xl font-semibold">Lyra</p>
      <p className="text-white/80 text-sm">Appel en cours…</p>
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="mt-8 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm ring-1 ring-white/30 active:scale-95"
      >
        {currentKind === "bluetooth" ? <Bluetooth className="h-4 w-4" /> : currentKind === "earpiece" ? <Phone className="h-4 w-4" /> : <Speaker className="h-4 w-4" />}
        <span className="max-w-[200px] truncate">{currentLabel}</span>
      </button>
      <button onClick={onEnd}
        className="mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-2xl active:scale-95">
        <PhoneOff className="h-7 w-7" />
      </button>
      {pickerOpen && (
        <>
          <button
            aria-label="Fermer"
            onClick={() => setPickerOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#eef0f3] px-4 pt-4 pb-6 text-slate-900 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-base font-medium text-slate-800">{sheetTitle}</span>
              <button onClick={() => setPickerOpen(false)} className="rounded-full p-1 active:bg-black/10">
                <X className="h-5 w-5 text-slate-700" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white divide-y divide-slate-100">
              {outputs.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-500">Aucune sortie détectée. Autorise le micro.</div>
              )}
              {outputs.map((o) => {
                const active = o.deviceId === outputId;
                return (
                  <button
                    key={o.deviceId}
                    onClick={() => { onSelectOutput(o.deviceId); setPickerOpen(false); }}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left active:bg-slate-100"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${o.kind === "bluetooth" ? "bg-indigo-100" : "bg-slate-100"}`}>
                      <OutputIcon kind={o.kind} />
                    </span>
                    <span className="flex-1 truncate text-[15px] text-slate-900">{o.label || "Sortie audio"}</span>
                    {active && <Check className="h-5 w-5 shrink-0 text-blue-600" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}