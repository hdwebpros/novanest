import {
  getPropertyBySlug,
  getPropertyMedia,
  getPropertyDescription,
  resolveFeaturedImageId,
} from "~~/server/utils/properties";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Slug is required" });
  }

  const property = await getPropertyBySlug(slug);
  if (!property) {
    throw createError({ statusCode: 404, statusMessage: "Property not found" });
  }

  const mediaFolder = property.publicFolderId || property.folderId;

  const [media, description, featuredImageFileId] = await Promise.all([
    getPropertyMedia(mediaFolder),
    getPropertyDescription(mediaFolder),
    resolveFeaturedImageId(mediaFolder),
  ]);

  property.featuredImageFileId = featuredImageFileId;

  return { property, media, description };
});
