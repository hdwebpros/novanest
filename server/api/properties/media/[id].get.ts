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

  if (isImage && width && width > 0 && width <= 2000) {
    buffer = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .toBuffer();
  }

  setResponseHeaders(event, {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=86400",
  });

  return send(event, buffer);
});
