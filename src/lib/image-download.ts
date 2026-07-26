export type ImageFormat = "png" | "jpeg" | "webp";

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: "PNG",
  jpeg: "JPG",
  webp: "WEBP",
};

const EXT: Record<ImageFormat, string> = { png: "png", jpeg: "jpg", webp: "webp" };

function isNative() {
  return typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.() === true;
}

async function convert(src: string, format: ImageFormat): Promise<Blob> {
  if (format === "png" && src.startsWith("data:image/png")) {
    const res = await fetch(src);
    return res.blob();
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("load"));
    img.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, `image/${format}`, format === "png" ? undefined : 0.95),
  );
  if (!blob) throw new Error("convert");
  return blob;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(blob);
  });
}

/** Télécharge l'image dans le format demandé. Retourne un message à afficher. */
export async function downloadImage(src: string, format: ImageFormat): Promise<string> {
  const blob = await convert(src, format);
  const name = `lyra-${Date.now()}.${EXT[format]}`;

  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const data = await blobToBase64(blob);
      await Filesystem.writeFile({ path: name, data, directory: Directory.Documents, recursive: true });
      return `Image enregistrée dans Documents (${name})`;
    } catch {
      /* fallback navigateur */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return `Image téléchargée (${name})`;
}
