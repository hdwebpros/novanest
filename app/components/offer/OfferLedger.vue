<script setup lang="ts">
export interface LedgerLine {
  label: string;
  amount: number;
  hint?: string | null;
  sign?: "+" | "-" | null;
}

defineProps<{
  lines: LedgerLine[];
  total?: { label: string; amount: number; hint?: string | null };
  heading?: string;
}>();
</script>

<template>
  <div>
    <p
      v-if="heading"
      class="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-gray"
    >
      {{ heading }}
    </p>
    <ul class="divide-y divide-stone-900/5">
      <li
        v-for="line in lines"
        :key="line.label"
        class="flex items-baseline justify-between gap-4 py-2.5"
      >
        <div class="min-w-0">
          <p class="text-sm text-stone-900">{{ line.label }}</p>
          <p v-if="line.hint" class="mt-0.5 text-xs leading-snug text-brand-gray">
            {{ line.hint }}
          </p>
        </div>
        <p class="shrink-0 text-sm tabular-nums text-stone-900">
          <span v-if="line.sign === '-'" class="text-brand-gray">−&nbsp;</span>
          <span v-else-if="line.sign === '+'" class="text-brand-gray">+&nbsp;</span>{{ formatMoney(line.amount) }}
        </p>
      </li>
    </ul>
    <div
      v-if="total"
      class="mt-1 flex items-baseline justify-between gap-4 border-t-2 border-stone-900/80 pt-3"
    >
      <div class="min-w-0">
        <p class="text-sm font-semibold text-stone-900">{{ total.label }}</p>
        <p v-if="total.hint" class="mt-0.5 text-xs text-brand-gray">{{ total.hint }}</p>
      </div>
      <p class="shrink-0 text-base font-semibold tabular-nums text-stone-900">
        {{ formatMoney(total.amount) }}
      </p>
    </div>
  </div>
</template>
