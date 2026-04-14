export interface Property {
  folderId: string;
  status: "active" | "pending" | "sold" | "draft";
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  value: number;
  beds: number;
  baths: number;
  sqft: number;
  acreage: number;
  propertyType: string;
  terms: string;
  closeDate: string;
  additionalInfo: string;
  slug: string;
  featuredImageFileId?: string;
  publicFolderId?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  mimeType: string;
  type: "image" | "video" | "document" | "other";
}

export interface PropertyDetail {
  property: Property;
  media: MediaFile[];
  description: string;
}

export interface PropertiesResponse {
  properties: Property[];
}

export interface PropertyDetailResponse {
  property: Property;
  media: MediaFile[];
  description: string;
}
