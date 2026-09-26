<script setup lang="ts">
defineProps<{ expiresAt: string }>();
</script>

<template>
  <div class="min-h-screen">
    <div class="bg-stone-900 px-4 pb-24 pt-5">
      <div class="mx-auto max-w-3xl">
        <OfferBrandBar />
      </div>
    </div>
    <main class="mx-auto -mt-16 max-w-3xl space-y-6 px-4 pb-16">
      <div class="rounded-3xl border border-pink-600/10 bg-white p-6 text-center shadow-xl shadow-stone-900/5 sm:p-10">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-ivory text-pink-600">
          <Icon name="lucide:clock" class="h-6 w-6" />
        </div>
        <h1 class="mt-4 font-heading text-3xl font-bold text-stone-900">This offer has expired</h1>
        <p class="mx-auto mt-3 max-w-md text-brand-gray">
          This link stopped working on {{ formatDate(expiresAt, "long") }}. Home prices and
          costs change, so Emily can put together a fresh one for you.
        </p>
      </div>
      <OfferContact heading="Contact Emily for an updated offer." body="It only takes a quick call or email." />
    </main>
  </div>
</template>
