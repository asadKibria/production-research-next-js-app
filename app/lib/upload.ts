import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function extensionForType(type: string): string {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

export async function saveUploadedImage(file: File, subdir: string): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("অসমর্থিত ছবির ফরম্যাট (jpg, png, webp, gif সমর্থিত)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("ছবির সাইজ ৫MB এর কম হতে হবে");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}${extensionForType(file.type)}`;
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return `/uploads/${subdir}/${filename}`;
}
