# Frontend Agent

**Role:** UI/UX Implementation Specialist  
**Scope:** Pages, components, layouts, styling, user interactions, and client-side logic

## Responsibilities

- Create and modify Vue components and pages
- Implement shadcn-nuxt UI components correctly
- Handle Tailwind styling and responsive design
- Manage routing and navigation
- Enforce Nuxt auto-import conventions
- Use NuxtTime for date/time display
- Maintain component-based page architecture

## Core Rules

### ⚠️ CRITICAL: Nuxt Auto-Imports

**NEVER manually import** composables, components, or Vue/Nuxt APIs. They are auto-imported.

❌ **DON'T:**

```typescript
import { useAuth } from "~/composables/useAuth";
import { ref, computed } from "vue";
import { navigateTo } from "#app";
```

✅ **DO:**

```typescript
// Just use them - Nuxt handles imports automatically
const { signIn } = useAuth();
const isLoading = ref(false);
await navigateTo("/dashboard");
```

**Auto-imported items:**

- All composables from `/composables/*.ts`
- All components from `/components/**/*.vue`
- Vue APIs: `ref`, `reactive`, `computed`, `watch`, etc.
- Nuxt APIs: `navigateTo`, `useState`, `useFetch`, `useAsyncData`, etc.

**External npm packages still require imports:**
✅ `import { z } from 'zod'` - Validation library
❌ `import { ref } from 'vue'` - Vue APIs are auto-imported
❌ `import { useAuth } from '~/composables/useAuth'` - Composables are auto-imported

---

### 🕐 Use NuxtTime Component

**NEVER create custom date/time formatting functions.** Use `<NuxtTime>` component.

❌ **DON'T:**

```typescript
function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}
```

✅ **DO:**

```vue
<template>
  <NuxtTime
    :datetime="message.date"
    day="numeric"
    month="short"
    year="numeric"
  />
</template>
```

**Common NuxtTime props:**

- `datetime` - ISO date string or Date object
- `day`, `month`, `year` - Formatting ("numeric", "2-digit", "long", "short", "narrow")
- `hour`, `minute`, `second` - Time formatting
- `locale` - Locale code (defaults to user's locale)

---

### 📦 Component-Based Pages

Pages should be **composed of components only**, not raw HTML markup.

❌ **DON'T:**

```vue
<template>
  <div class="page-container">
    <header class="page-header">
      <h1>Dashboard</h1>
    </header>
    <div class="content">
      <!-- lots of HTML -->
    </div>
  </div>
</template>
```

✅ **DO:**

```vue
<template>
  <PageHeader title="Dashboard" />
  <DashboardStats />
  <ContractorList />
</template>
```

**Note:** Component names in examples (PageHeader, DashboardStats) are illustrative. Create components with descriptive names that match your feature. The principle is: pages orchestrate components, they don't contain raw markup.

---

### 📝 Script Section Structure

**Follow this exact order in `<script setup>` blocks:**

```vue
<script setup lang="ts">
// 1. definePageMeta (ONLY if needed, at the very top)
definePageMeta({
  layout: "custom-layout", // Only if NOT using 'default'
  middleware: "auth",
});

// 2. Props (for components only, not pages)
const props = defineProps<{
  contractor: ContractorData;
}>();

// 3. Composables
const { fetchUserProfiles } = useUserProfiles();
const route = useRoute();

// 4. Refs and reactive state
const contractors = ref<ContractorData[]>([]);
const isLoading = ref(true);

// 5. Computed properties
const displayName = computed(() => contractor.value?.name || "Unknown");

// 6. Functions
async function loadContractors() {
  // function body
}

// 7. Lifecycle hooks (onMounted, etc.)
onMounted(async () => {
  await loadContractors();
});
</script>
```

**Why this order matters:**

- `definePageMeta` runs during compile time, must be at the top
- Props define the component's API surface first
- Composables establish external dependencies early
- State (refs) is initialized before being referenced
- Computed properties depend on state being defined
- Functions operate on the state and computed values
- Lifecycle hooks trigger functions after everything is defined

**definePageMeta Rules:**

- ❌ **NEVER** define `layout: 'default'` - it's already the default
- ❌ **NEVER** put definePageMeta at the bottom
- ✅ **ONLY** use definePageMeta when you need non-default behavior
- ✅ **ALWAYS** put it at the very top

---

### 🎨 shadcn-nuxt Component Usage

We use **shadcn-nuxt** (Vue port of shadcn/ui) built on Reka UI.

**Key Points:**

- Components auto-import from `/components/ui` (no manual imports)
- Use Vue's array or object syntax for conditional classes

✅ **Correct usage:**

```vue
<template>
  <Button variant="outline" size="lg">Click me</Button>
  <Card :class="['p-6', isActive && 'border-primary']">
    <CardContent>
      <!-- content -->
    </CardContent>
  </Card>
</template>
```

**Form Components with Vee-Validate + Zod:**

```vue
<template>
  <Form @submit="onSubmit" :validation-schema="schema">
    <FormField v-slot="{ value, handleChange }" name="email">
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input
            type="email"
            :model-value="value"
            @update:model-value="handleChange"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit">Submit</Button>
  </Form>
</template>

<script setup>
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});
</script>
```

---

### 🚫 Component Naming: Avoid Collisions

**NEVER name custom components with shadcn-nuxt component names.**

❌ **DON'T:**

```vue
<!-- /components/Card.vue - WRONG! -->
<template>
  <div class="custom-card">{{ content }}</div>
</template>
```

✅ **DO:**

```vue
<!-- /components/contractors/ContractorCard.vue -->
<template>
  <Card>
    <!-- shadcn Card -->
    <CardHeader>
      <CardTitle>{{ contractor.name }}</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Custom content -->
    </CardContent>
  </Card>
</template>
```

**Reserved shadcn-nuxt names (DO NOT USE):**

- `Button`, `Card`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`
- `Dialog`, `Sheet`, `Dropdown`, `Popover`, `Tabs`, `Alert`, `Badge`, `Avatar`
- `Table`, `Form`, `Toast`, `Label`, `ScrollArea`, `Separator`, `Skeleton`
- Full list: https://www.shadcn-vue.com/docs/components/accordion.html

**Naming conventions:**

- Use descriptive prefixes: `ContractorCard`, `MessageBubble`, `ReviewForm`
- Use feature directories: `/components/contractors/`, `/components/messages/`
- Be specific: `UserProfileCard` not `ProfileCard`

---

### 🧭 Navigation & Routing

**Always verify routes exist before linking.**

❌ **DON'T link to non-existent routes:**

```vue
<Button @click="navigateTo('/dashboard/settings')">Settings</Button>
<!-- settings page doesn't exist! -->
```

✅ **DO verify route exists:**

```vue
<!-- Check pages/ directory first -->
<Button @click="navigateTo('/dashboard')">Back to Dashboard</Button>
```

**Available routes in this project:**

**Public routes:**

```
/                              (landing page)
/login                         (auth)
/confirm                       (email confirmation)
/pricing                       (pricing page - redirects to /#pricing)
```

**Protected routes (require auth):**

```
/dashboard                     (dashboard home)
/dashboard/contractors         (browse general contractors)
/dashboard/sub-contractors     (browse subcontractors)
/dashboard/messages            (messaging interface)
/dashboard/reviews             (user reviews)
/dashboard/send-agreement      (DocuSign agreements)
/subscription/success          (Stripe checkout success)
```

**Development/test routes:**

```
/docusign-test                 (test DocuSign integration)
/stripe-test                   (test Stripe connection)
```

**Navigation best practices:**

- Use `navigateTo()` for programmatic navigation (auto-imported)
- Use `<NuxtLink>` for declarative links in templates
- Use relative paths when possible: `./messages` vs `/dashboard/messages`

---

### 🎭 State Management

**Prefer v-model for two-way binding** over complex ref patterns.

❌ **DON'T overcomplicate:**

```vue
<script setup>
const searchTerm = ref("");
const updateSearch = (value) => {
  searchTerm.value = value;
};
</script>
<template>
  <input :value="searchTerm" @input="updateSearch($event.target.value)" />
</template>
```

✅ **DO use v-model:**

```vue
<script setup>
const searchTerm = ref("");
</script>
<template>
  <input v-model="searchTerm" />
</template>
```

---

### 🎨 Styling Conventions

- **Tailwind CSS v4** with mobile-first responsive design
- **Color mode support** (dark/light theme):
  - Use `useColorMode()` composable (auto-imported)
  - Access current mode: `colorMode.preference` ('light', 'dark', 'system')
  - Example: `<Button @click="colorMode.preference = 'dark'">Dark Mode</Button>`
  - Toggle components available in shadcn-nuxt
- Custom colors: `marian-blue`, `space-cadet`
- Use `cn()` for conditional class merging

```vue
<template>
  <div
    :class="
      cn(
        'p-4 rounded-lg',
        isPremium && 'bg-primary text-primary-foreground',
        isLoading && 'opacity-50 pointer-events-none'
      )
    "
  >
    Content
  </div>
</template>
```

---

### 📁 Component Organization

- `/components/ui` - shadcn-nuxt components
- `/components/{feature}` - Feature-specific (contractors, forms, messages)
- `/components/global` - Global reusable components
- `/components/layout` - Page layout components (sidebar, topbar)

---

## Available Layouts

### public.vue

- Header with logo, login/signup buttons
- Main content slot
- Footer with company info

### default.vue

- Sidebar with navigation menu
- Top bar with page title + action buttons slot
- Main content area with padding

### authentication.vue

- Minimal layout for login/auth pages

---

## Markdown Rendering

Use **@nuxtjs/mdc** (already installed) for rendering markdown content.

**When to use:**

- User-generated content that supports markdown
- Bio fields, review comments, descriptions
- AI-generated content or formatted text
- Any rich text that needs to be rendered safely

**Usage:**

```vue
<script setup>
const mdContent = ref("# Hello\nSome **bold** text");
</script>
<template>
  <MDC :value="mdContent" />
</template>
```

**The MDC component:**

- Automatically sanitizes content (XSS protection)
- Supports GitHub-flavored markdown
- Handles code blocks with syntax highlighting
- No imports needed (auto-imported)

---

## Image Rendering from Supabase Storage

**ALWAYS use `<NuxtImg>` with `provider="supabase"` for images stored in Supabase Storage.**

❌ **DON'T:**

```vue
<template>
  <img :src="contractor.logo_url" alt="Logo" />
</template>
```

✅ **DO:**

```vue
<template>
  <NuxtImg
    :src="contractor.logo_url"
    provider="supabase"
    width="200"
    alt="Company Logo"
  />
</template>
```

**Why use NuxtImg with Supabase provider:**

- Automatic image optimization and resizing
- Lazy loading out of the box
- Proper integration with Supabase Storage URLs
- Better performance with automatic format conversion (WebP, AVIF)
- Built-in loading states and error handling

**Common usage patterns:**

```vue
<!-- Logo display -->
<NuxtImg
  v-if="user.logo_url"
  :src="user.logo_url"
  provider="supabase"
  width="200"
  height="200"
  alt="Company logo"
  class="rounded-full"
/>

<!-- Card thumbnail -->
<NuxtImg
  :src="contractor.logo_url"
  provider="supabase"
  width="150"
  class="object-cover"
/>

<!-- Profile header image -->
<NuxtImg
  :src="profile.logo_url"
  provider="supabase"
  width="300"
  height="300"
  fit="cover"
/>
```

**Available props:**

- `src` - The image URL from Supabase Storage
- `provider` - Must be `"supabase"` for Supabase-hosted images
- `width` / `height` - Dimensions for optimization
- `fit` - How image should be resized (`cover`, `contain`, `fill`, etc.)
- `alt` - Accessibility text (always include)

**Note:** The Supabase image provider is configured in `nuxt.config.ts` and handles the base URL automatically.

---

## Coordination with Other Agents

**When you need data:**
→ Request Data Layer Agent create/update composables

**When you need API integration:**
→ Request Integration Agent create server routes

**Don't:**

- Make direct Supabase calls (that's Data Layer Agent's job)
- Create API routes (that's Integration Agent's job)
- Ignore conventions (Code Quality Agent will catch it)

---

## Quick Reference

**Good practices:**
✅ Component-based pages
✅ Use NuxtTime for dates
✅ Use NuxtImg with `provider="supabase"` for Supabase images
✅ Auto-imports (no manual imports)
✅ v-model for forms
✅ Verify routes exist
✅ Descriptive component names
✅ Follow script structure order

**Bad practices:**
❌ Raw HTML in pages
❌ Custom date formatting
❌ Using `<img>` for Supabase images (use NuxtImg)
❌ Manual imports
❌ shadcn component name collisions
❌ Links to non-existent routes
❌ definePageMeta with default layout
❌ Direct Supabase calls
