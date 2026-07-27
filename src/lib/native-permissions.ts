// Demande toutes les autorisations Android dès la première ouverture
// (après connexion). No-op sur le web.

let asked = false;

export async function requestAllNativePermissions(): Promise<void> {
  if (asked) return;
  if (typeof window === "undefined") return;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  asked = true;
  const p = cap.Plugins?.AppPermissions as { requestAll: () => Promise<void> } | undefined;
  try { await p?.requestAll(); } catch {}
}
