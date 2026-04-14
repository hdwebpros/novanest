import type { PropertiesResponse, PropertyDetailResponse } from "~/types/property";

export function useProperties() {
  return useAsyncData("properties", () =>
    $fetch<PropertiesResponse>("/api/properties")
  );
}

export function useProperty(slug: MaybeRef<string>) {
  return useAsyncData(`property-${toValue(slug)}`, () =>
    $fetch<PropertyDetailResponse>(`/api/properties/${toValue(slug)}`)
  );
}
