import { useState } from "react";
import { ChevronRight, LogOut, Settings, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SideNotch({
  onOpenSettings,
}: {
  onOpenSettings?: () => void;
}) {
  const [open, setOpen] = useState(false);

  async function signOut() {
    if (!confirm("Se déconnecter ?")) return;
    await supabase.auth.signOut();
  }

  return (
    <>
      {!open && (
        <button
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
          className="fixed left-0 top-1/2 z-40 -translate-y-1/2 flex h-14 w-4 items-center justify-center rounded-r-xl bg-white/25 backdrop-blur ring-1 ring-white/40 hover:w-5 transition-all"
        >
          <ChevronRight className="h-3 w-3 text-white/90" />
        </button>
      )}

      {open && (
        <div className="fixed left-2 top-1/2 z-40 -translate-y-1/2 flex flex-col items-center gap-2 rounded-2xl bg-white/20 p-2 backdrop-blur-lg ring-1 ring-white/40 shadow-xl">
          <button onClick={() => setOpen(false)} className="self-end rounded-full bg-white/20 p-1 hover:bg-white/30" aria-label="Fermer">
            <X className="h-3 w-3" />
          </button>
          {onOpenSettings && (
            <IconBtn label="Personnalisation" onClick={() => { setOpen(false); onOpenSettings(); }} bg="#ffffff30">
              <Settings className="h-4 w-4 text-white" />
            </IconBtn>
          )}
          <IconBtn label="Se déconnecter" onClick={signOut} bg="#ef4444">
            <LogOut className="h-4 w-4 text-white" />
          </IconBtn>
        </div>
      )}
    </>
  );
}

function IconBtn({ label, onClick, bg, children }: { label: string; onClick: () => void; bg: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-1 ring-white/40 active:scale-95 transition"
      style={{ background: bg }}>
      {children}
    </button>
  );
}
