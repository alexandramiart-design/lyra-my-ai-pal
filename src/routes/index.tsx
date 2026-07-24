import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, Send, Volume2, Trash2, LogOut, Sparkles, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Session } from "@supabase/supabase-js";
import { SideNotch } from "@/components/side-notch";
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
  // Demande directement l'URL OAuth à Supabase puis ouvre le navigateur natif.
  // Après consentement, Supabase redirige vers NATIVE_AUTH_WEB_CALLBACK
  // qui renvoie le deep link `app.lovable.lyra://auth-callback?code=...` dans l'app.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: NATIVE_AUTH_WEB_CALLBACK,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("URL OAuth introuvable");
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: data.url, presentationStyle: "popover" });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lyra — ton espace safe" },
      { name: "description", content: "Lyra, amie IA safe pour Alexandra." },
    ],
  }),
  component: Page,
  ssr: false,
});

type Msg = { id: string; role: "user" | "assistant"; content: string; images?: string[] };

export function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

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
  if (email !== ALLOWED_EMAIL) return <Forbidden email={email} />;
  return <Chat token={session.access_token} userAvatar={alexandraAvatar} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full text-white relative overflow-hidden"
         style={{
           background:
             "radial-gradient(1200px 800px at 10% 0%, #ffb3d1 0%, transparent 55%)," +
             "radial-gradient(1000px 700px at 90% 20%, #ff7ab8 0%, transparent 55%)," +
             "radial-gradient(900px 800px at 50% 100%, #b06cf5 0%, transparent 60%)," +
             "linear-gradient(160deg, #ff4fa3 0%, #ff69b4 35%, #d259e6 70%, #7b3fe4 100%)",
         }}>
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
        <p className="mt-6 text-[11px] text-white/70">Seul le compte {ALLOWED_EMAIL} est autorisé.</p>
      </div>
    </Shell>
  );
}

function Forbidden({ email }: { email: string }) {
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 text-6xl">🚫</div>
        <h1 className="text-2xl font-semibold">Accès réservé</h1>
        <p className="mt-2 text-white/90 text-sm">Ce compte ({email}) n'est pas autorisé.<br/>Connecte-toi avec {ALLOWED_EMAIL}.</p>
        <button onClick={() => supabase.auth.signOut()}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-medium backdrop-blur ring-1 ring-white/30 hover:bg-white/30">
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </Shell>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.4l6.4-6.4C34.6 2.9 29.7 1 24 1 14.8 1 7 6.3 3.3 14.1l7.5 5.8C12.6 13.9 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.8 6.7-17.2z"/><path fill="#FBBC05" d="M10.8 28.4c-.6-1.7-.9-3.5-.9-5.4s.3-3.7.9-5.4l-7.5-5.8C1.4 15.6 0 19.6 0 23c0 3.4 1.4 7.4 3.3 11.2l7.5-5.8z"/><path fill="#34A853" d="M24 45c6.3 0 11.7-2 15.6-5.6l-7.3-5.7c-2 1.4-4.6 2.3-8.3 2.3-6.1 0-11.4-4.4-13.2-10.4l-7.5 5.8C7 39.7 14.8 45 24 45z"/></svg>
  );
}

function Chat({ token, userAvatar }: { token: string; userAvatar: string | null }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pendingImg, setPendingImg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [inCall, setInCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
  const speakCancelRef = useRef(false);

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

  async function sendText(text: string, image?: string | null, onSentence?: (s: string) => void) {
    if (!text.trim() && !image) return;
    setSending(true);
    const localUser: Msg = { id: crypto.randomUUID(), role: "user", content: text, images: image ? [image] : [] };
    setMsgs((m) => [...m, localUser]);
    setInput(""); setPendingImg(null);

    const res = await fetch(apiUrl("/api/web/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authH },
      body: JSON.stringify({ text, image }),
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
    return full;
  }

  async function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => setPendingImg(reader.result as string);
    reader.readAsDataURL(f);
  }

  // Recording (voice message)
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  async function startRecording(onStop?: (blob: Blob) => void) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "" });
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
    } catch {
      endCall();
      document.removeEventListener("visibilitychange", visHandler);
      return;
    }
    enqueueSpeak("Coucou ma belle, je t'écoute.");
    while (callActiveRef.current) {
      const blob = await recordUntilSilence();
      if (!callActiveRef.current) break;
      if (!blob || blob.size < 1200) continue;
      const text = await transcribe(blob);
      if (!text) continue;
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
    try { callStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    callStreamRef.current = null;
    try { callAcRef.current?.close(); } catch {}
    callAcRef.current = null;
  }

  return (
    <Shell>
      <header className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <img src={lyraAvatar} alt="Lyra" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/60 shadow-md" />
          <div>
            <p className="text-sm font-semibold leading-none">Lyra</p>
            <p className="text-[11px] text-white/80">En ligne pour toi</p>
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
          <button onClick={() => supabase.auth.signOut()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25" title="Déconnexion">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <div className="mt-10 flex flex-col items-center text-center opacity-90">
            <Sparkles className="h-8 w-8" />
            <p className="mt-3 text-sm">Dis-moi tout, Alexandra 💕</p>
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

      {pendingImg && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-2xl bg-white/15 p-2 backdrop-blur">
          <img src={pendingImg} className="h-14 w-14 rounded-lg object-cover" alt="" />
          <span className="text-xs">Photo prête à envoyer</span>
          <button onClick={() => setPendingImg(null)} className="ml-auto rounded-full bg-white/20 p-1"><X className="h-3 w-3" /></button>
        </div>
      )}

      <div className="shrink-0 flex items-end gap-2 bg-gradient-to-t from-black/20 to-transparent px-3 pb-4 pt-2 backdrop-blur-sm">
        <label className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur cursor-pointer">
          <ImagePlus className="h-5 w-5" />
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
        </label>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(input, pendingImg); } }}
          rows={1} placeholder="Écris à Lyra…"
          className="min-h-11 max-h-32 flex-1 resize-none rounded-3xl bg-white/95 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
        />
        {input.trim() || pendingImg ? (
          <button onClick={() => sendText(input, pendingImg)} disabled={sending}
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

      {inCall && <CallOverlay onEnd={endCall} />}
      <SideNotch />
    </Shell>
  );

  // Record until ~0.8s of silence, or 20s max — reuses the persistent call stream
  async function recordUntilSilence(): Promise<Blob | null> {
    const stream = callStreamRef.current;
    const ac = callAcRef.current;
    if (!stream || !ac) return null;
    if (ac.state === "suspended") { try { await ac.resume(); } catch {} }
    const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "" });
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.start(100);

    const src = ac.createMediaStreamSource(stream);
    const an = ac.createAnalyser();
    an.fftSize = 1024;
    src.connect(an);
    const data = new Uint8Array(an.fftSize);

    const start = Date.now();
    let lastLoud = Date.now();
    let sawSound = false;
    return await new Promise((resolve) => {
      // setInterval keeps ticking even when the tab is hidden/screen off,
      // unlike requestAnimationFrame which pauses.
      const iv = window.setInterval(() => {
        if (!callActiveRef.current) { finish(); return; }
        an.getByteTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        if (rms > 0.035) { lastLoud = Date.now(); sawSound = true; }
        const now = Date.now();
        if (sawSound && now - lastLoud > 500) return finish();
        if (now - start > 20000) return finish();
        if (!sawSound && now - start > 6000) return finish();
      }, 80);
      const finish = () => {
        clearInterval(iv);
        try { mr.stop(); } catch {}
        try { src.disconnect(); an.disconnect(); } catch {}
        setTimeout(() => resolve(new Blob(chunks, { type: "audio/webm" })), 100);
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

function CallOverlay({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white"
         style={{ background: "radial-gradient(circle at 50% 30%, #ff7ab8, #a63fe4 60%, #4a1a7a 100%)" }}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl animate-pulse" />
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/20 backdrop-blur ring-4 ring-white/40 text-7xl">💖</div>
      </div>
      <p className="mt-8 text-2xl font-semibold">Lyra</p>
      <p className="text-white/80 text-sm">Appel en cours…</p>
      <p className="mt-2 text-white/60 text-xs px-8 text-center">Parle après le signal, je réponds toute seule.</p>
      <button onClick={onEnd}
        className="mt-14 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-2xl active:scale-95">
        <PhoneOff className="h-7 w-7" />
      </button>
    </div>
  );
}