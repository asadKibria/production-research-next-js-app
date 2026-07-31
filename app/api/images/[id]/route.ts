import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Serves admin-uploaded images out of the database. Ids are immutable, so the
 * response is cached aggressively by the CDN and the browser.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const image = await prisma.uploadedImage.findUnique({
    where: { id },
    select: { mimeType: true, data: true },
  });

  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = new Uint8Array(image.data);

  return new NextResponse(body, {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
