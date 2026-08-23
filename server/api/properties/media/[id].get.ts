import sharp from "sharp";
import { getDriveClient } from "~~/server/utils/google";

export default defineEventHandler(async (event) => {
  const fileId = getRouterParam(event, "id");
  if (!fileId) {
    throw createError({ statusCode: 400, statusMessage: "File ID required" });
  }

  const drive = getDriveClient();

  const meta = await drive.files.get({
    fileId,
    fields: "mimeType",
    supportsAllDrives: true,
  });

  const mimeType = meta.data.mimeType || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");

  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );

  let buffer = Buffer.from(response.data as ArrayBuffer);

  const query = getQuery(event);
  const width = query.w ? parseInt(query.w as string, 10) : null;

  // .rotate() with no args applies EXIF orientation (iPhone photos)
  // and strips the tag so browsers/resizes don't show them sideways.
  if (isImage) {
    try {
      let pipeline = sharp(buffer).rotate();
      if (width && width > 0 && width <= 2000) {
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
      }
      buffer = await pipeline.toBuffer();
    } catch (err) {
      console.error(`[media] sharp failed for ${fileId}:`, err);
    }
  }

  setResponseHeaders(event, {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=86400",
  });

  return send(event, buffer);
});
