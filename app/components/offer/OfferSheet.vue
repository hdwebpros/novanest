<script setup lang="ts">
import type { OfferView } from "#shared/types/offer";
import type { LedgerLine } from "./OfferLedger.vue";

const props = defineProps<{ offer: OfferView }>();

const o = computed(() => props.offer);
const p = computed(() => props.offer.property);

const TYPE_LABELS: Record<string, string> = {
  single_family: "House",
  duplex: "Duplex",
  triplex: "Triplex",
  fourplex: "Fourplex",
  townhome: "Townhome",
  townhouse: "Townhome",
  condo: "Condo",
  multi_family: "Multi-unit building",
  multi_unit: "Multi-unit building",
};
const typeLabel = (t: string) =>
  TYPE_LABELS[t] ?? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const cityLine = computed(() =>
  [p.value.city, [p.value.state, p.value.postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", "),
);

const facts = computed(() => {
  const f: string[] = [];
  if (p.value.units > 1) f.push(`${typeLabel(p.value.propertyType)}, ${p.value.units} units`);
  f.push(plural(p.value.beds, "bed"), plural(p.value.baths, "bath"));
  f.push(`${formatNumber(p.value.totalFinishedSqft)} sq ft`);
  if (p.value.yearBuilt) f.push(`Built ${p.value.yearBuilt}`);
  return f;
});

const months = (n: number) => plural(n, "month");
const ll = computed(() => o.value.landlord);
const m = computed(() => o.value.landlord.monthly);
const multi = computed(() => m.value.units > 1);

const landlordUpFront = computed<LedgerLine[]>(() => [
  {
    label: "Down payment",
    hint: `They borrow the rest of the ${formatMoney(ll.value.purchasePrice)} price`,
    amount: ll.value.downPayment,
  },
  { label: "Closing costs", amount: ll.value.closingCosts },
  { label: "Repairs", amount: ll.value.rehab },
  {
    label: `Bills while it's being fixed (${months(ll.value.holdingMonths)})`,
    hint: "Loan payments, taxes, insurance, sewer and trash",
    amount: ll.value.holdingCosts,
  },
]);

const landlordMonthly = computed<LedgerLine[]>(() => [
  {
    label: "Rent coming in",
    hint: multi.value
      ? `${m.value.units} units × ${formatMoney(m.value.rentPerUnit)} a month`
      : null,
    amount: m.value.grossRent,
    sign: "+",
  },
  { label: "Set aside for months it sits empty", amount: m.value.vacancy, sign: "-" },
  { label: "Property manager", amount: m.value.propertyMgmt, sign: "-" },
  { label: "Upkeep and big repairs down the road", amount: m.value.maintenanceCapex, sign: "-" },
  {
    label: "Loan payment",
    hint: `${(ll.value.interestRate * 100).toFixed(2).replace(/\.?0+$/, "")}% interest, ${ll.value.loanTermYears} years`,
    amount: m.value.mortgage,
    sign: "-",
  },
  { label: "Property taxes", amount: m.value.taxes, sign: "-" },
  { label: "Insurance", amount: m.value.insurance, sign: "-" },
  { label: "Sewer and trash", amount: m.value.sewerTrash, sign: "-" },
]);

const fl = computed(() => o.value.flipper);
const flipperIn = computed<LedgerLine[]>(() => [
  { label: "Buys it for our offer price", amount: fl.value.purchasePrice },
  { label: "Closing costs", amount: fl.value.closingCosts },
  { label: "Repairs", amount: fl.value.rehab },
  {
    label: `Bills while it's being fixed (${months(fl.value.holdingMonths)})`,
    hint: "Taxes, insurance, sewer and trash",
    amount: fl.value.holdingCosts,
  },
]);

const rt = computed(() => o.value.retail);
const retailLines = computed<LedgerLine[]>(() => [
  { label: "Sells fixed up for", amount: rt.value.salePrice, sign: "+" },
  { label: "Repairs you pay for first", amount: rt.value.repairs, sign: "-" },
  {
    label: `Bills while it's fixed and listed (${months(rt.value.holdingMonths)})`,
    hint: "Taxes, insurance, sewer and trash",
    amount: rt.value.holdingCosts,
    sign: "-",
  },
  {
    label: "Selling costs",
    hint: rt.value.sellingCostsBasis ?? "Agent and closing costs",
    amount: rt.value.sellingCosts,
    sign: "-",
  },
]);

const heroPhoto = computed(() => p.value.photos?.[0] ?? null);
const heroFailed = ref(false);
const morePhotos = computed(() => (p.value.photos ?? []).slice(1, 4));

const compPhotos = computed(() => o.value.fixedUpValue.comps.some((c) => c.photoUrl));
const listingPhotos = computed(() => o.value.activeListings.some((l) => l.photoUrl));

const comps = computed(() =>
  [...o.value.fixedUpValue.comps].sort((a, b) => b.soldDate.localeCompare(a.soldDate)),
);
</script>

<template>
  <div class="min-h-screen pb-24 sm:pb-0">
    <!-- Header -->
    <div class="relative isolate overflow-hidden bg-stone-900 text-white">
      <div v-if="heroPhoto && !heroFailed" class="absolute inset-0 -z-10">
        <OfferPhoto :src="heroPhoto" alt="" eager @failed="heroFailed = true" />
        <div
          class="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/40 to-stone-900"
        />
      </div>
      <div class="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-32">
        <OfferBrandBar />
        <div :class="heroPhoto && !heroFailed ? 'mt-40 sm:mt-56' : 'mt-10 sm:mt-14'">
          <p class="text-lg text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]">
            Hi{{ o.sellerFirstName ? ` ${o.sellerFirstName}` : " there" }},
          </p>
          <h1
            class="mt-1 break-words font-heading text-3xl font-bold leading-tight [text-shadow:0_2px_12px_rgb(0_0_0/0.45)] sm:text-4xl"
          >
            {{ p.address }}
          </h1>
          <p v-if="cityLine" class="mt-1 text-white/80">{{ cityLine }}</p>
          <ul class="mt-4 flex flex-wrap gap-2">
            <li
              v-for="fact in facts"
              :key="fact"
              class="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
            >
              {{ fact }}
            </li>
          </ul>
          <ul v-if="morePhotos.length" class="mt-5 flex gap-2">
            <li
              v-for="(src, i) in morePhotos"
              :key="src"
              class="h-14 w-20 overflow-hidden rounded-lg ring-1 ring-white/20 sm:h-16 sm:w-24"
            >
              <a :href="src" target="_blank" rel="noopener noreferrer" :aria-label="`Photo ${i + 2}`">
                <OfferPhoto :src="src" alt="" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <main class="mx-auto -mt-20 max-w-3xl space-y-12 px-4 pb-16 sm:-mt-24">
      <!-- The offer -->
      <section
        class="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-stone-900/10 sm:p-10"
      >
        <div class="gradient-hero absolute inset-x-0 top-0 h-1.5" />
        <p class="text-sm font-semibold uppercase tracking-wider text-pink-600">
          Our suggested offer
        </p>
        <p
          class="mt-2 font-heading text-5xl font-bold tabular-nums tracking-tight text-stone-900 sm:text-7xl"
        >
          {{ formatMoney(o.offer) }}
        </p>
        <p class="mt-4 max-w-xl leading-relaxed text-stone-900/80">
          A cash offer for your home as it is today. You don't have to fix, clean, or
          stage anything.
        </p>
        <ul class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-900">
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:banknote" class="h-4 w-4 text-pink-600" /> Cash
          </li>
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:hammer" class="h-4 w-4 text-pink-600" /> No repairs needed
          </li>
          <li class="flex items-center gap-1.5">
            <Icon name="lucide:sparkles" class="h-4 w-4 text-pink-600" /> No cleaning out
          </li>
        </ul>
        <a
          href="#how"
          class="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-pink-600 hover:underline"
        >
          See how we got this number
          <Icon name="lucide:arrow-down" class="h-4 w-4" />
        </a>
      </section>

      <!-- Intro -->
      <section id="how" class="scroll-mt-6">
        <h2 class="font-heading text-2xl font-bold text-stone-900 sm:text-3xl">
          How we got this number
        </h2>
        <p class="mt-3 leading-relaxed text-stone-900/80">
          Anyone who buys a house that needs work has to pay for the repairs, cover the bills
          while the work gets done, and still come out ahead. Here's what that looks like for
          your home, step by step.
        </p>
      </section>

      <!-- 1. Fixed-up value -->
      <section class="space-y-5">
        <div class="flex gap-3">
          <span class="step">1</span>
          <div class="min-w-0">
            <h2 class="font-heading text-xl font-bold text-stone-900 sm:text-2xl">
              What homes like yours sell for fixed up
            </h2>
            <p class="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-stone-900">
              {{ formatMoney(o.fixedUpValue.value) }}
            </p>
          </div>
        </div>
        <p class="leading-relaxed text-stone-900/80">
          Similar homes nearby that were in good shape sold for about
          <strong class="font-semibold text-stone-900">{{ formatMoney(o.fixedUpValue.avgPricePerSqft) }} per square foot</strong>.
          Your home has {{ formatNumber(p.totalFinishedSqft) }} finished square feet, so
          {{ formatMoney(o.fixedUpValue.avgPricePerSqft) }} × {{ formatNumber(p.totalFinishedSqft) }}
          ≈ {{ formatMoney(o.fixedUpValue.value) }}.
        </p>
        <div class="rounded-3xl border border-pink-600/10 bg-white p-2 shadow-sm">
          <p class="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-brand-gray">
            Recent sales nearby
          </p>
          <ul class="divide-y divide-stone-900/5">
            <li v-for="c in comps" :key="c.url + c.address" class="flex gap-3 px-3 py-3">
              <a
                v-if="compPhotos"
                :href="c.url"
                target="_blank"
                rel="noopener noreferrer"
                tabindex="-1"
                aria-hidden="true"
                class="h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-24"
              >
                <OfferPhoto :src="c.photoUrl" />
              </a>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <a
                    :href="c.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group min-w-0 break-words text-sm font-medium text-stone-900 hover:text-pink-600"
                  >
                    {{ c.address }}
                    <Icon
                      name="lucide:external-link"
                      class="ml-0.5 inline h-3.5 w-3.5 align-[-2px] text-brand-gray group-hover:text-pink-600"
                    />
                  </a>
                  <p class="shrink-0 text-sm font-semibold tabular-nums text-stone-900">
                    {{ formatMoney(c.soldPrice) }}
                  </p>
                </div>
                <p class="mt-1 text-xs leading-relaxed text-brand-gray">
                  Sold {{ formatDate(c.soldDate) }} · {{ c.beds }} bd / {{ c.baths }} ba ·
                  {{ formatNumber(c.totalFinishedSqft) }} sq ft ·
                  <span class="font-medium text-stone-900/80">{{ formatMoney(c.pricePerSqft) }}/sq ft</span>
                  · {{ c.distanceMi }} mi away
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- 2. Repairs -->
      <section class="space-y-5">
        <div class="flex gap-3">
          <span class="step">2</span>
          <div class="min-w-0">
            <h2 class="font-heading text-xl font-bold text-stone-900 sm:text-2xl">
              Repairs to get it there
            </h2>
            <p class="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-stone-900">
              about {{ formatMoney(o.repairs.total) }}
            </p>
          </div>
        </div>
        <div class="rounded-3xl border border-pink-600/10 bg-white p-5 shadow-sm sm:p-6">
          <p v-if="o.repairs.knownIssues.length" class="text-sm font-medium text-stone-900">
            What we know so far
          </p>
          <p v-else-if="o.repairs.summary" class="leading-relaxed text-stone-900/80">
            {{ o.repairs.summary }}
          </p>
          <ul v-if="o.repairs.knownIssues.length" class="mt-3 flex flex-wrap gap-2">
            <li
              v-for="issue in o.repairs.knownIssues"
              :key="issue"
              class="rounded-full bg-brand-ivory px-3 py-1 text-sm text-stone-900"
            >
              {{ issue }}
            </li>
          </ul>
          <div
            class="flex gap-3 rounded-2xl bg-brand-beige/60 p-4 text-sm leading-relaxed text-stone-900/80"
            :class="{ 'mt-5': o.repairs.summary || o.repairs.knownIssues.length }"
          >
            <Icon name="lucide:info" class="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
            <p>
              <template v-if="o.repairs.perSqft">
                This is a rough estimate of about {{ formatMoney(o.repairs.perSqft) }} per square
                foot for the {{ formatNumber(o.repairs.sqft) }} finished square feet above ground.
              </template>
              <template v-else>This is a rough estimate.</template>
              The real number depends on the home's condition and is subject to inspection.
            </p>
          </div>
        </div>
      </section>

      <!-- 3. Three ways -->
      <section class="space-y-5">
        <div class="flex gap-3">
          <span class="step">3</span>
          <div class="min-w-0">
            <h2 class="font-heading text-xl font-bold text-stone-900 sm:text-2xl">
              Three ways this house can go
            </h2>
            <p class="mt-1 leading-relaxed text-stone-900/80">
              Here's what each kind of buyer would spend, and what they'd have left.
            </p>
          </div>
        </div>

        <nav class="flex flex-wrap gap-2 text-sm">
          <a href="#landlord" class="chip">Landlord</a>
          <a href="#flipper" class="chip">House flipper</a>
          <a href="#yourself" class="chip">Fix it up yourself</a>
        </nav>

        <!-- Landlord -->
        <OfferScenario
          id="landlord"
          icon="lucide:key-round"
          title="If a landlord buys it"
          lead="A landlord would buy at our offer price with a loan, fix it up, and rent it out."
          result-label="Left over each month"
          :result="formatMoney(m.cashflow)"
          :result-note="
            (multi ? `${formatMoney(ll.cashflowPerUnit)} per unit. ` : '') +
            (ll.meetsTarget ? 'Enough for most landlords.' : 'Less than most landlords look for.')
          "
          :result-tone="ll.meetsTarget ? 'good' : 'warn'"
        >
          <OfferLedger
            heading="Cash they need up front"
            :lines="landlordUpFront"
            :total="{ label: 'Total up front', amount: ll.cashNeeded }"
          />
          <OfferLedger
            heading="Every month"
            :lines="landlordMonthly"
            :total="{ label: 'Left over each month', amount: m.cashflow }"
          />
          <div
            class="flex gap-3 rounded-2xl p-4 text-sm leading-relaxed"
            :class="ll.meetsTarget ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'"
          >
            <Icon
              :name="ll.meetsTarget ? 'lucide:circle-check' : 'lucide:circle-alert'"
              class="mt-0.5 h-4 w-4 shrink-0"
              :class="ll.meetsTarget ? 'text-emerald-600' : 'text-amber-600'"
            />
            <p>
              Landlords usually need about {{ formatMoney(ll.targetPerUnit) }} a month per unit
              left over to make it worth it.
              <strong class="font-semibold">
                <template v-if="ll.meetsTarget">
                  This one clears that{{ multi ? ` at ${formatMoney(ll.cashflowPerUnit)} per unit` : "" }}.
                </template>
                <template v-else>
                  This one comes in under that{{ multi ? ` at ${formatMoney(ll.cashflowPerUnit)} per unit` : "" }}.
                </template>
              </strong>
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-gray">
              Rents nearby
            </p>
            <ul v-if="ll.rentComps.length" class="mt-2 space-y-1.5">
              <li
                v-for="r in ll.rentComps"
                :key="r.url + r.address"
                class="flex items-baseline justify-between gap-4 text-sm"
              >
                <a
                  :href="r.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-w-0 break-words text-stone-900/80 hover:text-pink-600"
                >
                  {{ r.address }}
                  <span class="text-brand-gray">· {{ r.distanceMi }} mi</span>
                </a>
                <span class="shrink-0 tabular-nums text-stone-900">{{ formatMoney(r.monthlyRent) }}/mo</span>
              </li>
            </ul>
            <p v-else class="mt-2 text-sm text-brand-gray">
              We couldn't find enough rentals nearby to list, so the rent above is our estimate
              for this area.
            </p>
          </div>
        </OfferScenario>

        <!-- Flipper -->
        <OfferScenario
          id="flipper"
          icon="lucide:paint-roller"
          title="If a house flipper buys it"
          lead="A flipper would buy at our offer price, fix it up, and sell it."
          result-label="What's left for them"
          :result="formatMoney(fl.profit)"
        >
          <OfferLedger
            heading="What they pay"
            :lines="flipperIn"
            :total="{ label: 'Total they put in', amount: fl.totalCost }"
          />
          <OfferLedger
            heading="When they sell"
            :lines="[
              { label: 'Sells fixed up for', amount: fl.salePrice, sign: '+' },
              { label: 'Minus what they put in', amount: fl.totalCost, sign: '-' },
            ]"
            :total="{ label: 'What\'s left for them', amount: fl.profit }"
          />
          <p class="text-sm leading-relaxed text-brand-gray">
            That's their pay for months of work and the risk that repairs cost more than
            expected.
          </p>
        </OfferScenario>

        <!-- Yourself -->
        <OfferScenario
          id="yourself"
          icon="lucide:house"
          title="If you fix it up and sell it yourself"
          lead="You pay for the repairs, then list it with an agent."
          result-label="What you'd walk away with"
          :result="formatMoney(rt.netToOwner)"
          :result-note="`After about ${months(rt.holdingMonths)}`"
        >
          <OfferLedger
            :lines="retailLines"
            :total="{ label: 'What you\'d walk away with', amount: rt.netToOwner }"
          />
          <p class="text-sm leading-relaxed text-stone-900/80">
            This can be more money than our offer. The tradeoff is time and hassle: you'd need
            about {{ formatMoney(rt.repairs) }} up front for repairs, manage the work, keep the
            house ready for showings, and wait for a buyer. It's a fair choice, and Emily is happy
            to talk it through either way.
          </p>
        </OfferScenario>
      </section>

      <!-- Active listings -->
      <section v-if="o.activeListings.length" class="space-y-3">
        <h2 class="font-heading text-lg font-bold text-stone-900">For sale nearby right now</h2>
        <p class="text-sm text-brand-gray">
          Asking prices, not sold prices. Just for context.
        </p>
        <ul class="divide-y divide-stone-900/5 rounded-2xl border border-pink-600/10 bg-white/60 px-4">
          <li
            v-for="l in o.activeListings"
            :key="l.url + l.address"
            class="flex items-center gap-3 py-3 text-sm"
          >
            <div v-if="listingPhotos" class="h-12 w-14 shrink-0 overflow-hidden rounded-lg">
              <OfferPhoto :src="l.photoUrl" />
            </div>
            <div class="min-w-0 flex-1">
              <a
                :href="l.url"
                target="_blank"
                rel="noopener noreferrer"
                class="break-words text-stone-900 hover:text-pink-600"
              >{{ l.address }}</a>
              <p class="mt-0.5 text-xs text-brand-gray">
                {{
                  [
                    l.beds != null && l.baths != null ? `${l.beds} bd / ${l.baths} ba` : null,
                    l.totalFinishedSqft ? `${formatNumber(l.totalFinishedSqft)} sq ft` : null,
                    l.daysOnMarket != null ? `${plural(l.daysOnMarket, 'day')} listed` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                }}
              </p>
            </div>
            <span class="shrink-0 self-start tabular-nums text-stone-900">{{ formatMoney(l.listPrice) }}</span>
          </li>
        </ul>
      </section>

      <OfferContact />

      <!-- Fine print -->
      <footer class="space-y-2 text-xs leading-relaxed text-brand-gray">
        <p>
          {{ o.estimatesNote }} Repair costs are a rough estimate and subject to inspection.
          Numbers are based on research done {{ formatDate(o.researchedAt, "long") }}.
        </p>
        <p>
          This page explains our suggested offer. It is not a purchase agreement. This link
          expires {{ formatDate(o.expiresAt, "long") }}.
        </p>
        <p>&copy; {{ new Date(o.createdAt).getFullYear() }} NovaNest. Registered LLC in Minnesota.</p>
      </footer>
    </main>

    <!-- Sticky phone CTA -->
    <div
      class="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-stone-900/10 bg-white/95 p-3 backdrop-blur sm:hidden"
    >
      <a href="tel:6124402899" class="btn-gradient inline-flex flex-1 items-center justify-center gap-2 py-3">
        <Icon name="lucide:phone" class="h-4 w-4" /> Call Emily
      </a>
      <a
        href="mailto:emily@novanest.homes"
        class="btn-dark inline-flex flex-1 items-center justify-center gap-2 py-3"
      >
        <Icon name="lucide:mail" class="h-4 w-4" /> Email
      </a>
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/css/tailwind.css";

.step {
  @apply mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white;
}
.chip {
  @apply rounded-full border border-stone-900/10 bg-white px-3 py-1.5 font-medium text-stone-900 hover:border-pink-600/40 hover:text-pink-600;
}
</style>
