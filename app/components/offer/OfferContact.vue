<script setup lang="ts">
// Contact details match the rest of the site (nav, property pages, footer).
withDefaults(defineProps<{ heading?: string; body?: string }>(), {
  heading: "Questions? Talk to Emily.",
  body: "She's happy to walk you through any of these numbers. No pressure, and no obligation.",
});
</script>

<template>
  <section
    class="overflow-hidden rounded-3xl bg-stone-900 text-white shadow-lg shadow-stone-900/10"
  >
    <div class="p-6 sm:p-8">
      <div class="flex items-center gap-4 sm:gap-5">
        <img
          src="/emily.jpg"
          alt="Emily from NovaNest"
          width="160"
          height="240"
          class="h-16 w-16 shrink-0 rounded-full object-cover object-top ring-4 ring-white/10 sm:h-20 sm:w-20"
        />
        <h2 class="font-heading text-2xl font-bold leading-tight sm:text-3xl">{{ heading }}</h2>
      </div>
      <div>
        <p class="mt-4 text-sm leading-relaxed text-white/75">{{ body }}</p>
        <div class="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href="tel:6124402899"
            class="btn-gradient inline-flex items-center justify-center gap-2 py-3"
          >
            <Icon name="lucide:phone" class="h-4 w-4" />
            Call (612) 440-2899
          </a>
          <a
            href="mailto:emily@novanest.homes"
            class="btn-secondary inline-flex items-center justify-center gap-2 py-3"
          >
            <Icon name="lucide:mail" class="h-4 w-4" />
            Email Emily
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
