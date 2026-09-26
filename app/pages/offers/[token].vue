<script setup lang="ts">
import type { OfferView } from "#shared/types/offer";

// GET returns the full view (status "active"), { status: "expired", expiresAt }, or 404.
type OfferResponse = OfferView | { status: "expired"; expiresAt: string };

const route = useRoute();
const token = String(route.params.token);
const { data, error } = await useFetch<OfferResponse>(
  `/api/offers/${encodeURIComponent(token)}`,
  { key: `offer-${token}` },
);

const expiredAt = computed(() =>
  data.value?.status === "expired" ? data.value.expiresAt : null,
);
const offer = computed<OfferView | null>(() =>
  data.value && data.value.status === "active" ? data.value : null,
);

if (!data.value && import.meta.server) {
  setResponseStatus(useRequestEvent()!, error.value?.statusCode === 404 ? 404 : 500);
}

useHead({ title: "Your offer | NovaNest", meta: [{ name: "robots", content: "noindex, nofollow" }] });
</script>

<template>
  <OfferExpired v-if="expiredAt" :expires-at="expiredAt" />
  <OfferSheet v-else-if="offer" :offer="offer" />
  <OfferNotFound v-else />
</template>
