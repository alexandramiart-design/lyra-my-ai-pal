import { createParser } from "eventsource-parser";

/**
 * Lecture instantanée : on joue les chunks PCM 24 kHz dès qu'ils arrivent,
 * sans attendre la fin de la génération.
 */
export type SpeakHandle = { done: Promise<void>; stop: () => void; started: Promise<void> };

export function streamSpeech(
  endpoint: string,
  headers: Record<string, string>,
  text: string,
  sinkId?: string,
): SpeakHandle {
  const AC: typeof AudioContext | undefined =
    typeof window !== "undefined"
      ? (window.AudioContext || (window as any).webkitAudioContext)
      : undefined;
  if (!AC) {
    const done = Promise.reject(new Error("AudioContext unavailable"));
    done.catch(() => {});
    return { done, started: Promise.resolve(), stop: () => {} };
  }

  let ctx: AudioContext;
  try {
    ctx = new AC({ sampleRate: 24000 });
  } catch {
    // Certains WebView Android refusent sampleRate dans le constructeur.
    // On garde quand même les buffers à 24 kHz : le navigateur resample.
    ctx = new AC();
  }
  const controller = new AbortController();
  const sources: AudioBufferSourceNode[] = [];
  let stopped = false;
  let playhead = 0;
  let pending = new Uint8Array(0);
  let endsAt = 0;
  let gotAudio = false;
  let resolveStarted: () => void = () => {};
  const started = new Promise<void>((resolve) => { resolveStarted = resolve; });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    controller.abort();
    resolveStarted();
    sources.forEach((s) => { try { s.stop(); } catch {} });
    ctx.close().catch(() => {});
  };

  const unlockNow = () => {
    try {
      const buffer = ctx.createBuffer(1, 1, 24000);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(ctx.currentTime);
      sources.push(source);
    } catch {}
  };

  const push = (incoming: Uint8Array) => {
    if (stopped) return;
    gotAudio = true;
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (usable === 0) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buffer = ctx.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    playhead = playhead === 0 ? ctx.currentTime + 0.04 : Math.max(playhead, ctx.currentTime);
    src.start(playhead);
    resolveStarted();
    playhead += buffer.duration;
    endsAt = playhead;
    sources.push(src);
  };

  const done = (async () => {
    try {
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      unlockNow();
      try {
        const anyCtx = ctx as unknown as { setSinkId?: (id: string) => Promise<void> };
        if (sinkId && anyCtx.setSinkId) await anyCtx.setSinkId(sinkId);
      } catch {}

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ text, stream: true }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`tts ${res.status}`);

      const parser = createParser({
        onEvent(event) {
          let payload: { type?: string; audio?: string };
          try { payload = JSON.parse(event.data); } catch { return; }
          const eventType = payload.type || event.event;
          if (eventType !== "speech.audio.delta" || !payload.audio) return;
          const bin = atob(payload.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          push(bytes);
        },
      });

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      while (!stopped) {
        const { value, done: fin } = await reader.read();
        if (fin) break;
        parser.feed(value);
      }
      if (!gotAudio && !stopped) throw new Error("empty tts stream");
      const wait = Math.max(0, (endsAt - ctx.currentTime) * 1000);
      await new Promise((r) => setTimeout(r, wait + 60));
    } catch (err) {
      if (!stopped) throw err;
    } finally {
      resolveStarted();
      if (!stopped) ctx.close().catch(() => {});
    }
  })();

  return { done, started, stop };
}
