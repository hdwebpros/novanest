<script setup lang="ts">
import type { Property } from "~/types/property";
import { formatPrice, formatNumber } from "~/utils/formatters";

const props = defineProps<{
  property: Property;
}>();

const imageUrl = computed(() => {
  if (props.property.featuredImageFileId) {
    return `/api/properties/media/${props.property.featuredImageFileId}?w=600`;
  }
  return "";
});

const statusLabel = computed(() => {
  if (props.property.status === "pending") return "Pending";
  if (props.property.status === "sold") return "Sold";
  return null;
});
</script>

<template>
  <NuxtLink
    :to="`/properties/${property.slug}`"
    class="group block rounded-2xl overflow-hidden bg-white border border-pink-600/10 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
  >
    <!-- Image -->
    <div class="relative aspect-[4/3] overflow-hidden bg-stone-100">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="property.address"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-stone-400"
      >
        <Icon name="lucide:home" class="w-12 h-12" />
      </div>

      <!-- Status badge -->
      <Badge
        v-if="statusLabel"
        :class="
          property.status === 'sold'
            ? 'bg-stone-900 text-white'
            : 'bg-yellow-500 text-stone-900'
        "
        class="absolute top-3 left-3 text-xs uppercase font-semibold"
      >
        {{ statusLabel }}
      </Badge>
    </div>

    <!-- Content -->
    <div class="p-5">
      <div class="flex items-center gap-2 text-xs text-brand-gray uppercase tracking-wide mb-1">
        <span>{{ property.propertyType }}</span>
        <span>&middot;</span>
        <span>{{ property.city }}, {{ property.state }}</span>
      </div>

      <p class="text-2xl font-heading font-bold text-pink-600 mb-3">
        ${{ formatPrice(property.price) }}
      </p>

      <div class="flex items-center gap-4 text-sm text-stone-700">
        <div class="flex items-center gap-1">
          <Icon name="lucide:bed-double" class="w-4 h-4 text-brand-gray" />
          <span>{{ property.beds }} bd</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:bath" class="w-4 h-4 text-brand-gray" />
          <span>{{ property.baths }} ba</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:ruler" class="w-4 h-4 text-brand-gray" />
          <span>{{ formatNumber(property.sqft) }} sqft</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
