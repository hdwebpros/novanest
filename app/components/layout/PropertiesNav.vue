<script setup lang="ts">
const isOfferDialogOpen = defineModel<boolean>("offerDialog", {
  default: false,
});
</script>

<template>
  <nav class="bg-stone-900 px-6 md:px-20 py-4 flex items-center justify-between">
    <div class="flex items-center gap-6">
      <NuxtLink to="/" class="flex items-center gap-3">
        <NuxtImg src="/logo.svg" class="h-8 w-auto" />
        <NuxtImg src="/name.svg" class="h-5 w-auto hidden sm:block" />
      </NuxtLink>
      <NuxtLink
        to="/properties"
        class="text-white text-sm font-semibold uppercase hover:opacity-80"
      >
        Properties
      </NuxtLink>
    </div>
    <div class="flex items-center gap-4">
      <a
        href="tel:6124402899"
        class="text-white text-sm font-semibold hover:opacity-80 hidden sm:block"
      >
        (612) 440-2899
      </a>
      <button class="btn-gradient" @click="isOfferDialogOpen = true">
        Get my offer
      </button>
    </div>
  </nav>
</template>
