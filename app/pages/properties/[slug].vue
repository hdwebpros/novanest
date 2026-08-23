<script setup lang="ts">
import { useProperty } from "~/composables/useProperties";
import type { MediaFile } from "~/types/property";
import { formatNumber, formatPrice } from "~/utils/formatters";

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const { data, status, error, refresh } = useProperty(slug.value);

const property = computed(() => data.value?.property);
const media = computed(() => data.value?.media ?? []);
const description = computed(() => data.value?.description ?? "");

const images = computed(() =>
  media.value.filter((m: MediaFile) => m.type === "image"),
);
const videos = computed(() =>
  media.value.filter((m: MediaFile) => m.type === "video"),
);
const documents = computed(() =>
  media.value.filter(
    (m: MediaFile) => m.type === "document" && m.mimeType === "application/pdf",
  ),
);

const showingDialogOpen = ref(false);

const hasDetails = computed(() =>
  !!(property.value?.terms || property.value?.additionalInfo || property.value?.closeDate)
);

const hasDocuments = computed(() => documents.value.length > 0);
const showTabs = computed(() => hasDetails.value || hasDocuments.value);

// SEO
watchEffect(() => {
  if (property.value) {
    useHead({
      title: `${property.value.address}, ${property.value.city} | NovaNest`,
    });
    useSeoMeta({
      title: `${property.value.address}, ${property.value.city}, ${property.value.state} | NovaNest`,
      description: `${property.value.propertyType} in ${property.value.city}, ${property.value.state}. ${property.value.beds} bed, ${property.value.baths} bath, ${formatNumber(property.value.sqft)} sqft. $${formatPrice(property.value.price)}.`,
      ogImage: property.value.featuredImageFileId
        ? `/api/properties/media/${property.value.featuredImageFileId}?w=1200&o=1`
        : undefined,
    });
  }
});
</script>

<template>
  <div class="min-h-screen bg-brand-beige">
    <LayoutPropertiesNav />

    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="max-w-6xl mx-auto px-6 py-12">
      <div class="animate-pulse space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="lg:col-span-3 aspect-[4/3] bg-stone-200 rounded-2xl" />
          <div class="lg:col-span-2 space-y-4">
            <div class="h-6 bg-stone-200 rounded w-1/3" />
            <div class="h-8 bg-stone-200 rounded w-2/3" />
            <div class="h-5 bg-stone-200 rounded w-1/2" />
            <div class="h-10 bg-stone-200 rounded w-1/3" />
            <div class="grid grid-cols-2 gap-3 mt-4">
              <div v-for="i in 4" :key="i" class="h-16 bg-stone-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-6xl mx-auto px-6 py-20 text-center">
      <Icon
        name="lucide:alert-circle"
        class="w-16 h-16 text-pink-600 mx-auto mb-4"
      />
      <h1 class="text-2xl font-heading font-bold text-stone-900 mb-2">
        Property not found
      </h1>
      <p class="text-brand-gray mb-6">
        This property may have been removed or the link may be incorrect.
      </p>
      <div class="flex gap-4 justify-center">
        <button class="btn-gradient" @click="refresh()">Try again</button>
        <NuxtLink to="/properties" class="btn-dark">All Properties</NuxtLink>
      </div>
    </div>

    <!-- Detail -->
    <div
      v-else-if="property"
      class="max-w-6xl mx-auto px-6 md:px-12 py-8 md:py-12"
    >
      <!-- Back link -->
      <NuxtLink
        to="/properties"
        class="inline-flex items-center gap-1 text-sm text-brand-gray hover:text-pink-600 transition-colors mb-6"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        All Properties
      </NuxtLink>

      <!-- Hero: Gallery + Key Info -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mb-10">
        <!-- Gallery (left) -->
        <div class="lg:col-span-3">
          <PropertiesPropertyGallery :media="media" />
        </div>

        <!-- Property info (right) -->
        <div class="lg:col-span-2 flex flex-col">
          <!-- Badges -->
          <div class="flex items-center gap-2 mb-2">
            <Badge
              v-if="property.status !== 'active'"
              :class="
                property.status === 'sold'
                  ? 'bg-stone-900 text-white'
                  : 'bg-yellow-500 text-stone-900'
              "
              class="text-xs uppercase font-semibold"
            >
              {{ property.status }}
            </Badge>
            <Badge
              variant="outline"
              class="text-xs uppercase font-semibold border-pink-600/20 text-pink-600"
            >
              {{ property.propertyType }}
            </Badge>
          </div>

          <!-- Address -->
          <h1
            class="text-2xl md:text-3xl font-heading font-bold text-stone-900"
          >
            {{ property.address }}
          </h1>
          <p class="text-base text-brand-gray mt-0.5">
            {{ property.city }}, {{ property.state }} {{ property.zip }}
          </p>

          <!-- Price -->
          <p
            class="text-2xl md:text-3xl font-heading font-bold text-pink-600 mt-3"
          >
            ${{ formatPrice(property.price) }}
          </p>
          <p
            v-if="property.value && property.value !== property.price"
            class="text-sm text-brand-gray mt-0.5"
          >
            Market Value: ${{ formatPrice(property.value) }}
          </p>

          <!-- Key Stats (2x2 grid) -->
          <div class="grid grid-cols-2 gap-3 mt-5">
            <div v-if="property.beds" class="flex items-center gap-3 p-3 rounded-xl bg-white border border-pink-600/5">
              <div class="flex-shrink-0 w-9 h-9 rounded-full bg-pink-600/10 flex items-center justify-center">
                <Icon name="lucide:bed-double" class="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p class="text-[11px] text-brand-gray uppercase tracking-wide">Beds</p>
                <p class="text-base font-semibold text-stone-900 font-heading leading-tight">{{ property.beds }}</p>
              </div>
            </div>
            <div v-if="property.baths" class="flex items-center gap-3 p-3 rounded-xl bg-white border border-pink-600/5">
              <div class="flex-shrink-0 w-9 h-9 rounded-full bg-pink-600/10 flex items-center justify-center">
                <Icon name="lucide:bath" class="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p class="text-[11px] text-brand-gray uppercase tracking-wide">Baths</p>
                <p class="text-base font-semibold text-stone-900 font-heading leading-tight">{{ property.baths }}</p>
              </div>
            </div>
            <div v-if="property.sqft" class="flex items-center gap-3 p-3 rounded-xl bg-white border border-pink-600/5">
              <div class="flex-shrink-0 w-9 h-9 rounded-full bg-pink-600/10 flex items-center justify-center">
                <Icon name="lucide:ruler" class="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p class="text-[11px] text-brand-gray uppercase tracking-wide">Sqft</p>
                <p class="text-base font-semibold text-stone-900 font-heading leading-tight">{{ formatNumber(property.sqft) }}</p>
              </div>
            </div>
            <div v-if="property.acreage" class="flex items-center gap-3 p-3 rounded-xl bg-white border border-pink-600/5">
              <div class="flex-shrink-0 w-9 h-9 rounded-full bg-pink-600/10 flex items-center justify-center">
                <Icon name="lucide:trees" class="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p class="text-[11px] text-brand-gray uppercase tracking-wide">Acreage</p>
                <p class="text-base font-semibold text-stone-900 font-heading leading-tight">{{ property.acreage }}</p>
              </div>
            </div>
            <div v-if="property.closeDate" class="flex items-center gap-3 p-3 rounded-xl bg-white border border-pink-600/5">
              <div class="flex-shrink-0 w-9 h-9 rounded-full bg-pink-600/10 flex items-center justify-center">
                <Icon name="lucide:calendar" class="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p class="text-[11px] text-brand-gray uppercase tracking-wide">Close</p>
                <p class="text-base font-semibold text-stone-900 font-heading leading-tight">{{ property.closeDate }}</p>
              </div>
            </div>
          </div>

          <!-- CTAs -->
          <div class="flex gap-3 mt-auto pt-5">
            <a
              href="tel:6124402899"
              class="btn-gradient inline-flex items-center gap-2 flex-1 justify-center text-sm"
            >
              <Icon name="lucide:phone" class="w-4 h-4" />
              Call
            </a>
            <button
              class="btn-dark inline-flex items-center gap-2 flex-1 justify-center text-sm"
              @click="showingDialogOpen = true"
            >
              <Icon name="lucide:calendar" class="w-4 h-4" />
              Request Showing
            </button>
          </div>
        </div>
      </div>

      <!-- Description (no tabs needed) -->
      <div v-if="!showTabs" class="mb-10">
        <div class="card-base">
          <div
            v-if="description"
            class="property-description"
            v-html="description"
          />
          <p v-else class="text-brand-gray">
            No description available for this property.
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs v-if="showTabs" default-value="description" class="mb-10">
        <TabsList class="bg-white border border-pink-600/10">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger v-if="hasDetails" value="details">Details</TabsTrigger>
          <TabsTrigger v-if="hasDocuments" value="documents">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" class="mt-4">
          <div class="card-base">
            <div
              v-if="description"
              class="property-description"
              v-html="description"
            />
            <p v-else class="text-brand-gray">
              No description available for this property.
            </p>
          </div>
        </TabsContent>

        <TabsContent v-if="hasDetails" value="details" class="mt-4">
          <div class="card-base space-y-4">
            <div v-if="property.terms">
              <p class="text-xs text-brand-gray uppercase tracking-wide mb-1">
                Terms
              </p>
              <p class="text-stone-900">{{ property.terms }}</p>
            </div>
            <Separator v-if="property.terms && property.additionalInfo" />
            <div v-if="property.additionalInfo">
              <p class="text-xs text-brand-gray uppercase tracking-wide mb-1">
                Additional Information
              </p>
              <p class="text-stone-900">{{ property.additionalInfo }}</p>
            </div>
            <Separator v-if="property.closeDate" />
            <div v-if="property.closeDate">
              <p class="text-xs text-brand-gray uppercase tracking-wide mb-1">
                Estimated Close Date
              </p>
              <p class="text-stone-900">{{ property.closeDate }}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent v-if="hasDocuments" value="documents" class="mt-4">
          <div class="card-base space-y-3">
            <a
              v-for="doc in documents"
              :key="doc.id"
              :href="`/api/properties/media/${doc.id}`"
              target="_blank"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-600/5 transition-colors"
            >
              <Icon name="lucide:file-text" class="w-5 h-5 text-pink-600" />
              <span class="text-stone-900">{{ doc.name }}</span>
              <Badge variant="outline" class="text-[10px] uppercase border-stone-300 text-brand-gray ml-1">
                PDF
              </Badge>
              <Icon
                name="lucide:download"
                class="w-4 h-4 text-brand-gray ml-auto"
              />
            </a>
          </div>
        </TabsContent>
      </Tabs>

      <!-- Videos -->
      <div v-if="videos.length > 0" class="mb-10">
        <h2 class="text-2xl font-heading font-bold text-stone-900 mb-4">
          Video Tour
        </h2>
        <div class="space-y-4">
          <div
            v-for="video in videos"
            :key="video.id"
            class="rounded-2xl overflow-hidden bg-stone-900"
          >
            <AspectRatio :ratio="16 / 9">
              <video
                :src="`/api/properties/media/${video.id}`"
                controls
                preload="metadata"
                class="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </AspectRatio>
          </div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="card-base text-center py-10">
        <h2 class="text-2xl font-heading font-bold text-stone-900 mb-2">
          Interested in this property?
        </h2>
        <p class="text-brand-gray mb-6">
          Get in touch and we'll help you with the next steps.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <a
            href="tel:6124402899"
            class="btn-gradient inline-flex items-center gap-2"
          >
            <Icon name="lucide:phone" class="w-4 h-4" />
            Call (612) 440-2899
          </a>
          <button
            class="btn-dark inline-flex items-center gap-2"
            @click="showingDialogOpen = true"
          >
            <Icon name="lucide:calendar" class="w-4 h-4" />
            Request Showing
          </button>
        </div>
      </div>
    </div>

    <LayoutFooter />

    <!-- Sticky mobile CTA bar -->
    <div
      v-if="property"
      class="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-stone-200 p-3 flex gap-3 lg:hidden"
    >
      <a
        href="tel:6124402899"
        class="btn-gradient inline-flex items-center gap-2 flex-1 justify-center text-sm"
      >
        <Icon name="lucide:phone" class="w-4 h-4" />
        Call
      </a>
      <button
        class="btn-dark inline-flex items-center gap-2 flex-1 justify-center text-sm"
        @click="showingDialogOpen = true"
      >
        <Icon name="lucide:calendar" class="w-4 h-4" />
        Request Showing
      </button>
    </div>

    <!-- Showing Request Dialog -->
    <Dialog v-model:open="showingDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-heading">Request a Showing</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll get back to you to schedule a
            viewing of {{ property?.address }}.
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="showingDialogOpen = false">
          <div>
            <Label for="showing-name">Name</Label>
            <Input id="showing-name" placeholder="Your full name" required />
          </div>
          <div>
            <Label for="showing-email">Email</Label>
            <Input
              id="showing-email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label for="showing-phone">Phone</Label>
            <Input id="showing-phone" type="tel" placeholder="(555) 555-5555" />
          </div>
          <div>
            <Label for="showing-message">Message</Label>
            <Textarea
              id="showing-message"
              placeholder="Any questions or preferred times?"
              rows="3"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="btn-dark"
              @click="showingDialogOpen = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn-gradient">Send Request</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.property-description :deep(h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-family: var(--font-heading);
}
.property-description :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
}
.property-description :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
}
.property-description :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.7;
}
.property-description :deep(ul),
.property-description :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}
.property-description :deep(ul) {
  list-style-type: disc;
}
.property-description :deep(ol) {
  list-style-type: decimal;
}
.property-description :deep(li) {
  margin-bottom: 0.25rem;
}
.property-description :deep(a) {
  color: var(--color-pink-600);
  text-decoration: underline;
}
.property-description :deep(strong) {
  font-weight: 700;
}
.property-description :deep(blockquote) {
  border-left: 3px solid var(--color-pink-600);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--color-brand-gray);
}
</style>
