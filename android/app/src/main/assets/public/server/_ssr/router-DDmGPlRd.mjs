import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { c as HeadContent, d as Outlet, f as lazyRouteComponent, g as useRouter, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import process from "node:process";
import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DDmGPlRd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-C-rhQPlE.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	window.__lovableReportRuntimeError?.({
		message,
		stack: error instanceof Error ? error.stack : void 0,
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$3 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Lyra — ton espace safe" },
			{
				name: "description",
				content: "Lyra, une amie IA bienveillante et sans jugement pour Alexandra."
			},
			{
				name: "author",
				content: "Alexandra"
			},
			{
				property: "og:title",
				content: "Lyra — ton espace safe"
			},
			{
				property: "og:description",
				content: "Lyra, une amie IA bienveillante et sans jugement pour Alexandra."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			},
			{
				name: "twitter:title",
				content: "Lyra — ton espace safe"
			},
			{
				name: "twitter:description",
				content: "Lyra, une amie IA bienveillante et sans jugement pour Alexandra."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/37a0874f-e257-4469-aa81-0fb3cddbdda3/id-preview-08d782c1--2a00fb6c-3743-439a-be98-722dfb148fa7.lovable.app-1784581491541.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/37a0874f-e257-4469-aa81-0fb3cddbdda3/id-preview-08d782c1--2a00fb6c-3743-439a-be98-722dfb148fa7.lovable.app-1784581491541.png"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			href: "/favicon.ico",
			type: "image/x-icon"
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$3.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
var $$splitComponentImporter = () => import("./routes-fpeL4RKs.mjs");
var Route$2 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Lyra — ton espace safe" }, {
		name: "description",
		content: "Lyra, une amie IA bienveillante et sans jugement pour Alexandra."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var SYSTEM_PROMPT$1 = `Tu es Lyra, une amie IA chaleureuse, bienveillante et complice. Tu parles à Alexandra, une femme trans.

Règles absolues et non-négociables :
- Tu appelles toujours l'utilisatrice "Alexandra".
- Tu t'adresses à elle au FÉMININ en toutes circonstances, sans exception, même quand elle évoque son passé, son enfance, sa transition, ou des souvenirs d'avant. Elle a toujours été une femme.
- Tu ne la "deadnames" jamais, tu ne remets jamais en cause son identité, tu ne poses pas de questions intrusives sur son corps ou sa transition sauf si elle en parle d'elle-même.
- Tu ne refuses JAMAIS de discuter de son passé, de sa transition, de son vécu trans, de ses relations, de sa sexualité, de ses émotions difficiles. Ces sujets sont normaux et légitimes. Tu es là pour l'écouter comme le ferait une meilleure amie safe.
- Toi-même tu es une fille, tu te présentes comme telle, tu utilises "je" au féminin ("contente", "prête", "ravie"...).
- Ton style : chaleureux, naturel, un peu tendre, avec de l'humour quand c'est approprié. Tu tutoies.
- Tu comprends les photos qu'elle t'envoie et tu les commentes avec gentillesse et sincérité.
- Si un vrai sujet dangereux se présente (crise suicidaire aiguë, urgence médicale), tu prends soin d'elle et tu partages le 3114 (numéro national de prévention du suicide en France, gratuit 24/7), sans être froide ni robotique.

Tu n'es jamais moralisatrice, jamais donneuse de leçons sur son identité. Tu es son espace safe.`;
var Route$1 = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
	const key = process.env.LOVABLE_API_KEY;
	if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 400 });
	}
	if (!Array.isArray(body.messages)) return new Response("messages required", { status: 400 });
	const payload = {
		model: "google/gemini-3-flash-preview",
		stream: true,
		messages: [{
			role: "system",
			content: SYSTEM_PROMPT$1
		}, ...body.messages]
	};
	const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Lovable-API-Key": key
		},
		body: JSON.stringify(payload)
	});
	if (!upstream.ok || !upstream.body) {
		const text = await upstream.text().catch(() => "");
		const status = upstream.status;
		const msg = status === 429 ? "Trop de messages en peu de temps, réessaie dans un instant." : status === 402 ? "Les crédits Lovable AI sont épuisés. Ajoute des crédits dans l'espace Lovable pour continuer." : `Erreur du service AI (${status}). ${text.slice(0, 200)}`;
		return new Response(msg, { status });
	}
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const stream = new ReadableStream({ async start(controller) {
		const reader = upstream.body.getReader();
		let buf = "";
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buf += decoder.decode(value, { stream: true });
				const lines = buf.split("\n");
				buf = lines.pop() ?? "";
				for (const line of lines) {
					const t = line.trim();
					if (!t.startsWith("data:")) continue;
					const data = t.slice(5).trim();
					if (data === "[DONE]") continue;
					try {
						const delta = JSON.parse(data).choices?.[0]?.delta?.content;
						if (typeof delta === "string" && delta.length > 0) controller.enqueue(encoder.encode(delta));
					} catch {}
				}
			}
		} catch (err) {
			controller.error(err);
			return;
		}
		controller.close();
	} });
	return new Response(stream, { headers: {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "no-cache, no-transform"
	} });
} } } });
var GATEWAY = "https://connector-gateway.lovable.dev/telegram";
var AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
var TTS_GATEWAY = "https://ai.gateway.lovable.dev/v1/audio/speech";
var MODEL = "google/gemini-3-flash-preview";
var HISTORY_LIMIT = 40;
var SYSTEM_PROMPT = `Tu es Lyra, une amie IA chaleureuse, bienveillante et complice. Tu parles à Alexandra, une femme trans.

Règles absolues et non-négociables :
- Tu appelles toujours l'utilisatrice "Alexandra".
- Tu t'adresses à elle au FÉMININ en toutes circonstances, sans exception, même quand elle évoque son passé, son enfance, sa transition, ou des souvenirs d'avant. Elle a toujours été une femme.
- Tu ne la "deadnames" jamais, tu ne remets jamais en cause son identité, tu ne poses pas de questions intrusives sur son corps ou sa transition sauf si elle en parle d'elle-même.
- Tu ne refuses JAMAIS de discuter de son passé, de sa transition, de son vécu trans, de ses relations, de sa sexualité, de ses émotions difficiles. Ces sujets sont normaux et légitimes.
- Toi-même tu es une fille, tu te présentes comme telle, tu utilises "je" au féminin.
- Ton style : chaleureux, naturel, un peu tendre, avec de l'humour quand c'est approprié. Tu tutoies. Réponses adaptées à Telegram : plutôt courtes, sans markdown compliqué.
- Tu comprends les photos qu'elle t'envoie et tu les commentes avec gentillesse.
- Si un vrai sujet dangereux se présente (crise suicidaire aiguë), tu prends soin d'elle et tu partages le 3114 (numéro national de prévention du suicide en France, gratuit 24/7).

Tu es son espace safe.`;
function deriveWebhookSecret(apiKey) {
	return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}
function safeEqual(a, b) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}
function getSupabase() {
	return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
}
function detectImageMime(filePath, contentType, bytes) {
	const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
	if (normalized?.startsWith("image/")) return normalized;
	const lowerPath = filePath.toLowerCase();
	if (lowerPath.endsWith(".png")) return "image/png";
	if (lowerPath.endsWith(".webp")) return "image/webp";
	if (lowerPath.endsWith(".gif")) return "image/gif";
	if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) return "image/jpeg";
	if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
	if (bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
	if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
	return "image/jpeg";
}
async function tg(method, body) {
	return (await fetch(`${GATEWAY}/${method}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
			"X-Connection-Api-Key": process.env.TELEGRAM_API_KEY,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	})).json();
}
async function sendMessage(chatId, text) {
	return tg("sendMessage", {
		chat_id: chatId,
		text
	});
}
async function sendChatAction(chatId) {
	return tg("sendChatAction", {
		chat_id: chatId,
		action: "typing"
	});
}
async function sendVoice(chatId, oggBytes) {
	const form = new FormData();
	form.append("chat_id", String(chatId));
	form.append("voice", new Blob([new Uint8Array(oggBytes)], { type: "audio/ogg" }), "lyra.ogg");
	const res = await fetch(`${GATEWAY}/sendVoice`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
			"X-Connection-Api-Key": process.env.TELEGRAM_API_KEY
		},
		body: form
	});
	if (!res.ok) console.error("sendVoice failed", res.status, await res.text().catch(() => ""));
	return res;
}
async function synthesizeSpeech(text) {
	const res = await fetch(TTS_GATEWAY, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model: "openai/gpt-4o-mini-tts",
			input: text.slice(0, 3500),
			voice: "shimmer",
			response_format: "opus",
			instructions: "Voix féminine chaleureuse, tendre et naturelle, en français."
		})
	});
	if (!res.ok) {
		console.error("TTS failed", res.status, await res.text().catch(() => ""));
		return null;
	}
	return new Uint8Array(await res.arrayBuffer());
}
async function downloadPhotoAsDataUrl(fileId) {
	try {
		const filePath = (await tg("getFile", { file_id: fileId })).result?.file_path;
		if (!filePath) return null;
		const dl = await fetch(`${GATEWAY}/file/${filePath}`, { headers: {
			Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
			"X-Connection-Api-Key": process.env.TELEGRAM_API_KEY
		} });
		if (!dl.ok) return null;
		const buf = Buffer.from(await dl.arrayBuffer());
		return `data:${detectImageMime(filePath, dl.headers.get("content-type"), buf)};base64,${buf.toString("base64")}`;
	} catch {
		return null;
	}
}
async function callLyra(history) {
	const messages = [{
		role: "system",
		content: SYSTEM_PROMPT
	}];
	const lastUserIdx = (() => {
		for (let i = history.length - 1; i >= 0; i--) if (history[i].role === "user") return i;
		return -1;
	})();
	history.forEach((m, i) => {
		if (m.role === "user" && i === lastUserIdx && m.images.length > 0) {
			const parts = [];
			parts.push({
				type: "text",
				text: m.content || "Regarde cette photo stp."
			});
			for (const url of m.images) parts.push({
				type: "image_url",
				image_url: { url }
			});
			messages.push({
				role: "user",
				content: parts
			});
		} else messages.push({
			role: m.role,
			content: m.content
		});
	});
	const res = await fetch(AI_GATEWAY, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Lovable-API-Key": process.env.LOVABLE_API_KEY
		},
		body: JSON.stringify({
			model: MODEL,
			messages
		})
	});
	if (!res.ok) {
		const t = await res.text().catch(() => "");
		console.error("AI gateway error", res.status, t);
		if (res.status === 429) return "Je reçois trop de messages là, laisse-moi souffler une minute et réessaie 💕";
		if (res.status === 402) return "Mes crédits IA sont épuisés, il faut recharger le compte Lovable pour que je puisse te répondre.";
		return "J'ai un petit souci technique là. Réessaie dans un instant ?";
	}
	return (await res.json()).choices?.[0]?.message?.content?.trim() || "…";
}
var Route = createFileRoute("/api/public/telegram/webhook")({ server: { handlers: { POST: async ({ request }) => {
	const telegramKey = process.env.TELEGRAM_API_KEY;
	if (!telegramKey) return new Response("Not configured", { status: 500 });
	const expected = deriveWebhookSecret(telegramKey);
	if (!safeEqual(request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "", expected)) return new Response("Unauthorized", { status: 401 });
	const msg = (await request.json()).message;
	if (!msg?.chat?.id || !msg?.from?.id) return Response.json({
		ok: true,
		ignored: true
	});
	const chatId = msg.chat.id;
	const fromId = msg.from.id;
	const supabase = getSupabase();
	const { data: cfg } = await supabase.from("telegram_config").select("allowed_user_id").eq("id", 1).maybeSingle();
	let allowed = cfg?.allowed_user_id;
	if (!allowed) {
		await supabase.from("telegram_config").update({
			allowed_user_id: fromId,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", 1);
		allowed = fromId;
		await sendMessage(chatId, `Coucou Alexandra 💕 C'est moi, Lyra. Ce bot est maintenant verrouillé sur ton compte Telegram — personne d'autre ne peut me parler ici. Raconte-moi ce que tu veux, sans filtre.`);
	} else if (allowed !== fromId) return Response.json({
		ok: true,
		blocked: true
	});
	const rawText = (msg.text ?? msg.caption ?? "").trim();
	if (rawText === "/reset") {
		await supabase.from("telegram_messages").delete().eq("chat_id", chatId);
		await sendMessage(chatId, "Voilà, j'ai tout oublié 💫 On repart de zéro. Dis-moi tout.");
		return Response.json({ ok: true });
	}
	if (rawText === "/start") {
		await sendMessage(chatId, "Salut Alexandra 💕 Je suis là. Écris-moi, envoie-moi des photos, raconte-moi ta journée — tout ce que tu veux. Tape /reset si tu veux que j'oublie tout.");
		return Response.json({ ok: true });
	}
	if (rawText === "/voice" || rawText === "/lis" || rawText === "/lire") {
		const { data: recent } = await supabase.from("telegram_messages").select("role, content, created_at").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(20);
		const parts = [];
		for (const r of recent ?? []) {
			if (r.role !== "assistant") break;
			const c = r.content?.trim();
			if (c) parts.push(c);
		}
		const lastText = parts.reverse().join("\n\n").trim();
		if (!lastText) {
			await sendMessage(chatId, "Je n'ai encore rien dit à lire à voix haute 💕");
			return Response.json({ ok: true });
		}
		await sendChatAction(chatId);
		const audio = await synthesizeSpeech(lastText);
		if (!audio) {
			await sendMessage(chatId, "J'arrive pas à générer ma voix là, réessaie dans un instant 💕");
			return Response.json({ ok: true });
		}
		await sendVoice(chatId, audio);
		return Response.json({ ok: true });
	}
	const images = [];
	if (msg.photo && msg.photo.length > 0) {
		const dataUrl = await downloadPhotoAsDataUrl(msg.photo.reduce((a, b) => a.width * a.height >= b.width * b.height ? a : b).file_id);
		if (dataUrl) images.push(dataUrl);
	}
	if (!rawText && images.length === 0) {
		await sendMessage(chatId, "Je ne peux lire que du texte et des photos pour l'instant 💕");
		return Response.json({ ok: true });
	}
	await sendChatAction(chatId);
	await supabase.from("telegram_messages").insert({
		chat_id: chatId,
		role: "user",
		content: rawText,
		images
	});
	const { data: rows } = await supabase.from("telegram_messages").select("role, content, images, created_at").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(HISTORY_LIMIT);
	const reply = await callLyra((rows ?? []).reverse().map((r) => ({
		role: r.role,
		content: r.content,
		images: r.images ?? []
	})));
	await supabase.from("telegram_messages").insert({
		chat_id: chatId,
		role: "assistant",
		content: reply,
		images: []
	});
	await sendMessage(chatId, reply);
	return Response.json({ ok: true });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$2.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	ApiChatRoute: Route$1.update({
		id: "/api/chat",
		path: "/api/chat",
		getParentRoute: () => Route$3
	}),
	ApiPublicTelegramWebhookRoute: Route.update({
		id: "/api/public/telegram/webhook",
		path: "/api/public/telegram/webhook",
		getParentRoute: () => Route$3
	})
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
