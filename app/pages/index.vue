<script setup lang="ts"></script>
<template>
  <LayoutHeader />
  <div class="flex items-center">
    <aside class="flex-1 p-16 space-y-6">
      <h1 class="text-9xl">Life happens.</h1>
      <h3 class="text-5xl">We help homeowners move forward.</h3>
      <p class="text-2xl">Sell your house quickly, even in tough situations.</p>
    </aside>
    <NuxtImg class="flex-1" src="emilyavatar.jpg" />
  </div>
  <div class="bg-brand-ivory">
    <SectionsServices />
  </div>
  <SectionsMarketingText />
  <LayoutFooter />
</template>
