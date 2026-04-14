<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  value: string;
}>();
</script>

<template>
  <div class="card-base flex items-center gap-4">
    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-pink-600/10 flex items-center justify-center">
      <Icon :name="icon" class="w-5 h-5 text-pink-600" />
    </div>
    <div>
      <p class="text-xs text-brand-gray uppercase tracking-wide">{{ label }}</p>
      <p class="text-lg font-semibold text-stone-900 font-heading">{{ value }}</p>
    </div>
  </div>
</template>
