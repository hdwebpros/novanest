import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/fonts", "shadcn-nuxt", "@nuxt/scripts", "@nuxt/image", "@nuxt/icon"],
  css: ["./app/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
});