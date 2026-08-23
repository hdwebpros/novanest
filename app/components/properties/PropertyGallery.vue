<script setup lang="ts">
import type { MediaFile } from "~/types/property";
import type { UnwrapRefCarouselApi } from "~/components/ui/carousel/interface";

const props = defineProps<{
  media: MediaFile[];
}>();

const images = computed(() =>
  props.media.filter((m) => m.type === "image")
);

const mainApi = ref<UnwrapRefCarouselApi>();
const lightboxApi = ref<UnwrapRefCarouselApi>();
const currentIndex = ref(0);
const lightboxOpen = ref(false);

function onMainInit(api: UnwrapRefCarouselApi) {
  if (!api) return;
  mainApi.value = api;
  api.on("select", () => {
    currentIndex.value = api!.selectedScrollSnap();
  });
}

const lightboxIndex = ref(0);

function onLightboxInit(api: UnwrapRefCarouselApi) {
  if (!api) return;
  lightboxApi.value = api;
  api.on("select", () => {
    lightboxIndex.value = api!.selectedScrollSnap();
  });
}

function goToSlide(index: number) {
  mainApi.value?.scrollTo(index);
  currentIndex.value = index;
}

function openLightbox(index?: number) {
  lightboxOpen.value = true;
  nextTick(() => {
    if (index !== undefined) {
      lightboxApi.value?.scrollTo(index);
    } else {
      lightboxApi.value?.scrollTo(currentIndex.value);
    }
  });
}
</script>

<template>
  <div v-if="images.length > 0" class="space-y-2">
    <!-- Main image -->
    <Carousel class="w-full" @init-api="onMainInit">
      <CarouselContent>
        <CarouselItem v-for="(image, index) in images" :key="image.id">
          <button
            class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 cursor-pointer block"
            @click="openLightbox(index)"
          >
            <img
              :src="`/api/properties/media/${image.id}?w=1200&o=1`"
              :alt="image.name"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :fetchpriority="index === 0 ? 'high' : undefined"
              class="w-full h-full object-cover"
            />
            <!-- Photo count overlay -->
            <div
              class="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
            >
              <Icon name="lucide:camera" class="w-3.5 h-3.5" />
              {{ currentIndex + 1 }} / {{ images.length }}
            </div>
          </button>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious
        v-if="images.length > 1"
        class="left-3 bg-white/80 hover:bg-white border-0 shadow-md"
      />
      <CarouselNext
        v-if="images.length > 1"
        class="right-3 bg-white/80 hover:bg-white border-0 shadow-md"
      />
    </Carousel>

    <!-- Thumbnails -->
    <div
      v-if="images.length > 1"
      class="flex gap-2 overflow-x-auto pb-1"
    >
      <button
        v-for="(image, index) in images"
        :key="image.id"
        class="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors"
        :class="
          index === currentIndex
            ? 'border-pink-600'
            : 'border-transparent hover:border-pink-300'
        "
        @click="goToSlide(index)"
      >
        <img
          :src="`/api/properties/media/${image.id}?w=160&o=1`"
          :alt="image.name"
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </button>
      <!-- View all button -->
      <button
        class="flex-shrink-0 w-16 h-12 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center text-xs font-medium text-brand-gray"
        @click="openLightbox(0)"
      >
        All
      </button>
    </div>

    <!-- Lightbox Dialog -->
    <Dialog v-model:open="lightboxOpen">
      <DialogContent
        class="!max-w-5xl !w-[95vw] !h-[90vh] !p-0 bg-stone-950 border-stone-800 flex flex-col"
      >
        <DialogTitle class="sr-only">Property Photos</DialogTitle>

        <!-- Counter -->
        <div class="absolute top-4 left-4 z-10 bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-lg">
          {{ lightboxIndex + 1 }} / {{ images.length }}
        </div>

        <!-- Lightbox carousel -->
        <div class="flex-1 flex items-center justify-center min-h-0 p-4 pt-12">
          <Carousel class="w-full h-full" @init-api="onLightboxInit">
            <CarouselContent class="h-full">
              <CarouselItem
                v-for="(image, index) in images"
                :key="image.id"
                class="flex items-center justify-center h-full"
              >
                <img
                  :src="`/api/properties/media/${image.id}?w=1200&o=1`"
                  :alt="image.name"
                  :loading="index === 0 ? 'eager' : 'lazy'"
                  class="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded-lg"
                />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious
              v-if="images.length > 1"
              class="left-2 bg-white/10 hover:bg-white/20 border-0 text-white"
            />
            <CarouselNext
              v-if="images.length > 1"
              class="right-2 bg-white/10 hover:bg-white/20 border-0 text-white"
            />
          </Carousel>
        </div>

        <!-- Lightbox thumbnails -->
        <div
          v-if="images.length > 1"
          class="flex gap-2 px-4 pb-4 overflow-x-auto justify-center"
        >
          <button
            v-for="(image, index) in images"
            :key="image.id"
            class="flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-colors"
            :class="
              index === lightboxIndex
                ? 'border-pink-500'
                : 'border-transparent hover:border-white/40'
            "
            @click="lightboxApi?.scrollTo(index)"
          >
            <img
              :src="`/api/properties/media/${image.id}?w=160&o=1`"
              :alt="image.name"
              loading="lazy"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
