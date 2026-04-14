import type { Property, MediaFile } from "~~/app/types/property";
import { getDriveClient } from "./google";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Parse the Google Doc HTML export: extract table key-value pairs + description
function parsePropertyDoc(html: string): {
  fields: Record<string, string>;
  description: string;
} {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  const fields: Record<string, string> = {};
  let description: string = body || "";

  const tableMatch = (body || "").match(/<table[\s\S]*?<\/table>/i);
  if (tableMatch) {
    const table = tableMatch[0];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(table)) !== null) {
      const rowHtml = match[1] || "";
      const cells = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
      if (cells && cells.length >= 2) {
        const key = cells[0]
          .replace(/<[^>]*>/g, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");
        const value = cells[1].replace(/<[^>]*>/g, "").trim();
        if (key && value && key !== "field") fields[key] = value;
      }
    }

    const tableEnd = (body || "").indexOf("</table>") + 8;
    description = (body || "").substring(tableEnd);
  }

  description = description.replace(/\s*style="[^"]*"/gi, "");

  return { fields, description };
}

function buildProperty(
  folderId: string,
  folderName: string,
  fields: Record<string, string>
): Property {
  return {
    folderId,
    status: (fields.status as Property["status"]) || "active",
    address: fields.address || folderName,
    city: fields.city || "",
    state: fields.state || "",
    zip: fields.zip || "",
    price: Number(fields.price) || 0,
    value: Number(fields.value || fields.market_value) || 0,
    beds: Number(fields.beds || fields.bedrooms) || 0,
    baths: Number(fields.baths || fields.bathrooms) || 0,
    sqft: Number(fields.sqft || fields.square_feet) || 0,
    acreage: Number(fields.acreage || fields.acres) || 0,
    propertyType: fields.property_type || fields.type || "",
    terms: fields.terms || "",
    closeDate: fields.close_date || "",
    additionalInfo: fields.additional_info || "",
    slug: slugify(folderName),
  };
}

async function getPublicFolderId(
  propertyFolderId: string
): Promise<string | undefined> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${propertyFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = 'Public' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return response.data.files?.[0]?.id || undefined;
}

async function getDocFromFolder(
  publicFolderId: string
): Promise<{ fields: Record<string, string>; description: string }> {
  const drive = getDriveClient();


  const response = await drive.files.list({
    q: `'${publicFolderId}' in parents and mimeType = 'application/vnd.google-apps.document' and name = 'About This Deal' and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const docId = response.data.files?.[0]?.id;
  if (!docId) {
    return { fields: {}, description: "" };
  }


  const exportResponse = await drive.files.export({
    fileId: docId,
    mimeType: "text/html",
  });

  return parsePropertyDoc(exportResponse.data as string);
}

export const getAllProperties = defineCachedFunction(
  async (): Promise<Property[]> => {
    const config = useRuntimeConfig();
    const drive = getDriveClient();

    const response = await drive.files.list({
      q: `'${config.googlePropertiesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      orderBy: "name",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const folders = response.data.files;
    if (!folders || folders.length === 0) return [];

    const properties = await Promise.all(
      folders.map(async (folder) => {
        const folderId = folder.id!;
        const folderName = folder.name || "Unknown";

        try {
          const publicFolderId = await getPublicFolderId(folderId);
          const { fields } = publicFolderId
            ? await getDocFromFolder(publicFolderId)
            : { fields: {} };
          const property = buildProperty(folderId, folderName, fields);
          property.publicFolderId = publicFolderId;

          if (property.status === "draft") return null;

          return property;
        } catch (err) {
          console.error(`[getAllProperties] Error processing folder "${folderName}" (${folderId}):`, err);
          return null;
        }
      })
    );

    return properties.filter((p): p is Property => p !== null);
  },
  {
    maxAge: 300,
    name: "all-properties",
    getKey: () => "all",
  }
);

export async function getPropertyBySlug(
  slug: string
): Promise<Property | undefined> {
  const properties = await getAllProperties();
  return properties.find((p) => p.slug === slug);
}

export const getPropertyMedia = defineCachedFunction(
  async (folderId: string): Promise<MediaFile[]> => {
    const drive = getDriveClient();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
      orderBy: "name",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files;
    if (!files) return [];

    return files
      .filter((file) => {
        return file.mimeType !== "application/vnd.google-apps.folder";
      })
      .map((file) => {
        let type: MediaFile["type"] = "other";
        const mime = file.mimeType || "";
        if (mime.startsWith("image/")) type = "image";
        else if (mime.startsWith("video/")) type = "video";
        else if (mime === "application/pdf") type = "document";
        else if (mime === "application/vnd.google-apps.document") type = "document";

        return {
          id: file.id || "",
          name: file.name || "",
          mimeType: mime,
          type,
        };
      });
  },
  {
    maxAge: 600,
    name: "property-media",
    getKey: (folderId: string) => folderId,
  }
);

export async function getPropertyDescription(
  publicFolderId: string
): Promise<string> {
  const { description } = await getDocFromFolder(publicFolderId);
  return description;
}

export async function resolveFeaturedImageId(
  folderId: string
): Promise<string | undefined> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const images = response.data.files;
  if (!images || images.length === 0) return undefined;

  const featured = images.find((f) =>
    (f.name || "").toLowerCase().includes("featured")
  );

  const pick = featured ?? images[0];
  if (!pick) return undefined;
  return pick.id || undefined;
}

export async function resolveFileIdByName(
  folderId: string,
  fileName: string
): Promise<string | undefined> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return response.data.files?.[0]?.id || undefined;
}

export async function getKnownPublicFolderIds(): Promise<Set<string>> {
  const properties = await getAllProperties();
  const ids = new Set<string>();
  for (const p of properties) {
    if (p.publicFolderId) ids.add(p.publicFolderId);
    ids.add(p.folderId);
  }
  return ids;
}

export async function isFileInPropertyFolder(
  fileId: string
): Promise<boolean> {
  const drive = getDriveClient();

  const file = await drive.files.get({
    fileId,
    fields: "parents",
    supportsAllDrives: true,
  });

  const parents = file.data.parents;
  if (!parents || parents.length === 0) return false;

  const knownFolders = await getKnownPublicFolderIds();
  return parents.some((parentId) => knownFolders.has(parentId));
}
