<script setup lang="ts">
defineProps<{
  id: string;
  icon: string;
  title: string;
  lead: string;
  resultLabel: string;
  result: string;
  resultNote?: string | null;
  resultTone?: "good" | "warn" | null;
}>();
</script>

<template>
  <article
    :id="id"
    class="scroll-mt-6 rounded-3xl border border-pink-600/10 bg-white shadow-sm"
  >
    <header class="p-5 sm:p-7">
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-ivory text-pink-600"
        >
          <Icon :name="icon" class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h3 class="font-heading text-xl font-bold leading-snug text-stone-900">{{ title }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-brand-gray">{{ lead }}</p>
        </div>
      </div>
      <div class="mt-5 rounded-2xl bg-brand-ivory px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-gray">{{ resultLabel }}</p>
        <p class="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">{{ result }}</p>
        <p
          v-if="resultNote"
          class="mt-1 flex items-center gap-1.5 text-sm"
          :class="{
            'text-brand-gray': !resultTone,
            'font-medium text-emerald-700': resultTone === 'good',
            'font-medium text-amber-700': resultTone === 'warn',
          }"
        >
          <Icon
            v-if="resultTone"
            :name="resultTone === 'good' ? 'lucide:circle-check' : 'lucide:circle-alert'"
            class="h-4 w-4 shrink-0"
          />
          {{ resultNote }}
        </p>
      </div>
    </header>
    <div class="space-y-6 border-t border-stone-900/5 px-5 pb-6 pt-5 sm:px-7">
      <slot />
    </div>
  </article>
</template>
