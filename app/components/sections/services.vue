<script setup lang="ts">
const services = [
  {
    title: "Cash Offer",
    description: "Sell fast for cash—no repairs or agents needed.",
    icon: "lucide:badge-dollar-sign",
  },
  {
    title: "Novation",
    description: "We list and sell your home for top market value.",
    icon: "lucide:chart-no-axes-combined",
  },
  {
    title: "Creative Financing",
    description: "Flexible options when cash or listing won’t work.",
    icon: "lucide:lightbulb",
  },
];
</script>
<template>
  <div
    class="flex max-w-7xl mx-auto px-8 py-24 gap-16 animate-in"
    :ref="(el) => animateOnScroll(el)"
  >
    <div
      v-for="(service, index) in services"
      :key="index"
      class="bg-brand-gray rounded-2xl text-white p-6 relative"
    >
      <div
        class="bg-brand-ivory text-black rounded-lg absolute -top-4 -left-4 h-10 w-10 flex items-center justify-center"
      >
        <Icon :name="service.icon" size="1.5em" class="text-brand-pink" />
      </div>

      <h3 class="text-2xl font-bold">{{ service.title }}</h3>
      <h5>{{ service.description }}</h5>
    </div>
  </div>
</template>
