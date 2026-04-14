import { getAllProperties, resolveFeaturedImageId } from "~~/server/utils/properties";

export default defineEventHandler(async () => {
  const allProperties = await getAllProperties();

  const activeProperties = allProperties.filter(
    (p) => p.status === "active" || p.status === "pending" || p.status === "sold"
  );

  const properties = await Promise.all(
    activeProperties.map(async (property) => {
      const mediaFolder = property.publicFolderId || property.folderId;
      const fileId = await resolveFeaturedImageId(mediaFolder);
      return { ...property, featuredImageFileId: fileId };
    })
  );

  return { properties };
});
