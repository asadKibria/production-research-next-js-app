import "server-only";
import { prisma } from "@/app/lib/prisma";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Persists an admin-uploaded image and returns the public URL that serves it.
 *
 * Images go into Postgres instead of `public/uploads` because Vercel's
 * filesystem is read-only at runtime: writing there throws EROFS in production
 * and, even where it succeeds, the file is gone after the next deploy.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("অসমর্থিত ছবির ফরম্যাট (jpg, png, webp, gif সমর্থিত)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("ছবির সাইজ ৫MB এর কম হতে হবে");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const record = await prisma.uploadedImage.create({
    data: { mimeType: file.type, byteSize: bytes.byteLength, data: bytes },
    select: { id: true },
  });

  return `/api/images/${record.id}`;
}
