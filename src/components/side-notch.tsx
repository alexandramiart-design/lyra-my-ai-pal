import { useState } from "react";
import { ChevronRight, X } from "lucide-react";

const BOT_TELEGRAM = "https://t.me/Iahtbot";

export function SideNotch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          aria-label="Ouvrir Lyra sur Telegram"
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
          <IconBtn label="Telegram" onClick={() => window.open(BOT_TELEGRAM, "_blank", "noopener")} bg="#229ED9">
            <TelegramIcon />
          </IconBtn>
          <p className="max-w-[9rem] px-1 pb-1 text-[10px] leading-tight text-white/90 text-center">
            Continue sur Telegram — ta mémoire reste synchro 💖
          </p>
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

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
      <path d="M9.78 15.27l-.4 4.2c.57 0 .82-.24 1.12-.53l2.69-2.56 5.58 4.08c1.02.57 1.75.27 2.02-.94l3.66-17.2h.01c.32-1.5-.54-2.09-1.54-1.72L1.11 9.36c-1.47.57-1.45 1.4-.25 1.77l5.4 1.68 12.53-7.9c.59-.39 1.13-.17.69.22L9.78 15.27z"/>
    </svg>
  );
}
