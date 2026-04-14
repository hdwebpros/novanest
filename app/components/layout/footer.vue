<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>
<template>
  <footer class="bg-brand-gray px-8 py-4">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <p>&copy; {{ currentYear }} NovaNest. Registered LLC in Minnesota.</p>
      <p><a href="mailto:emily@novanest.homes">emily@novanest.homes</a></p>
    </div>
  </footer>
</template>
