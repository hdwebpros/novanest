<script setup lang="ts">
// Hotlinked listing photos (Zillow/Redfin) break often. Plain <img>, no referrer,
// and a quiet fallback when the URL is missing or fails, including failures that
// happen before hydration (checked on mount).
const props = defineProps<{ src: string | null | undefined; alt?: string; eager?: boolean }>();
const emit = defineEmits<{ failed: [] }>();

const failed = ref(!props.src);
const img = ref<HTMLImageElement | null>(null);

function onError() {
  failed.value = true;
  emit("failed");
}

onMounted(() => {
  if (failed.value) return emit("failed");
  const el = img.value;
  if (el && el.complete && el.naturalWidth === 0) onError();
});

watch(
  () => props.src,
  (s) => {
    failed.value = !s;
  },
);
</script>

<template>
  <img
    v-if="!failed"
    ref="img"
    :src="src!"
    :alt="alt ?? ''"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    referrerpolicy="no-referrer"
    class="h-full w-full object-cover"
    @error="onError"
  />
  <div
    v-else
    class="flex h-full w-full items-center justify-center bg-brand-ivory text-pink-600/40"
    aria-hidden="true"
  >
    <slot name="fallback">
      <Icon name="lucide:house" class="h-1/3 max-h-8 w-1/3 max-w-8" />
    </slot>
  </div>
</template>
