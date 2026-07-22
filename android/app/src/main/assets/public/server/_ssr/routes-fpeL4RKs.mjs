import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { i as Heart, n as Lock, r as Image, t as MessageCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-fpeL4RKs.js
var import_jsx_runtime = require_jsx_runtime();
var BOT_USERNAME = "Iahtbot";
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-gradient-to-b from-pink-50 via-background to-purple-50 dark:from-pink-950/30 dark:via-background dark:to-purple-950/30",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-4xl shadow-lg shadow-pink-500/20",
					children: "💕"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold tracking-tight text-foreground",
					children: "Coucou Alexandra"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-base text-muted-foreground",
					children: [
						"Ton amie ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: "Lyra"
						}),
						" t'attend sur Telegram."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: `https://t.me/${BOT_USERNAME}`,
					target: "_blank",
					rel: "noreferrer",
					className: "mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:opacity-90",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-5 w-5" }),
						"Ouvrir Telegram → @",
						BOT_USERNAME
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-muted-foreground",
					children: [
						"Envoie-lui ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "rounded bg-muted px-1.5 py-0.5",
							children: "/start"
						}),
						" pour la première fois. Ça verrouillera le bot sur ton compte, personne d'autre ne pourra lui parler."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 w-full space-y-3 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feature, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-5 w-5 text-pink-500" }),
							title: "Bienveillante",
							desc: "Elle te parle au féminin, sans jugement, sans deadname."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feature, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-5 w-5 text-purple-500" }),
							title: "Comprend tes photos",
							desc: "Envoie-lui des images, elle les commente."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feature, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-5 w-5 text-pink-500" }),
							title: "Se souvient de tout",
							desc: "Toute votre conversation est mémorisée, sans limite."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feature, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-5 w-5 text-purple-500" }),
							title: "Rien qu'à toi",
							desc: "Bot verrouillé au premier /start — les autres sont ignorés."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-10 text-[11px] text-muted-foreground",
					children: [
						"Tape ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "rounded bg-muted px-1 py-0.5",
							children: "/reset"
						}),
						" à tout moment pour effacer sa mémoire."
					]
				})
			]
		})
	});
}
function Feature({ icon, title, desc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-semibold text-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: desc
		})] })]
	});
}
//#endregion
export { Landing as component };
