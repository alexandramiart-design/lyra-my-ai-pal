// Bridge to the native Android AudioRouter Capacitor plugin.
// Falls back gracefully on web / iOS.

export type NativeAudioKind = "earpiece" | "speakerphone" | "bluetooth" | "wired" | "other";
export type NativeAudioDevice = { id: string; kind: NativeAudioKind; label: string; type: number };

type Plugin = {
  list: () => Promise<{ devices: NativeAudioDevice[] }>;
  setOutput: (opts: { kind: NativeAudioKind; id?: string }) => Promise<void>;
  reset: () => Promise<void>;
};

function getPlugin(): Plugin | null {
  if (typeof window === "undefined") return null;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const p = cap.Plugins?.AudioRouter as Plugin | undefined;
  return p || null;
}

export function hasNativeAudioRouter(): boolean {
  return !!getPlugin();
}

export async function listNativeOutputs(): Promise<NativeAudioDevice[]> {
  const p = getPlugin();
  if (!p) return [];
  try {
    const r = await p.list();
    return r.devices || [];
  } catch {
    return [];
  }
}

export async function setNativeOutput(kind: NativeAudioKind, id?: string): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try { await p.setOutput({ kind, id }); } catch {}
}

export async function resetNativeOutput(): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try { await p.reset(); } catch {}
}