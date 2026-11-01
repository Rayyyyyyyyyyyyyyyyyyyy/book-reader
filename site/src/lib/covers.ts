import { getImage } from "astro:assets";

const coverModules = import.meta.glob<{ default: ImageMetadata }>("../assets/covers/*.jpg", { eager: true });

// Optimized cover URL (modern format), sized for grid cards and the photo inside the 3D book's cover.
export async function coverUrl(file?: string): Promise<string> {
  if (!file) return "";
  const mod = coverModules[`../assets/covers/${file}`];
  if (!mod) return "";
  const img = await getImage({ src: mod.default, width: 420, format: "webp" });
  return img.src;
}
