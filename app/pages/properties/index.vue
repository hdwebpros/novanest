<script setup lang="ts">
import { useProperties } from "~/composables/useProperties";

useHead({
  title: "Properties | NovaNest",
});

useSeoMeta({
  title: "Our Properties | NovaNest",
  description:
    "Browse available properties from NovaNest. Find your next investment or home in Minnesota.",
});

const { data, status } = useProperties();

const properties = computed(() => data.value?.properties ?? []);
</script>

<template>
  <div class="min-h-screen bg-brand-beige">
    <LayoutPropertiesNav />

    <!-- Header -->
    <section class="gradient-hero px-6 md:px-20 py-16 md:py-24 text-center">
      <h1 class="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
        Our Properties
      </h1>
      <p class="text-lg text-white/80 max-w-2xl mx-auto">
        Explore our available properties. Each listing includes photos, details,
        and everything you need to make an informed decision.
      </p>
    </section>

    <!-- Property Grid -->
    <section class="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      <!-- Loading state -->
      <div
        v-if="status === 'pending'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="rounded-2xl overflow-hidden bg-white border border-pink-600/10 animate-pulse"
        >
          <div class="aspect-[4/3] bg-stone-200" />
          <div class="p-5 space-y-3">
            <div class="h-3 bg-stone-200 rounded w-1/2" />
            <div class="h-7 bg-stone-200 rounded w-1/3" />
            <div class="h-4 bg-stone-200 rounded w-3/4" />
          </div>
        </div>
      </div>

      <!-- Properties -->
      <div
        v-else-if="properties.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <PropertiesPropertyCard
          v-for="property in properties"
          :key="property.slug"
          :property="property"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-20">
        <Icon
          name="lucide:home"
          class="w-16 h-16 text-brand-gray/40 mx-auto mb-4"
        />
        <h2 class="text-xl font-heading font-semibold text-stone-700 mb-2">
          No properties available
        </h2>
        <p class="text-brand-gray">
          Check back soon — new listings are added regularly.
        </p>
      </div>
    </section>

    <LayoutFooter />
  </div>
</template>
