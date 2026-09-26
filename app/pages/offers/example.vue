<script setup lang="ts">
// Sample seller page for review, rendered from fixtures (no database). Unlisted + noindex.
// /offers/example, ?variant=duplex, ?state=expired, ?state=notfound
import type { OfferView } from "#shared/types/offer";
import main from "#shared/fixtures/offer-view.example.json";
import duplex from "#shared/fixtures/offer-view.duplex.example.json";

const route = useRoute();
const offer = computed(() => (route.query.variant === "duplex" ? duplex : main) as OfferView);

useHead({ title: "Your offer | NovaNest", meta: [{ name: "robots", content: "noindex, nofollow" }] });
</script>

<template>
  <OfferExpired v-if="route.query.state === 'expired'" :expires-at="offer.expiresAt" />
  <OfferNotFound v-else-if="route.query.state === 'notfound'" />
  <OfferSheet v-else :offer="offer" />
</template>
