"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MAX_EDGE = 1600;
const QUALITY = 0.85;
/** Comfortably under the 4 MB server action body limit even after base64/multipart overhead. */
const HARD_LIMIT_BYTES = 3.5 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Downscales a picture in the browser before it is ever submitted.
 *
 * Phone photos are routinely 3–6 MB, which blows past the server action body
 * limit and fails with an opaque 413 long before any of our own validation
 * runs. Re-encoding to at most 1600px of JPEG typically lands under 400 KB.
 */
async function compressImage(file: File): Promise<File> {
  // Formats canvas cannot faithfully re-encode (or that are already tiny).
  if (file.type === "image/gif" || file.size <= 200 * 1024) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}

export function ImageUploadField({
  name,
  currentImage,
  previewClassName = "h-24 w-24",
}: {
  name: string;
  currentImage?: string | null;
  previewClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    setNote(null);
    if (!file) {
      setPreview(null);
      return;
    }

    setBusy(true);
    try {
      const original = file.size;
      const compressed = await compressImage(file);

      if (compressed.size > HARD_LIMIT_BYTES) {
        setError(
          `ছবিটি খুব বড় (${formatSize(compressed.size)})। ${formatSize(HARD_LIMIT_BYTES)} এর কম সাইজের ছবি দিন।`,
        );
        if (inputRef.current) inputRef.current.value = "";
        setPreview(null);
        return;
      }

      // Put the shrunken file back so the form submits that instead.
      if (compressed !== file && inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        inputRef.current.files = dt.files;
        setNote(`${formatSize(original)} → ${formatSize(compressed.size)} এ কমানো হয়েছে`);
      } else {
        setNote(formatSize(compressed.size));
      }

      setPreview(URL.createObjectURL(compressed));
    } finally {
      setBusy(false);
    }
  }

  const shown = preview ?? currentImage ?? null;

  return (
    <div className="flex flex-col gap-2">
      {shown ? (
        <div className={`relative overflow-hidden rounded-xl bg-paper ${previewClassName}`}>
          {preview ? (
            // Object URLs cannot go through the image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image src={shown} alt="" fill sizes="128px" className="object-cover" />
          )}
        </div>
      ) : null}

      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="text-sm text-ink-700"
      />

      {busy ? <span className="text-xs text-ink-700">ছবি প্রস্তুত করা হচ্ছে…</span> : null}
      {note && !busy ? <span className="text-xs text-taupe-600">{note}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
