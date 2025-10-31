<script setup lang="ts">
import { z } from "zod";
import { toast } from "vue-sonner";

// Constants
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const PROPERTY_CONDITIONS = [
  { value: "excellent", label: "Excellent - Move-in ready" },
  { value: "good", label: "Good - Minor repairs needed" },
  { value: "fair", label: "Fair - Some repairs needed" },
  { value: "poor", label: "Poor - Major repairs needed" },
  { value: "needs-demolition", label: "Needs significant work/demolition" },
];

const SELLING_REASONS = [
  { value: "foreclosure", label: "Facing foreclosure" },
  { value: "landlord", label: "Tired of being a landlord" },
  { value: "inherited", label: "Inherited/probate property" },
  { value: "taxes", label: "Back taxes or liens" },
  { value: "relocating", label: "Moving/relocating" },
  { value: "repairs", label: "Too many repairs needed" },
  { value: "quick-sale", label: "Want a quick sale" },
  { value: "other", label: "Other" },
];

const MOVE_TIMELINES = [
  { value: "immediately", label: "Immediately (within 2 weeks)" },
  { value: "1-month", label: "1 month" },
  { value: "2-3-months", label: "2-3 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "flexible", label: "Flexible/Not sure" },
];

// Refs and reactive state
const isOfferDialogOpen = ref(false);

const formData = ref({
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  propertyCondition: "",
  reasonForSelling: "",
  moveTimeline: "",
  desiredOffer: "",
  inquiry: "",
});

const contactFormData = ref({
  name: "",
  contact: "",
  address: "",
  message: "",
});

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Please enter your property address"),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please select your state"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"),
  propertyCondition: z
    .string()
    .min(1, "Please select the condition of your property"),
  reasonForSelling: z.string().min(1, "Please select your reason for selling"),
  moveTimeline: z.string().min(1, "Please select your preferred timeline"),
  desiredOffer: z.string().min(1, "Please enter your desired offer amount"),
  inquiry: z.string().optional(),
});

// Functions
function resetForm() {
  formData.value = {
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    propertyCondition: "",
    reasonForSelling: "",
    moveTimeline: "",
    desiredOffer: "",
    inquiry: "",
  };
}

async function onSubmitOffer() {
  try {
    const validated = formSchema.parse(formData.value);

    const dataToSubmit: Record<string, any> = {
      formType: "offer",
    };

    Object.entries(validated).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        dataToSubmit[key] = value;
      }
    });

    // Submit to endpoint as JSON
    const response = await fetch("api/novanest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      throw new Error("Failed to submit form");
    }

    toast.success("Thank you! We will be in touch with your offer soon.");
    isOfferDialogOpen.value = false;
    resetForm();
  } catch (error) {
    if (error instanceof z.ZodError) {
      toast.error(
        `Please fix the following errors: ${error.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    } else {
      toast.error(
        "An error occurred while submitting your request. Please try again."
      );
      console.error("Submission error:", error);
    }
  }
}

async function onSubmitContact() {
  try {
    // Submit contact form
    const response = await fetch("/api/novanest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...contactFormData.value,
        formType: "contact",
      }),
    });

    if (response.ok) {
      toast.success("Thank you for contacting us! We will get back to you soon.");
      // Reset contact form
      contactFormData.value = {
        name: "",
        contact: "",
        address: "",
        message: "",
      };
    } else {
      throw new Error("Failed to submit form");
    }
  } catch (error) {
    toast.error("An error occurred while submitting your request. Please try again.");
    console.error("Submission error:", error);
  }
}

const features = [
  {
    title: "Quick Cash Offers",
    description: "Sell fast, close faster.",
  },
  {
    title: "As-Is Condition Accepted",
    description: "No repairs, no cleaning.",
  },
  {
    title: "Experienced Team",
    description: "We work directly with local agents and investors.",
  },
  {
    title: "No Hidden Fees",
    description: "No commissions or surprise deductions.",
  },
];

const situations = [
  "Facing foreclosure or behind on payments",
  "Tired of being a landlord",
  "Dealing with inherited or probate property",
  "Owe back taxes or liens",
  "Moving, downsizing, or relocating",
  "House needs too many repairs",
  "Simply want a quick, no-hassle sale",
];

const testimonials = [
  {
    quote:
      '"They helped me sell my home in just 10 days, even though it needed a lot of work. Honest and easy to deal with!"',
    name: "John A.",
    location: "Simi Valley, CA",
    image: "1.png",
  },
  {
    quote:
      '"I was behind on my payments and didn\'t know what to do. NOVANEST walked me through everything."',
    name: "Chris P.",
    location: "Simi Valley, CA",
    image: "2.png",
  },
  {
    quote:
      '"Great experience. Got a fair offer and closed fast without paying a single commission."',
    name: "Katherine M.",
    location: "Simi Valley, CA",
    image: "3.png",
  },
];
</script>
<template>
  <div class="w-full">
    <!-- Hero Section -->
    <section class="relative gradient-hero min-h-screen overflow-hidden">
      <!-- Navigation -->
      <nav
        class="absolute top-0 left-0 right-0 z-10 px-20 py-6 sm:flex space-y-8 justify-between items-center"
      >
        <div class="flex items-center gap-4">
          <NuxtImg src="/logo.svg" />
          <NuxtImg src="/name.svg" />
        </div>
        <div class="flex items-center gap-6">
          <a
            href="#"
            class="text-white text-sm font-semibold uppercase hover:opacity-80"
            >About</a
          >
          <a
            href="#"
            class="text-white text-sm font-semibold uppercase hover:opacity-80"
            >Contact</a
          >
          <button class="btn-dark" @click="isOfferDialogOpen = true">
            Get my offer
          </button>
        </div>
      </nav>

      <!-- Hero Content -->
      <div
        class="container mx-auto px-8 sm:px-20 py-8 sm:py-20 min-h-screen sm:flex justify-between items-center"
      >
        <!-- Left Content -->
        <div class="max-w-2xl pt-48 sm:pt-56 flex flex-col gap-16">
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-4">
              <h1 class="text-white text-6xl leading-tight">
                Sell Your Home Fast
              </h1>

              <!-- Features -->
              <div class="sm:flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <NuxtImg src="check.png" />
                  <span class="text-white text-3xl font-bold">No Fees</span>
                </div>

                <div class="flex items-center gap-2">
                  <NuxtImg src="check.png" />
                  <span class="text-white text-3xl font-bold">No Repairs</span>
                </div>

                <div class="flex items-center gap-2">
                  <NuxtImg src="check.png" />
                  <span class="text-white text-3xl font-bold">No Hassle</span>
                </div>
              </div>
            </div>

            <p class="text-white/80 text-base max-w-xl">
              We help homeowners get quick, fair, and stress-free offers — even
              if your property needs work or is facing foreclosure.
            </p>

            <!-- CTA Buttons -->
            <div class="flex gap-3.5">
              <button class="btn-primary" @click="isOfferDialogOpen = true">
                Get my offer
              </button>
              <button class="btn-secondary">See how it works</button>
            </div>
          </div>

          <p class="text-orange-100/80 text-base">
            Trusted by local homeowners and investors across Minnesota.
          </p>
        </div>

        <!-- Right Image -->
        <div class="hidden sm:block relative w-[560px] h-[749px]">
          <div
            class="absolute -left-1 top-36 w-[514px] h-[650px] bg-orange-100 rounded-2xl -rotate-1"
          />
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=800&fit=crop"
            alt="Modern home"
            class="absolute left-12 top-24 w-[514px] h-[650px] rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>

    <!-- Process Section -->
    <section class="px-20 py-16 bg-white">
      <div class="container mx-auto flex flex-col items-center gap-9">
        <h2 class="text-stone-900 text-5xl">Our Process</h2>

        <div class="md:grid grid-cols-3 gap-6 max-w-6xl space-y-8">
          <!-- Step 1 -->
          <div class="card-base flex flex-col items-center gap-3.5">
            <div class="flex flex-col items-center gap-1.5">
              <span
                class="text-stone-900/60 text-xs font-semibold uppercase tracking-widest"
                >Step 1</span
              >
              <div
                class="w-12 h-12 rounded-full bg-rose-300/20 flex items-center justify-center"
              >
                <svg
                  class="w-7 h-7 text-stone-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-stone-900 text-lg text-center">
              Tell Us About Your Property
            </h3>
            <p class="text-stone-900 text-base text-center">
              Fill out our quick form or call us. We'll review your property
              details — no obligations, no pushy sales talk.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="card-base flex flex-col items-center gap-3.5">
            <div class="flex flex-col items-center gap-1.5">
              <span
                class="text-stone-900/60 text-xs font-semibold uppercase tracking-widest"
                >Step 2</span
              >
              <div
                class="w-12 h-12 rounded-full bg-rose-300/20 flex items-center justify-center"
              >
                <svg
                  class="w-7 h-7 text-stone-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-stone-900 text-lg text-center">Get a Fair Offer</h3>
            <p class="text-stone-900 text-base text-center">
              We'll make you a fast, fair cash or creative offer. You choose the
              option that works best for your situation.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="card-base flex flex-col items-center gap-3.5">
            <div class="flex flex-col items-center gap-1.5">
              <span
                class="text-stone-900/60 text-xs font-semibold uppercase tracking-widest"
                >Step 3</span
              >
              <div
                class="w-12 h-12 rounded-full bg-rose-300/20 flex items-center justify-center"
              >
                <svg
                  class="w-7 h-7 text-stone-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="text-stone-900 text-lg text-center">
              Close On Your Terms
            </h3>
            <p class="text-stone-900 text-base text-center">
              We can close in as little as 7–14 days. No commissions, no
              repairs, no waiting.
            </p>
          </div>
        </div>

        <button class="btn-primary" @click="isOfferDialogOpen = true">
          Get my offer
        </button>
      </div>
    </section>

    <!-- Why Choose Section -->
    <section class="px-8 sm:px-28 py-16 bg-white">
      <div class="container mx-auto md:flex gap-12 items-center space-y-8">
        <!-- Left Content -->
        <div class="flex-1 flex flex-col gap-6">
          <h2 class="text-stone-900 text-5xl max-w-xl">
            Why Homeowners Choose Novanest
          </h2>
          <div class="flex flex-col gap-3.5 text-stone-900/80">
            <p class="max-w-md">
              Because we understand what it's like to feel stuck — and we know
              how to help you move forward fast.
            </p>
            <p class="max-w-md">
              We specialize in helping homeowners facing preforeclosure,
              probate, liens, or life changes.
            </p>
          </div>
        </div>

        <!-- Right Features -->
        <div
          class="flex-1 sm:pl-20 sm:pr-11 sm:py-14 relative flex items-center align-middle justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 568 461"
            fill="none"
            class="hidden md:block absolute h-full z-0"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M34.8262 370.03C44.0997 370.03 51.6172 377.548 51.6172 386.821C51.6172 396.095 44.0997 403.612 34.8262 403.612C25.5527 403.612 18.0352 396.095 18.0352 386.821C18.0352 377.548 25.5527 370.03 34.8262 370.03ZM34.8262 373.762C27.6135 373.762 21.7666 379.609 21.7666 386.821C21.7666 394.034 27.6135 399.881 34.8262 399.881C42.0389 399.881 47.8857 394.034 47.8857 386.821C47.8857 379.609 42.0389 373.762 34.8262 373.762Z"
              fill="#270011"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M34.8262 305.353C44.0996 305.353 51.6171 312.87 51.6172 322.144C51.6172 331.417 44.0997 338.936 34.8262 338.936C25.5527 338.935 18.0352 331.417 18.0352 322.144C18.0353 312.87 25.5528 305.353 34.8262 305.353ZM34.8262 309.084C27.6136 309.084 21.7667 314.931 21.7666 322.144C21.7666 329.356 27.6135 335.204 34.8262 335.204C42.0389 335.204 47.8857 329.356 47.8857 322.144C47.8856 314.931 42.0389 309.084 34.8262 309.084Z"
              fill="#270011"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M34.8262 243.163C44.0997 243.163 51.6172 250.681 51.6172 259.954C51.6171 269.228 44.0997 276.745 34.8262 276.745C25.5527 276.745 18.0352 269.228 18.0352 259.954C18.0352 250.681 25.5527 243.163 34.8262 243.163ZM34.8262 246.895C27.6135 246.895 21.7666 252.741 21.7666 259.954C21.7667 267.167 27.6135 273.014 34.8262 273.014C42.0389 273.014 47.8857 267.167 47.8857 259.954C47.8857 252.741 42.0389 246.895 34.8262 246.895Z"
              fill="#270011"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M34.8262 180.973C44.0996 180.973 51.6169 188.49 51.6172 197.764C51.6172 207.037 44.0997 214.556 34.8262 214.556C25.5527 214.556 18.0352 207.037 18.0352 197.764C18.0354 188.49 25.5528 180.973 34.8262 180.973ZM34.8262 184.704C27.6136 184.704 21.7669 190.551 21.7666 197.764C21.7666 204.976 27.6135 210.824 34.8262 210.824C42.0389 210.824 47.8857 204.976 47.8857 197.764C47.8855 190.551 42.0388 184.704 34.8262 184.704Z"
              fill="#270011"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M34.8262 118.783C44.0997 118.783 51.6171 126.301 51.6172 135.574C51.6172 144.848 44.0997 152.365 34.8262 152.365C25.5527 152.365 18.0352 144.848 18.0352 135.574C18.0352 126.301 25.5527 118.783 34.8262 118.783ZM34.8262 122.515C27.6135 122.515 21.7667 128.362 21.7666 135.574C21.7666 142.787 27.6135 148.634 34.8262 148.634C42.0389 148.634 47.8857 142.787 47.8857 135.574C47.8857 128.361 42.0389 122.515 34.8262 122.515Z"
              fill="#270011"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M35.4482 56.5928C44.7218 56.5928 52.2393 64.1112 52.2393 73.3848C52.2391 82.6582 44.7217 90.1758 35.4482 90.1758C26.1748 90.1758 18.6574 82.6582 18.6572 73.3848C18.6572 64.1112 26.1747 56.5928 35.4482 56.5928ZM35.4482 60.3242C28.2355 60.3242 22.3887 66.172 22.3887 73.3848C22.3888 80.5974 28.2356 86.4443 35.4482 86.4443C42.6609 86.4443 48.5077 80.5974 48.5078 73.3848C48.5078 66.172 42.661 60.3242 35.4482 60.3242Z"
              fill="#270011"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M22.7275 2.85352C21.3831 5.01042 20.8228 6.55115 20.6445 7.99805C20.4631 9.47186 20.6541 11.0119 21.0996 13.2705C21.6446 15.4333 22.2675 16.8795 23.3818 18.1875C24.5165 19.5194 26.271 20.8364 29.3105 22.5107C31.8148 23.1743 33.6357 23.4965 35.3428 23.5088C37.0454 23.521 38.7373 23.2236 40.9697 22.5166C43.3872 21.3233 44.9506 20.3435 46.1602 19.2803C47.3214 18.2594 48.2293 17.0957 49.2559 15.4326C49.9137 12.8635 50.2008 10.9237 50.1904 9.02734C50.1796 7.05889 49.8517 5.04168 49.1836 2.30957L48.6182 0H536.783L536.868 0.0078125C546.313 0.871888 553.012 2.77109 557.812 6.90527C562.625 11.0505 565.221 17.1784 567.126 25.7148L567.171 25.915V434.217L567.126 434.417C565.221 442.953 562.625 449.08 557.812 453.226C553.012 457.36 546.313 459.26 536.868 460.124L536.783 460.131H48.6182L49.1836 457.822C49.8518 455.09 50.1796 453.072 50.1904 451.104C50.2008 449.207 49.9136 447.268 49.2559 444.699C48.2292 443.036 47.3215 441.872 46.1602 440.851C44.9507 439.787 43.3871 438.808 40.9697 437.615C38.7372 436.908 37.0454 436.611 35.3428 436.623C33.6357 436.635 31.8149 436.958 29.3105 437.621C26.271 439.295 24.5165 440.612 23.3818 441.944C22.2677 443.252 21.6446 444.699 21.0996 446.861C20.6541 449.12 20.463 450.66 20.6445 452.134C20.8228 453.581 21.3832 455.121 22.7275 457.277L24.5059 460.131H0V0H24.5059L22.7275 2.85352ZM3.73145 456.399H18.0264C17.4513 455.097 17.097 453.861 16.9404 452.591C16.6795 450.473 16.9868 448.418 17.4482 446.087L17.458 446.041L17.4688 445.996C18.0896 443.517 18.904 441.447 20.542 439.524C22.1431 437.645 24.4206 436.037 27.7129 434.239L27.9092 434.133L28.124 434.075C30.8538 433.342 33.0885 432.908 35.3154 432.892C37.5643 432.875 39.697 433.285 42.2373 434.1L42.3672 434.143L42.4893 434.202C45.1103 435.488 47.0375 436.655 48.623 438.049C50.2241 439.456 51.3939 441.021 52.5908 442.993L52.7314 443.226L52.8008 443.489C53.5564 446.378 53.935 448.728 53.9219 451.124C53.9125 452.838 53.7013 454.526 53.3252 456.399H536.601C545.783 455.553 551.49 453.745 555.377 450.397C559.23 447.078 561.594 441.986 563.439 433.8V26.332C561.594 18.1456 559.231 13.0526 555.377 9.7334C551.49 6.38588 545.783 4.57824 536.601 3.73145H53.3252C53.7013 5.60433 53.9125 7.29308 53.9219 9.00684C53.935 11.4028 53.5564 13.7536 52.8008 16.6426L52.7314 16.9062L52.5908 17.1377C51.3939 19.1094 50.2241 20.6756 48.623 22.083C47.0376 23.4767 45.1102 24.6437 42.4893 25.9297L42.3672 25.9893L42.2373 26.0312C39.697 26.8459 37.5643 27.2564 35.3154 27.2402C33.0885 27.2242 30.8539 26.7888 28.124 26.0557L27.9092 25.999L27.7129 25.8916C24.4208 24.0937 22.1431 22.4867 20.542 20.6074C18.904 18.6847 18.0896 16.6146 17.4688 14.1357L17.458 14.0908L17.4482 14.0439C16.9869 11.7133 16.6795 9.65896 16.9404 7.54102C17.097 6.27061 17.4512 5.03388 18.0264 3.73145H3.73145V456.399Z"
              fill="#270011"
            />
          </svg>
          <div class="flex flex-col gap-2.5 max-w-md">
            <div
              v-for="feature in features"
              :key="feature.title"
              class="flex flex-col gap-2.5 z-10 relative"
            >
              <div class="flex gap-2.5 items-start">
                <NuxtImg src="pink_check.png" />
                <div class="flex-1">
                  <h3 class="text-stone-900 text-lg font-bold mb-2.5">
                    {{ feature.title }}
                  </h3>
                  <div class="border-t border-stone-900/25 mb-2.5" />
                  <p class="text-stone-900 text-base">
                    {{ feature.description }}
                  </p>
                  <div class="border-t border-stone-900/25 mt-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Situations Section -->
    <section class="px-8 sm:px-28 py-16 bg-white">
      <div
        class="container mx-auto md:flex space-y-8 gap-9 items-center max-w-7xl"
      >
        <!-- Left Situations List -->
        <div class="flex-1 flex flex-col gap-6">
          <div
            v-for="situation in situations"
            :key="situation"
            class="card-base h-16 flex items-center gap-3"
          >
            <div class="p-2 relative flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="33"
                viewBox="0 0 30 33"
                fill="none"
                class="absolute"
              >
                <path
                  d="M7.04364 32.0497C7.05228 32.0094 7.13582 32.0862 7.16084 32.0649C7.20877 32.4633 7.01264 32.1962 7.04364 32.0497ZM4.13443 2.99953C4.13078 3.1012 4.12713 3.20287 4.12348 3.30453C4.20283 3.35393 4.27773 3.26458 4.3582 3.34398C4.37144 3.35737 4.40245 3.64325 4.42889 3.65091C4.45532 3.65848 4.37255 3.27603 4.39893 3.22794C4.42877 3.17516 4.6617 3.40587 4.72218 3.38679C4.94807 3.31378 5.13658 3.04729 5.40067 3.1593C5.21937 3.49169 5.51919 3.73125 5.56111 3.59467C5.57014 3.56318 5.42246 2.85091 5.69896 2.98146C5.87465 3.06426 5.94158 4.11195 6.09193 3.5496C5.75094 2.87664 5.95352 2.88737 6.10206 2.83241C6.12764 2.82282 6.363 2.88638 6.45088 2.83558C6.48092 2.81802 6.45397 2.43466 6.49478 2.41613C6.52292 2.40366 6.58681 2.60323 6.62843 2.58392C6.82298 2.49633 7.02029 2.43958 7.23863 2.46694C7.31486 3.45067 7.4157 2.85672 7.43462 2.90063C7.5364 3.15119 7.3314 3.27022 7.45167 3.41539C7.56726 3.36087 7.68285 3.30634 7.79844 3.25182C7.67458 3.15438 7.76589 2.41696 7.8726 2.72218C7.68096 1.87825 8.57748 3.34699 8.60702 3.04609C8.613 2.98259 8.40861 2.58785 8.72367 2.72326C8.7579 2.73846 8.79874 2.99655 8.80955 2.96951C8.81602 2.95326 8.70709 2.12871 8.85921 2.5656C8.91476 2.72505 8.88218 3.28783 9.14901 3.00989C8.85662 2.20767 9.4883 2.47398 9.63256 2.66054C9.58953 2.55353 9.54649 2.44653 9.50345 2.33952C9.66541 2.61884 9.62624 2.33381 9.65208 2.34451C9.75617 2.38743 9.9398 2.64528 10.0198 2.60203C10.1135 2.55192 10.0089 2.03726 10.166 2.21371C10.1153 2.1058 10.0645 1.99789 10.0138 1.88998C10.0997 1.90094 10.1856 1.91191 10.2715 1.92287C10.2244 2.64197 10.3183 1.94719 10.3302 1.92949C10.3489 1.89985 10.3716 2.18568 10.4043 2.14285C10.4072 2.1363 10.3477 1.8749 10.403 1.83292C10.5186 1.7461 10.5657 2.0804 10.6187 2.06571C10.6232 2.063 10.5578 1.82994 10.6392 1.75504C10.8978 1.51673 10.6747 1.93664 10.67 1.97165C10.6639 2.01781 10.9667 2.98586 10.6446 2.68638C10.7515 2.78083 10.8492 3.21661 10.8609 3.22554C10.8711 3.23276 11.0043 3.14141 11.0092 3.1247C11.0506 2.96153 10.9266 2.67541 10.9296 2.61899C10.9323 2.57347 11.1873 2.92728 11.0451 2.01962C11.2983 2.83195 11.1504 2.78295 11.0355 2.93918C11.0496 3.11358 11.2381 3.24754 11.2462 3.24543C11.4455 3.20322 11.1959 2.54346 11.1506 2.09843C11.127 1.86556 11.3032 2.31446 11.1034 1.71798C11.2714 1.61647 11.2338 1.99338 11.2562 2.04346C11.2896 2.11694 11.3172 1.92868 11.3299 1.95042C11.3486 1.98262 11.3513 2.20269 11.4124 2.26793C11.4223 2.27723 11.422 1.89765 11.291 1.74288C11.4291 1.76871 11.3552 1.46004 11.5261 2.07758C11.3723 0.874691 11.7326 2.76503 11.7807 2.82438C11.9084 2.98066 11.692 2.05573 11.6876 2.00937C11.6618 1.71181 11.9814 1.97953 12.0171 1.83259C12.1289 2.50777 11.8169 1.88104 11.8038 2.01911C11.7601 2.4785 12.058 2.31625 12.1339 3.17774C12.1269 2.93832 12.1199 2.69889 12.1129 2.45947C12.2969 2.98581 12.2406 3.24316 12.3983 3.00494C12.3355 2.53108 12.2733 3.1073 12.2329 2.7322C12.2092 2.51203 12.3147 2.44222 12.2937 2.32787C12.268 2.19033 12.1973 2.37396 12.1707 2.15977C12.1136 1.69749 12.5807 2.05344 12.343 2.36054C12.4218 2.33637 12.6478 3.23294 12.66 2.93674C12.6678 2.74451 12.1593 1.5463 12.5866 1.69792C12.6818 2.12362 12.4601 1.85513 12.4626 1.8885C12.4664 1.93704 12.692 2.89549 12.7068 2.94206C12.7565 3.09516 13.0398 2.49953 13.2207 2.9673C13.0746 2.41656 13.4941 2.80797 13.495 2.6309C13.4949 2.58208 13.3899 2.24788 13.3927 2.20968C13.4119 1.98174 13.7068 2.55642 13.7891 2.55607C13.8813 2.55591 13.81 2.26333 13.8151 2.26288C13.8574 2.27138 13.867 2.47762 13.8907 2.4722C13.9265 2.46391 14.1822 2.45437 14.1861 2.41013C14.1871 2.39639 14.078 2.06778 14.1189 1.99289C14.126 1.97991 14.2015 2.38048 14.326 2.17542C14.476 1.92873 14.0912 1.70601 14.0858 1.2715C14.3308 1.8418 14.2065 1.25252 14.2494 1.29202C14.2644 1.30653 14.453 1.79065 14.5403 1.7398C14.4896 1.83495 14.439 1.93011 14.3883 2.02527C14.4724 2.09976 14.5786 1.96468 14.6534 2.05295C14.6898 2.09591 14.7519 2.51253 14.8074 2.48962C14.8187 2.48252 14.6626 1.46846 14.6032 1.94987C14.518 1.59379 14.6376 1.81259 14.6503 1.70436C14.6522 1.68753 14.55 1.08447 14.6685 1.44804C14.6974 1.53755 14.9422 3.30759 14.9719 1.9843C14.9728 1.94165 14.896 1.72939 14.8958 1.68218C14.8957 1.6502 14.9872 1.72375 14.9889 1.69105C14.9904 1.65605 14.9063 1.42438 14.9066 1.37536C14.9078 1.12281 15.1674 2.05677 15.0483 2.00586C15.1071 2.11585 15.1659 2.22584 15.2246 2.33583C15.0417 1.62934 15.2385 2.12374 15.2823 2.0919C15.563 1.88827 15.2611 1.46606 15.2653 1.21492C15.2722 0.81164 15.456 2.04701 15.5082 1.65392C15.5129 1.61719 15.2536 1.12975 15.6131 1.36134C15.573 1.39057 15.5328 1.4198 15.4927 1.44903C15.659 2.13453 15.6428 1.36908 15.6512 1.35729C15.7495 1.23845 15.7207 1.50367 15.823 1.11236C15.8321 1.07724 15.9009 1.24077 15.9169 1.14893C15.9839 0.770417 15.691 0.973591 15.6252 0.695747C15.5931 0.559579 15.9453 0.523708 15.9704 0.586354C16.0795 0.864497 15.8399 0.745282 15.9523 1.09529C15.9926 1.21949 16.4313 0.858073 16.5584 0.977278C16.7054 1.11619 16.9476 2.04219 16.7338 0.989821C16.9765 2.01612 16.8612 1.30564 16.8772 1.30978C17.0728 1.36948 17.0753 1.37983 17.2062 1.25014C17.2351 1.22184 17.3272 1.52948 17.3282 1.47416C17.3285 1.4408 17.2473 1.10805 17.2599 0.997718C17.2777 0.846635 17.6288 1.13433 17.6875 1.31546C17.7462 1.49659 17.5853 1.42003 17.6725 1.71974C17.7797 1.72997 17.8611 1.63482 17.9692 1.64623C18.0144 1.65188 18.0362 1.86963 18.0553 1.87016C18.0636 1.8712 18.171 1.65362 18.1488 1.57619C18.097 1.39616 17.6721 1.61091 17.7144 1.21338C17.7226 1.13657 17.9036 1.61172 17.7689 1.01653C18.1985 1.0701 18.6282 1.12366 19.0579 1.17723C18.918 1.67145 18.5766 1.32457 18.3432 1.41582C18.3111 1.42776 18.1872 1.39296 18.2624 1.69233C18.4841 1.7286 18.7078 1.51902 18.9455 1.67565C18.9532 1.68088 18.9853 1.95708 19.0177 1.99527C19.0784 2.06653 19.1333 1.59932 19.1806 1.7076C19.1901 1.73313 19.181 2.10773 19.2524 2.33007C19.4354 2.90067 19.1881 1.60467 19.2462 1.60876C19.2913 1.61248 19.7049 2.17918 19.6956 1.76976C19.6855 1.33341 19.4349 1.56839 19.3859 1.21993C19.5093 0.834553 19.781 1.16383 19.9554 1.08339C19.9584 1.08163 19.8754 0.817661 19.9086 0.771593C19.9664 0.691422 20.063 1.07015 20.1101 1.12429C20.1608 1.18182 20.2817 1.10007 20.3277 1.23595C20.3337 1.25378 20.3843 1.63866 20.3824 1.65016C20.3568 1.81827 20.236 1.32997 20.2294 1.32472C20.206 1.31006 20.2251 1.50262 20.2049 1.49504C20.1715 1.48233 20.1197 1.31114 20.0775 1.30368C20.0483 1.29789 20.1426 1.62772 20.1136 1.61768C20.1026 1.61263 19.844 0.868347 19.9936 1.65141C20.0409 1.8983 20.9449 2.04341 20.9886 1.82933C20.8975 1.75009 20.8064 1.67084 20.7153 1.59159C20.908 1.79042 20.9564 1.1305 21.1571 2.05132C21.7145 2.01631 22.2719 1.98129 22.8293 1.94627C22.9421 2.00521 23.0101 2.60939 23.1341 2.40423C23.0544 2.22359 22.9747 2.04294 22.895 1.8623C23.0037 1.97827 23.4181 2.16361 23.4517 2.02928C23.456 2.01169 23.357 1.47252 23.438 1.40796C23.5099 1.35087 23.6048 1.75061 23.6634 1.81895C23.7123 1.87521 23.7312 1.76154 23.7465 1.78158C23.7583 1.79769 23.8117 2.04307 23.8402 2.08196C23.9295 2.20192 23.7378 1.51943 23.9618 2.30235C23.9529 2.33573 23.944 2.36912 23.9352 2.4025C24.0338 2.50232 24.2101 2.84255 24.1357 3.04331C24.123 3.07794 24.0908 2.83658 24.0767 2.83988C23.5299 2.99743 24.068 3.36967 24.1874 2.96031C24.3094 3.30282 24.5458 3.03032 24.5693 3.09793C24.6028 3.19596 24.6123 3.48763 24.7248 3.7182C24.7485 3.76703 25.0831 3.49311 25.0437 3.98938C25.0356 4.09176 24.8351 4.0268 24.7946 4.04945C25.049 4.77623 25.0695 3.65647 25.102 3.67844C25.2341 3.77284 25.0259 4.36876 25.2878 4.40584C25.4891 4.43422 25.2111 3.971 25.2398 3.74321C25.256 3.61538 25.5806 4.12196 25.4297 3.41102C25.4871 3.32011 25.5213 3.70587 25.5358 3.73116C25.5495 3.7532 25.6494 3.51079 25.7266 3.6514C25.736 3.66891 25.7937 4.04267 25.8057 4.07177C25.8277 4.12131 25.9509 4.01912 25.95 3.98662C25.9491 3.96411 25.8501 3.64678 25.8476 3.56543C25.8449 3.47159 25.9936 3.52071 25.982 3.42658C25.9638 3.2844 25.8183 3.41017 25.7718 3.04221C25.8662 3.11802 25.9403 2.85107 25.9308 2.54916C25.9355 2.63507 25.8645 2.66201 25.8331 2.6378C25.7368 2.10463 25.896 2.07971 25.9277 2.51077C25.916 2.27819 25.8682 2.16327 25.8441 1.94643C25.8381 1.89147 25.8846 1.87044 25.8752 1.77663C25.8727 1.75807 25.7816 1.56807 25.7697 1.45822C25.7482 1.25972 25.9047 1.27345 25.9272 1.32209C25.9907 1.45998 25.9061 1.65975 25.9417 1.88566C25.9473 1.92033 26.1391 2.33815 26.1486 2.37658C26.2393 2.79106 26.0643 2.5147 26.1537 2.88635C26.198 2.95966 26.2422 3.03298 26.2865 3.1063C26.2552 3.50748 26.0144 3.35356 26.0505 3.79525C26.1854 3.63412 26.3571 3.61492 26.5547 4.5859C26.638 4.99482 26.6173 5.24869 26.6412 5.35211C26.7273 5.72202 26.7414 5.29823 26.7489 5.31714C26.7565 5.33922 26.7623 5.36102 26.7667 5.3825C26.7667 5.38251 26.7667 5.38252 26.7667 5.38253C26.8111 5.60034 26.7056 5.78522 26.719 5.88607C26.7434 6.06509 26.9529 6.77976 26.9856 6.94062C26.99 6.97336 26.9272 7.16541 27.0175 7.43935C27.1087 7.71604 27.1957 7.70482 27.2047 7.73366C27.2556 7.89992 27.1373 8.08517 27.1532 8.18624C27.1612 8.23736 27.3051 8.53205 27.3257 8.62101C27.346 8.71036 27.3247 8.91867 27.3584 9.20688C27.3833 9.42102 27.4686 9.5717 27.4661 9.60657C27.464 9.62978 27.3216 9.65507 27.3222 9.69349C27.3229 9.75033 27.4074 9.99511 27.4154 10.059C27.427 10.1508 27.3627 10.0694 27.3877 10.1612C27.4063 10.2297 27.7604 11.0606 27.8065 11.2925C27.885 11.6879 27.5119 10.8173 28.0045 12.3406C28.0078 12.3506 28.0277 12.2311 28.0309 12.2405C28.1156 12.5219 28.0692 12.991 28.2202 12.8798C28.0116 13.4413 28.3027 13.4816 28.3924 14.1561C28.4268 14.4154 28.3281 14.5453 28.3353 14.5838C28.4132 14.9058 28.4002 14.6464 28.4456 14.8028C28.4709 14.8902 28.4333 15.2551 28.5029 15.4728C28.5388 15.585 28.6447 15.5209 28.6539 15.5423C28.7422 15.7442 28.7331 15.983 28.7736 16.1309C28.8007 16.2301 28.8713 16.224 28.8767 16.2417C28.8873 16.2788 28.8766 16.7041 28.8862 16.8509C28.8938 16.9638 28.9845 17.1246 28.9839 17.1746C28.98 17.4738 28.6986 16.7703 29.035 17.7679C29.0556 17.8291 29.0987 17.7939 29.1027 17.8061C29.1917 18.0902 29.1079 18.1334 29.1404 18.3742C29.1965 18.7892 29.2779 18.5349 29.2302 18.8444C29.3646 19.0959 29.4067 19.0756 29.4848 18.982C29.2689 19.2428 29.3937 20.3211 29.6752 20.236C29.5806 20.2381 29.7126 20.8341 29.6875 20.8501C29.6718 20.8594 29.4182 20.2918 29.7509 21.6136C29.7925 21.7787 29.8297 21.5506 29.8741 21.8969C29.6634 21.8491 29.9143 22.1147 29.9237 22.1598C30.0814 22.9462 29.4787 22.3986 29.416 22.5048C29.3432 22.6279 29.386 23.2642 29.3657 23.2692C29.2985 23.2831 29.2902 22.9573 29.2516 22.8448C29.213 22.7333 29.1447 23.3747 29.1284 23.3436C29.0643 23.2182 29.0259 22.838 29.0182 22.8199C28.9258 22.6009 28.7285 22.945 28.639 22.8731C28.6905 23.1144 28.8387 23.1041 28.8278 23.5107C28.8152 23.9847 28.5919 22.9204 28.5796 22.8741C28.101 22.9822 27.6224 23.0903 27.1438 23.1984C27.2654 23.7641 27.4924 23.2725 27.5148 23.3456C27.6469 23.779 27.1144 23.8791 27.0084 23.6922C27.0829 23.8046 27.1573 23.9169 27.2317 24.0293C27.2802 24.6983 26.9206 23.8896 26.857 24.2023C26.8366 24.3036 26.9637 24.5397 26.9656 24.5572C26.9729 24.8194 26.8619 24.6389 26.8458 24.2882C26.8039 24.6359 26.7465 24.2734 26.6579 24.2633C26.6534 24.2631 26.7427 24.5188 26.6992 24.6413C26.6787 24.6984 26.5146 24.7328 26.5395 24.9673C26.5502 25.066 26.8415 26.069 26.6728 25.189C26.9388 25.5805 26.6483 24.7774 26.7219 24.7834C26.7335 24.7858 26.8089 25.2808 26.9367 25.0145C27.0835 25.9049 26.7475 25.2852 26.7348 25.3993C26.7085 25.6338 27.0948 26.0303 27.0082 25.3305C27.1236 26.0252 27.048 25.4192 27.1191 25.4342C27.197 25.4504 27.2076 25.6621 27.2466 25.6553C27.3535 25.6388 27.2104 25.161 27.3872 25.582C27.0251 24.241 27.5001 25.3723 27.641 25.7142C27.5438 25.8058 27.4467 25.8974 27.3495 25.9891C27.3704 26.0591 27.3913 26.1291 27.4122 26.1992C27.3808 26.1951 27.3495 26.1909 27.3181 26.1868C27.3089 26.1175 27.2996 26.0481 27.2904 25.9788C27.2299 26.4541 27.0912 25.9621 27.0778 25.959C26.9074 25.9334 26.7251 25.9751 26.5644 26.0061C26.5403 26.0108 26.6475 26.452 26.4012 26.1397C26.3227 26.0403 26.305 25.6836 26.2521 25.7484C26.3645 26.7045 26.2131 25.9545 26.1893 25.9581C26.1217 25.9721 26.1278 26.2133 26.122 26.217C26.0459 26.2704 25.9155 26.2565 25.8308 26.3099C25.8298 26.3138 25.9364 26.5928 25.8594 26.5195C25.8322 26.4933 25.393 25.2989 25.3107 25.7342C25.3704 25.8087 25.4301 25.8832 25.4897 25.9577C25.4158 25.8517 25.1272 26.2341 25.2805 26.5465C25.3744 26.7374 25.3412 25.9166 25.5111 26.6778C25.3474 26.473 24.7703 26.9469 24.6837 26.7796C24.6716 26.7557 24.6639 26.4991 24.6478 26.4693C24.6354 26.4467 24.4993 26.5356 24.4602 26.4444C24.4369 26.3902 24.4714 26.225 24.4479 26.1367C24.4303 26.074 24.2236 26.0056 24.2764 26.3184C24.2964 26.1844 24.4463 26.2673 24.4327 26.5429C24.4307 26.5772 24.3452 26.3859 24.3432 26.4293C24.3237 26.8298 24.5953 26.6792 24.6408 26.6732C24.5392 27.1062 24.1621 26.6971 24.0035 26.9982C23.8654 26.757 24.0494 26.5767 23.9091 26.3822C23.6183 25.9789 23.9288 26.7507 23.9292 26.7849C23.9327 27.0559 23.4781 25.6921 23.695 26.7565C23.5897 26.611 23.5859 26.4721 23.5118 26.6322C23.5403 26.7032 23.5688 26.7741 23.5973 26.8451C23.6092 27.4848 23.0512 25.9785 23.0451 25.8562C23.0289 25.5288 23.2553 25.9985 23.2636 25.9844C23.2759 25.9636 23.0995 24.8746 23.4699 25.8049C23.3933 25.0661 23.0952 25.3721 23.152 24.8462C23.0622 24.9489 22.5219 24.534 22.5237 24.8647C22.5246 24.9078 22.7068 25.6224 22.5238 25.2771C22.4368 25.1126 22.5589 25.079 22.5019 24.9194C22.3267 24.4295 21.4099 24.9526 21.2287 25.0173C21.2167 25.0206 21.1755 24.7957 21.164 24.8002C21.1287 24.8139 21.0635 25.1751 20.977 25.0854C21.1972 25.4723 20.9404 25.5583 20.8641 25.5263C20.7482 25.4776 20.6742 25.0821 20.6131 25.0072C20.378 24.7186 20.3064 25.708 19.9965 24.8599C20.1807 25.7268 19.6822 24.4806 19.5739 24.4947C19.489 24.5055 19.4848 25.1049 19.669 25.4319C19.5165 25.4214 19.3976 25.6143 19.2729 25.6947C19.2523 25.7081 19.2308 25.4451 19.1973 25.4761C19.1947 25.4808 19.2412 25.7333 19.2137 25.7662C18.9877 26.0408 19.0104 25.4792 18.9277 25.3323C18.8814 25.2501 18.8516 25.2105 18.8333 25.1992C18.981 25.1179 19.1429 24.982 19.1902 24.9649C19.0353 24.4177 18.8621 25.1429 18.7414 25.0118C18.7371 25.007 18.6856 24.6985 18.682 24.697C18.6819 24.697 18.6818 24.697 18.6818 24.697C18.6432 24.6805 18.4507 24.8374 18.5695 25.1936C18.6013 25.2887 18.7005 25.2683 18.8114 25.2111C18.7935 25.2861 18.8872 25.6244 18.8846 25.6401C18.851 25.8236 18.6158 25.5228 18.5474 25.4897C18.5319 25.4826 18.5777 25.7022 18.5756 25.7031C18.5115 25.6642 18.4057 25.0321 18.4824 25.6906C18.2254 24.9282 18.6414 25.5372 18.5181 25.0332C18.4232 24.6451 17.8435 24.9821 17.971 25.5979C17.9554 25.5325 17.9302 25.4524 17.8937 25.3629C17.8126 25.1641 17.6525 25.2641 17.6458 25.3838C17.6453 25.4072 17.7692 26.0048 17.7641 26.0116C17.7512 26.0285 17.4439 25.6028 17.4368 25.9725C17.4966 26.0476 17.5565 26.1227 17.6163 26.1978C17.3594 26.2556 17.4355 26.4254 17.5579 26.5867C17.5626 26.5875 17.5714 26.6093 17.576 26.6109C17.6695 26.7296 17.7809 26.8395 17.7918 26.8864C17.8334 27.0654 17.4162 27.2549 17.3873 26.6828C17.3835 26.6046 17.6364 26.8104 17.4554 26.4349C17.4237 26.3691 17.3167 26.5086 17.301 26.4664C17.1961 26.1856 17.4015 25.7422 17.2827 25.3371C17.2939 25.7436 17.1633 25.5549 17.1049 25.6724C17.0782 25.7255 17.1306 26.0272 17.1273 26.0337C17.0769 26.1255 17.05 25.8035 17.0295 25.8159C17.0187 25.8237 17.0245 26.5195 16.8611 25.592C16.5689 26.3584 16.8802 26.2942 17.1337 26.1884C17.1188 26.5414 16.922 26.4123 16.8645 26.5052C16.8439 26.5389 16.9223 26.8435 16.8904 26.9142C16.8246 27.0595 16.3152 26.7951 16.1843 26.7349C16.2321 26.6119 16.1433 26.2808 16.094 26.315C16.0447 26.3493 16.1813 26.7876 16.1806 26.8378C16.1795 26.89 15.883 26.7304 15.8527 26.797C16.0104 26.596 15.8992 26.2704 15.7302 26.2684C15.7339 26.1673 15.7377 26.0663 15.7415 25.9652C15.6742 26.1199 15.3707 25.6505 15.3468 25.8135C15.3431 25.8396 15.4314 26.1145 15.4293 26.1291C15.4056 26.2584 15.1834 26.0051 15.1954 26.1026C15.2052 26.1837 15.3231 26.4052 15.3208 26.5265C15.3204 26.552 15.1756 26.1858 15.1283 26.2927C15.1107 26.3321 15.1798 26.5949 15.1767 26.6116C15.1511 26.75 15.0903 26.2961 15.0106 26.3873C14.9523 26.4546 14.99 26.9028 14.8649 26.7773C15.2925 27.2713 14.9812 27.092 14.8844 27.2879C14.8689 27.3191 14.9853 27.7981 14.8118 27.5887C14.9012 26.6615 14.6415 27.143 14.5693 27.1478C14.5648 27.1456 14.4986 26.8276 14.4631 26.8295C14.4602 26.8304 14.5083 27.0446 14.4796 27.0676C14.2074 27.2851 14.3522 27.0025 14.2512 26.8021C14.2082 26.7168 14.1225 27.0511 14.0842 27.0665C14.0752 27.0691 14.0338 26.8448 14.0002 26.8608C13.9408 26.8896 13.9332 27.1389 13.8957 27.1662C13.8911 27.1683 13.819 26.8157 13.764 26.9461C13.7484 26.9825 13.7492 27.1128 13.8012 27.2078C13.973 27.5201 14.0522 26.9028 14.2374 27.2118C14.4061 27.4931 14.0746 27.5904 14.0575 27.5958C14.0512 27.5982 14.0814 27.4097 14.0074 27.3887C13.9444 27.3715 13.9641 28.0019 13.8519 27.8866C13.8434 27.8781 13.67 27.3755 13.667 27.3447C13.6654 27.3222 13.7471 27.1888 13.7014 27.0424C13.6961 27.0257 13.6304 27.0428 13.5991 26.9332C13.5608 26.8 13.2612 25.4766 13.2402 25.4461C13.187 25.3712 13.2725 25.6695 13.2447 25.6533C13.1851 25.6191 12.9298 25.2617 13.0181 25.7236C13.0526 25.7451 13.0871 25.7665 13.1216 25.7879C12.9703 25.8681 13.0789 26.0503 13.0737 26.1413C13.0682 26.2398 12.9926 25.8334 12.9305 25.8065C12.917 25.8005 12.7072 25.9313 12.746 26.1004C12.8164 25.8044 12.8719 26.3143 12.8795 26.3221C12.9082 26.3502 12.879 26.0638 12.9097 26.0633C13.1262 26.065 13.0072 26.5507 13.0794 26.6547C13.1041 26.6896 13.0889 26.4431 13.0985 26.4539C13.1299 26.4889 13.1943 26.8026 13.2046 26.7741C13.2288 26.7078 13.096 26.2723 13.0941 26.2486C13.0698 25.9641 13.2671 26.2841 13.2867 26.7833C13.3696 26.9478 13.2554 26.3594 13.3408 26.5865C13.5103 27.0362 13.374 26.9396 13.3595 27.023C13.3075 27.3236 13.2293 27.1048 13.0911 27.2133C13.0412 27.2518 13.0337 27.5504 13.0112 27.5713C12.997 27.5845 12.6416 26.6232 12.9538 28.1774C12.8637 28.0392 12.5617 27.0347 12.51 27.094C12.4637 27.1479 12.5932 27.6939 12.5924 27.7162C12.5914 27.7512 12.516 27.7214 12.5094 27.8037C12.5017 27.9008 12.5576 28.1079 12.5332 28.2019C12.4724 28.4353 12.3608 27.8738 12.3426 27.8395C12.1325 27.4435 12.3496 28.2302 12.3351 28.2999C12.3214 28.3639 11.8993 28.1301 11.8648 28.3475C11.8727 28.2288 11.8806 28.1102 11.8885 27.9916C11.762 27.6529 11.8199 28.2355 11.691 27.6083C11.8863 28.6235 11.6345 27.9696 11.6057 28.0028C11.5944 28.0163 11.6307 28.1887 11.6153 28.1996C11.5557 28.2432 11.3792 28.1361 11.3614 28.2309C11.2837 28.6392 11.8064 29.1855 11.8453 29.217C11.7807 29.2185 11.4749 29.5172 11.736 29.9711C11.7764 30.0412 11.7283 29.5788 11.7387 29.5582C11.81 29.4221 11.818 29.8436 11.8334 29.8807C11.8588 29.9405 11.8413 29.535 11.8673 29.5784C11.8759 29.5923 11.9154 29.9674 12.0077 29.9566C12.0358 30.3223 11.7216 30.0837 11.7053 30.1743C11.6994 30.2066 11.9295 30.9533 11.5604 30.2577C11.5773 30.3279 11.5943 30.3981 11.6112 30.4684C11.4957 30.5223 11.3802 30.5762 11.2646 30.6301C11.2446 30.4644 11.2461 30.1231 11.1743 30.2101C11.133 30.2604 11.2437 30.6159 11.2413 30.6274C11.2173 30.7363 10.4071 30.7757 10.2631 30.8472C10.214 30.871 10.1291 31.1921 10.1192 31.1998C10.0594 31.2424 9.78759 31.1 9.7495 31.1507C9.72585 31.1831 9.81533 31.4809 9.78649 31.4719C9.7596 31.4632 9.72477 31.1648 9.71511 31.154C9.63413 31.0598 9.26203 31.5364 9.09864 31.2816C9.18096 31.3513 9.38778 30.6988 9.33905 30.4933C9.33185 30.4652 9.20706 30.2582 9.21289 30.3704C9.13409 30.122 9.19893 30.914 9.1175 30.7725C9.10828 30.7564 9.04233 30.3181 8.9362 30.2578C8.89969 30.2372 8.88736 30.5918 8.72833 30.2296C8.64706 30.4358 7.90995 30.0002 7.96225 30.4749C7.966 30.4998 8.08637 30.6424 8.06614 30.8457C8.03924 31.1159 7.93537 30.2453 7.82856 30.1901C7.81244 30.1817 7.57484 30.3204 7.57728 30.3751C7.59794 30.8714 7.86072 31.0207 7.86898 31.0772C7.88988 31.2194 7.72189 31.3423 7.7076 31.3107C7.69339 31.2776 7.71473 30.6101 7.58232 30.8886C7.61864 30.9604 7.65496 31.0323 7.69128 31.1041C7.63607 31.2697 7.53812 30.8309 7.51194 30.8082C7.43023 30.7361 7.49705 31.4194 7.22548 30.614C7.15351 30.4002 7.1491 30.1474 7.13899 30.1153C7.04606 29.8267 7.16529 30.6249 6.99597 30.046C6.9833 30.0028 7.02594 29.6266 6.8255 29.6665C6.85079 29.7202 6.87609 29.7738 6.90139 29.8275C6.89885 29.9593 6.71137 30.0756 6.67801 30.0514C6.58057 29.9805 6.56741 29.5609 6.49719 29.6257C6.66183 30.1708 6.43306 30.293 6.34955 29.8118C6.43801 30.4195 6.13663 29.9983 6.03646 30.0038C5.97335 30.0078 5.90162 30.2954 5.87587 30.2688C5.84445 30.236 5.76813 29.8248 5.70663 29.7423C5.6891 29.7188 5.62266 30.0452 5.42411 29.6439C5.38572 29.5666 5.19839 28.8808 5.20334 28.6989C5.21184 28.3875 5.45672 28.9208 5.37132 28.5105C5.27978 28.0715 5.15699 28.3687 5.0979 28.321C4.82504 28.1004 4.85616 27.6076 4.82166 27.4672C4.73702 27.1266 4.61965 27.1616 4.60836 27.1317C4.55971 26.9987 4.58899 26.7095 4.54752 26.4996C4.49339 26.2263 4.2777 25.757 4.28513 25.6597C4.29599 25.5213 4.48562 25.9104 4.48833 25.8894C4.52173 25.6067 4.27332 25.0004 4.17712 24.6972C4.14768 24.6039 4.15561 24.4391 4.14161 24.4128C3.92843 24.0144 4.29565 25.3048 4.19354 25.2344C4.10246 25.1717 4.11467 24.7375 4.10714 24.7152C4.09831 24.6908 4.00382 24.6866 3.95984 24.5428C3.93793 24.4707 4.00717 23.6168 3.92371 23.2573C3.86541 23.3522 3.80711 23.447 3.74881 23.5419C3.64686 23.0717 3.82482 23.3968 3.826 23.346C3.82844 23.2439 3.71756 23.0181 3.68985 22.8685C3.67195 22.7734 3.67606 22.4203 3.58162 22.2943C3.54912 22.2508 3.5689 22.591 3.41744 22.2702C3.61705 21.7804 3.36378 21.5561 3.32126 21.3908C3.27892 21.2256 3.33607 20.8046 3.18362 20.9081C2.98937 19.9922 3.1281 20.6174 3.14257 20.4465C3.16016 20.2365 2.96453 19.9618 3.22323 20.1477C3.12361 19.7207 2.95942 19.7858 2.94342 19.7534C2.9293 19.7239 2.9241 19.505 2.896 19.4362C2.56708 18.6389 2.75405 18.9955 2.59975 18.475C2.58598 18.4284 2.39495 18.2627 2.49415 18.1621C2.67493 17.9791 2.88653 18.5699 2.65644 17.2616C2.38633 16.728 2.3699 17.6061 2.32572 17.63C2.25784 17.6651 2.27839 17.3846 2.25435 17.312C2.24637 17.2886 2.18873 17.3232 2.1836 17.3023C1.937 16.319 2.4567 17.2295 2.52249 17.0363C2.46513 16.8932 2.40776 16.7501 2.3504 16.607C2.38591 16.5936 2.42141 16.5802 2.45692 16.5667C2.22108 16.3037 2.4277 16.4549 2.30749 15.6425C2.28047 15.4599 2.22867 15.793 2.25747 15.2644C2.13715 15.1683 2.13452 14.9979 2.09315 15.2422C2.02974 14.9197 2.15266 14.5162 2.19667 14.3351C1.84838 14.0291 2.24578 15.1786 1.88104 14.6019C1.91835 15.0097 2.01578 14.909 2.01997 14.9767C2.03509 15.2201 1.88078 14.8601 1.95613 15.7085C1.96863 15.8478 2.11865 16.2537 2.01897 16.253C2.00781 16.2522 1.87391 15.9065 1.86946 15.8804C1.82034 15.5982 1.90202 15.6911 1.88064 15.5735C1.86038 15.4621 1.80674 15.5425 1.80025 15.5118C1.72654 15.1609 1.82895 15.3661 1.79808 15.2578C1.73106 15.0223 1.33508 14.3154 1.69581 14.4725C1.5147 14.9232 1.74136 14.8674 1.81232 14.6939C1.83055 14.6504 1.79435 14.4391 1.81658 14.3587C1.84506 14.2547 1.92145 14.344 1.93828 14.3005C1.95617 14.2526 1.70415 13.7872 1.95254 13.8908C1.74087 13.4199 1.65199 13.9861 1.47226 13.6618C1.10942 13.0065 1.45229 12.78 1.47737 12.7042C1.48399 12.6837 1.39144 12.4073 1.39481 12.3885C1.40068 12.3596 1.63939 12.4474 1.61246 12.2085C1.58553 11.9699 1.53702 12.2352 1.48064 11.9921C1.44265 11.8284 1.63888 11.4844 1.47751 11.4002C1.36637 11.3425 1.32533 12.0398 1.15077 11.3349C1.27909 11.2475 1.40742 11.16 1.53575 11.0725C1.4038 10.8177 1.27185 10.5629 1.1399 10.3081C1.27991 10.1902 1.47833 10.4678 1.54897 10.0501C1.01281 9.25669 1.52466 9.33463 1.50839 9.22808C1.49728 9.16464 1.21237 8.49001 1.16337 8.36598C1.23356 8.06979 1.58756 7.85988 1.18757 7.03667C1.26802 7.22456 1.26727 6.72042 1.25853 6.68414C1.16785 6.30293 1.00491 6.59534 0.969096 6.24164C0.927475 5.83119 1.09532 6.36531 1.14856 6.30907C1.42105 6.01689 0.925134 4.03137 1.30944 4.2832C1.28854 4.21316 1.26763 4.14313 1.24673 4.07309C1.61735 4.11578 1.98797 4.15848 2.35858 4.20118C2.3698 3.56167 2.65565 3.11537 2.84716 3.14682C2.88563 3.15271 3.12677 3.43797 3.1515 3.49156C3.19805 3.59443 3.07145 3.66312 3.17369 3.85296C3.19504 3.89185 3.51997 3.96612 3.42892 3.62817C3.3875 3.59528 3.31827 3.7886 3.28476 3.71143C3.04747 3.16022 4.05818 3.43316 4.05631 3.19192C4.01334 3.0849 3.97037 2.97788 3.92739 2.87086C3.9964 2.91375 4.06542 2.95664 4.13443 2.99953ZM7.08045 31.0318C7.11575 31.3823 6.97612 31.1421 6.94435 31.249C6.90083 31.3985 7.04969 32.7456 6.83143 31.4095C6.91444 31.2836 6.99744 31.1577 7.08045 31.0318ZM8.70971 31.2327C8.60213 31.0625 8.50546 30.3111 8.62555 30.6072C8.63904 30.6408 8.85499 31.4617 8.70971 31.2327ZM7.90459 31.0309C7.90554 31.0205 7.96999 31.0278 7.97447 31.039C8.0893 31.3251 7.89462 31.3016 7.90459 31.0309ZM11.3704 29.9286C11.2999 29.9763 11.4929 30.6379 11.4844 30.3512C11.4838 30.333 11.3752 29.926 11.3704 29.9286ZM11.312 29.922C11.1292 29.3315 11.2577 30.5775 11.3285 30.435C11.3352 30.4207 11.3207 29.9508 11.312 29.922ZM8.40032 30.9893C8.3611 30.7567 8.45601 30.8535 8.4981 30.9025C8.54025 31.1135 8.42528 30.9573 8.40032 30.9893ZM10.2171 30.552C10.1831 30.3698 9.9343 30.431 9.96601 30.6738C9.98489 30.5642 10.2474 30.7158 10.2171 30.552ZM10.8084 30.1658C10.7956 30.1357 10.7187 30.2011 10.7539 30.3608C10.839 30.5624 10.866 30.3021 10.8084 30.1658ZM12.0892 29.9158C12.0857 29.8746 11.8129 28.8683 12.1035 29.508C12.1461 29.6017 12.1198 29.8845 12.1353 29.9195C12.1666 29.9874 12.1867 30.0179 12.1985 30.0217C12.1442 30.1208 12.0779 30.1757 12.0581 30.1154C11.9647 29.8301 12.0905 29.9331 12.0892 29.9158ZM12.6055 29.0193C12.5864 28.85 12.6987 28.9197 12.7342 28.9838C12.7405 28.9959 12.8135 29.4363 12.8493 29.3949C12.8779 29.361 12.7357 28.9237 12.8167 28.9818C12.8984 29.04 12.8738 29.3774 12.8843 29.3989C12.8983 29.4272 12.961 29.205 13.0109 29.466C13.0478 29.6594 12.9101 29.5516 12.891 29.5982C12.8665 29.6581 12.9747 29.9707 12.9018 29.9136C12.856 29.878 12.7613 29.3089 12.7477 29.2819C12.7365 29.2603 12.6736 29.6117 12.6061 29.021C12.6059 29.0204 12.6057 29.0199 12.6055 29.0193ZM12.2128 29.9928C12.2113 30.013 12.2071 30.0244 12.1985 30.0217C12.2035 30.0127 12.2081 30.0025 12.2128 29.9928ZM7.23206 30.7427C7.30395 30.9095 7.24156 31.155 7.15414 30.935C7.1159 30.7511 7.22074 30.7167 7.23206 30.7427ZM12.1854 29.5192C12.3207 29.639 12.2821 29.8496 12.2128 29.9928C12.2212 29.8803 12.1401 29.4792 12.1854 29.5192ZM9.21289 30.3704C9.22596 30.4116 9.24221 30.4767 9.26457 30.5846C9.22871 30.469 9.21472 30.4058 9.21289 30.3704ZM9.50035 30.5124C9.51839 30.1662 9.34823 30.2148 9.39729 30.4498C9.41592 30.5385 9.49961 30.5262 9.50035 30.5124ZM11.4759 29.9406C11.4615 29.91 11.38 28.8925 11.3564 29.6733C11.4739 29.7712 11.3971 29.8995 11.4163 29.9862C11.4711 30.2353 11.5795 29.963 11.6363 30.0639C11.5725 29.6112 11.5232 30.0414 11.4761 29.9405C11.476 29.9406 11.4759 29.9406 11.4759 29.9406ZM13.8644 29.0134C13.8965 29.2797 13.8117 29.2092 13.7629 29.2031C13.7308 28.9368 13.8156 29.0073 13.8644 29.0134ZM25.8185 26.6151C25.5551 26.9211 25.297 25.8624 25.6692 26.2258C25.6766 26.2335 25.8155 26.5031 25.8185 26.6151ZM23.0775 26.8861C22.9532 26.427 23.0355 26.3324 23.1387 26.5114C23.162 26.5516 23.3117 27.0117 23.2692 27.1163C23.1563 26.5522 23.0177 26.3562 23.0775 26.8861ZM12.1848 29.2091C12.1526 28.8926 12.293 29.0939 12.3527 29.1303C12.3741 29.3919 12.2491 29.2971 12.1848 29.2091ZM24.6772 26.2683C24.637 26.2398 24.6972 26.6489 24.7098 26.6814C24.7667 26.8306 24.7617 26.491 24.6772 26.2683ZM11.8672 29.2237C11.8251 29.0392 11.915 28.8351 12.0172 29.2915C11.9835 29.2639 11.8941 29.3393 11.8672 29.2237ZM13.75 28.8918C13.7111 28.8016 13.7783 28.6122 13.8281 28.6994C13.8658 28.8972 13.7753 28.9505 13.75 28.8918ZM24.1743 26.5139C24.1376 26.4847 24.0617 26.4891 24.0868 26.6543C24.1184 26.8608 24.2123 26.7691 24.1743 26.5139ZM29.5961 25.0407C29.6148 25.1134 29.6085 25.6662 29.5304 25.5426C29.3817 25.3058 29.5815 24.9896 29.5961 25.0407ZM24.9467 25.996C25.1183 26.3618 24.9389 26.0102 25.0256 26.4146C25.0912 26.4164 25.2512 26.4046 25.0628 26.0281C25.0262 25.9553 24.9813 26.0163 24.9467 25.996ZM24.8332 25.878C24.85 26.0113 24.8672 26.4387 24.9192 26.3973C24.9431 26.3775 24.8926 25.9089 24.8332 25.878ZM28.925 25.3651C28.7684 25.0234 29.1902 25.1379 29.214 25.1984C29.2266 25.2304 29.2368 25.2609 29.2444 25.287C29.2352 25.1704 29.3033 25.1352 29.3703 25.421C29.3438 25.4017 29.2898 25.4391 29.2764 25.4086C29.2707 25.3956 29.2659 25.3834 29.2617 25.3707C29.2871 25.6255 28.9549 25.4298 28.925 25.3651ZM28.2158 25.1252C28.2034 24.5766 28.4038 25.4728 28.4014 25.5034C28.3725 25.8928 28.3051 25.2155 28.2955 25.1851C28.2778 25.1349 28.2667 25.4578 28.2161 25.1251C28.216 25.1251 28.2159 25.1252 28.2158 25.1252ZM28.7649 25.2436C28.7664 25.231 28.8523 25.2425 28.8585 25.2561C28.9858 25.545 28.7432 25.5138 28.7649 25.2436ZM12.9832 28.2866C13.0588 28.3643 13.07 28.7068 13.0076 28.5955C13.002 28.5845 12.9164 28.2179 12.9832 28.2866ZM24.8055 25.9765C24.7795 25.9167 24.391 25.7502 24.5133 26.246C24.5302 26.1811 24.9696 26.3595 24.8055 25.9765ZM22.2367 26.374C22.2975 26.3656 22.3282 26.8504 22.2603 26.6812C22.2351 26.6183 22.2214 26.3764 22.2367 26.374ZM11.6097 28.8304C11.6001 29.1021 11.4359 28.2305 11.5506 28.5174C11.5551 28.5286 11.61 28.8198 11.6097 28.8304ZM22.7715 26.5472C22.6228 26.8752 22.367 25.3704 22.7391 25.8202C22.7442 25.8884 22.7494 25.9567 22.7545 26.025C23.1109 26.1859 22.7973 26.1261 22.7382 26.2253C22.7158 26.263 22.7909 26.5075 22.7721 26.549C22.7719 26.5484 22.7717 26.5478 22.7715 26.5472ZM21.9151 26.4098C21.4995 25.3895 22.021 26.0028 22.102 25.8423C22.0854 26.302 21.9341 26.2638 22.213 26.6741C21.9566 26.8167 21.9846 26.3709 21.9665 26.338C21.9455 26.3013 21.9329 26.4536 21.9151 26.4098ZM22.4396 26.2954C22.4449 26.2621 22.5757 26.4604 22.5998 26.4188C22.63 26.7901 22.406 26.5215 22.4396 26.2954ZM27.6014 25.5068C27.5507 25.2213 27.5259 25.0085 27.6161 25.1007C27.624 25.2477 27.6053 25.3794 27.6014 25.5068ZM6.70984 29.5508C6.65849 29.54 6.54269 29.4522 6.63238 29.7449C6.64073 29.7697 6.74386 29.7184 6.70984 29.5508ZM23.7699 25.9481C23.7527 25.9152 23.4883 25.9447 23.6419 26.2398C23.6882 26.3287 23.9162 26.2405 23.7699 25.9481ZM25.1215 25.7096C25.0991 25.7111 25.0218 25.7826 25.0336 25.8501C25.075 26.0835 25.1573 25.9338 25.1215 25.7096ZM6.41247 29.3086C6.40025 29.2805 6.26672 29.362 6.31066 29.4966C6.39386 29.751 6.45446 29.4058 6.41247 29.3086ZM13.0564 27.5788C13.0663 27.5659 13.1451 27.8711 13.15 27.8737C13.1607 27.8761 13.3571 27.7125 13.3536 28.1256C13.353 28.1949 13.0046 28.1075 12.9554 28.0768C12.8531 27.6566 13.0708 28.0318 13.0949 27.9815C13.099 27.972 13.0305 27.617 13.0566 27.5806C13.0566 27.58 13.0565 27.5794 13.0564 27.5788ZM27.8974 25.1344C27.8522 24.8632 28.0752 24.632 28.1387 24.9589C28.0583 25.0174 27.9778 25.0759 27.8974 25.1344ZM27.7566 25.1167C27.6624 24.9375 27.7792 24.8481 27.8345 24.9243C27.8718 25.1053 27.7703 25.1429 27.7566 25.1167ZM24.4245 24.8041C24.4119 24.8753 24.5721 25.2517 24.5697 25.3317C24.568 25.3816 24.4797 25.2463 24.4862 25.3729C24.4889 25.4131 24.6236 25.7702 24.6375 25.7507C24.6575 25.7245 24.5746 25.4387 24.6009 25.4313C24.688 25.407 24.8086 25.5983 24.8905 25.5765C24.8978 25.574 24.7979 25.3806 24.8624 25.3705C24.8722 25.3686 24.9938 25.6621 25.061 25.6012C25.0367 24.6203 25.35 25.5244 25.4945 25.1395C25.4682 25.052 25.2594 24.8456 25.2482 24.8387C25.0375 24.7195 24.7135 24.7677 24.5257 24.8039C24.4774 24.8129 24.5416 25.0085 24.5224 25.0201C24.5072 25.0288 24.451 24.6539 24.4245 24.8041ZM6.69309 29.3406C6.59505 28.9746 6.56395 29.2253 6.50965 29.2164C6.59553 29.547 6.6271 29.2685 6.69309 29.3406ZM26.5337 25.0669C26.5113 25.0864 26.4102 24.9908 26.4265 25.1036C26.4479 25.251 26.5797 25.3199 26.5337 25.0669ZM14.3217 27.4305C14.3221 27.4199 14.3869 27.4273 14.3916 27.4385C14.5065 27.7248 14.3118 27.701 14.3217 27.4305ZM15.7901 27.2054C15.8269 27.1502 15.8498 27.025 15.9266 27.3224C15.8878 27.2824 15.8274 27.4159 15.7901 27.2054ZM17.7941 26.7875C17.7043 26.3957 17.895 26.6224 17.9284 26.6524C17.9544 26.8293 17.8589 27.0697 17.7941 26.7875ZM27.3395 24.273C27.429 24.279 27.2895 23.6863 27.3984 23.9452C27.4165 23.989 27.6981 25.225 27.51 24.7787C27.4762 24.6985 27.4816 24.39 27.3395 24.273ZM22.7855 25.8237C22.7539 25.5589 22.8371 25.6224 22.8869 25.634C22.9162 25.8296 22.8141 25.7985 22.7855 25.8237ZM6.09137 29.0639C5.97663 28.7043 5.84846 29.0146 5.94347 29.2482C5.9564 29.2786 6.06276 29.0553 6.09137 29.0639ZM12.1583 27.9774C12.1749 27.6725 12 27.6147 12.0083 27.9077C12.0269 27.8846 12.1571 27.9975 12.1583 27.9774ZM17.2687 26.6717C17.2699 26.6591 17.3558 26.6707 17.3623 26.6842C17.4896 26.9732 17.247 26.942 17.2687 26.6717ZM15.2146 26.8249C15.1949 26.5807 15.424 26.7343 15.5152 26.9642C15.5453 27.321 15.2394 27.1298 15.2146 26.8249ZM27.025 24.5135C27.083 24.4888 27.1554 24.5505 27.232 24.6422C27.2612 24.8452 27.062 24.6621 27.025 24.5135ZM17.5579 26.5867C17.5626 26.5875 17.5714 26.6093 17.576 26.6109C17.5699 26.6033 17.5638 26.5944 17.5579 26.5867ZM25.6421 24.6487C25.5752 24.5798 25.6607 24.9453 25.6661 24.9559C25.7285 25.0672 25.7177 24.7265 25.6421 24.6487ZM6.5239 28.8067C6.4387 28.4786 6.40588 28.7532 6.34072 28.6843C6.40837 28.9434 6.49148 28.8496 6.5239 28.8067ZM21.5631 25.7739C21.426 25.4272 21.6 24.9565 21.7019 25.1772C21.7513 25.3986 21.5824 25.8212 21.5631 25.7739ZM11.8221 27.5277C11.764 27.2688 11.7191 27.6047 11.7673 27.7228C11.7979 27.7979 11.858 27.6886 11.8221 27.5277ZM21.8632 25.3022C21.8713 25.2179 21.9804 25.4628 21.9923 25.6232C22.0075 25.8288 21.8615 25.3262 21.8632 25.3022ZM24.0054 24.6481C23.9867 24.6106 23.8979 24.9065 24.0111 25.1596C24.0897 25.3355 24.0196 24.9584 24.029 24.9553C24.0401 24.9543 24.3637 25.3673 24.0054 24.6481ZM20.0653 25.8433C20.0989 25.7324 20.1879 25.8351 20.243 25.8164C20.2528 25.9819 20.1318 26.0522 20.0653 25.8433ZM12.2276 27.3726C12.193 27.2702 11.8227 27.2797 12.0917 27.5619C12.1073 27.5778 12.3323 27.6828 12.2276 27.3726ZM27.3395 24.273C27.3282 24.2722 27.3133 24.2623 27.2937 24.2396C27.31 24.2468 27.326 24.2619 27.3395 24.273ZM26.3683 24.4301C26.3492 24.2369 26.2405 24.2064 26.232 24.313C26.2702 24.546 26.371 24.4571 26.3683 24.4301ZM20.1935 25.5516C20.204 25.4367 20.2867 25.5402 20.3244 25.5193C20.3535 25.6966 20.244 25.7274 20.1935 25.5516ZM17.8655 25.8201C17.9515 25.9114 18.0213 25.8471 17.9786 25.6317C17.9868 25.665 17.9972 25.7001 18.0098 25.7349C18.0223 25.7694 18.0712 25.6552 18.1163 25.7225C18.3855 26.122 17.4724 26.1207 17.8565 25.4095C17.8595 25.5464 17.8625 25.6832 17.8655 25.8201ZM14.8543 26.3708C14.7642 26.1164 14.7283 26.4656 14.776 26.5633C14.809 26.6301 14.9449 26.627 14.8543 26.3708ZM16.2355 25.9276C16.215 25.8831 16.152 26.087 16.1776 26.2255C16.2649 26.3591 16.3298 26.1346 16.2355 25.9276ZM14.5095 26.1216C14.4784 26.0868 14.5352 26.5152 14.5416 26.533C14.5965 26.6824 14.5962 26.3489 14.5095 26.1216ZM26.9318 23.171C26.8729 23.0571 26.8259 23.385 26.8589 23.6688C26.8435 23.6158 26.8172 23.5479 26.7782 23.468C26.7782 23.4679 26.7783 23.4679 26.7784 23.4679C26.7258 23.3613 25.8173 23.4183 26.5194 23.8346C26.5415 23.848 26.4651 23.6029 26.5496 23.6316C26.5552 23.6338 26.5994 23.8377 26.6168 23.8445C26.6567 23.8588 26.8717 23.949 26.8762 23.7767C26.8842 23.8146 26.894 23.8501 26.906 23.8821C27.0126 24.1674 26.9774 23.2588 26.9318 23.171ZM16.427 25.8496C16.3913 25.778 16.342 25.8629 16.3722 26.0447C16.4219 26.1266 16.5099 26.0167 16.427 25.8496ZM12.0656 26.6348C11.9942 26.4948 11.9464 26.7934 12.008 26.9344C12.0458 27.0212 12.1478 26.7954 12.0656 26.6348ZM15.806 26.0765C16.0855 26.2416 15.8588 26.0478 15.841 25.7759C15.8293 25.8761 15.8177 25.9763 15.806 26.0765ZM28.1635 23.6313C28.1135 23.5781 28.0513 23.0471 28.1505 23.3219C28.1818 23.4092 28.1913 23.6601 28.1635 23.6313ZM29.83 23.1225C29.7035 22.6662 29.9159 22.9062 29.9194 23.2361C29.9188 23.2474 29.8359 23.1396 29.83 23.1225ZM28.6038 23.1756C28.6425 23.4959 28.6335 23.5367 28.5457 23.4735C28.6341 23.363 28.4785 23.1044 28.6038 23.1756ZM17.971 25.5979C17.974 25.6106 17.9763 25.6199 17.9786 25.6317C17.9758 25.6202 17.9734 25.6092 17.971 25.5979ZM14.3043 26.2489C14.2204 25.988 14.1416 26.0245 14.221 26.2882C14.2285 26.3126 14.3325 26.4486 14.3043 26.2489ZM26.8589 23.6688C26.8726 23.7158 26.8769 23.7472 26.8762 23.7767C26.8686 23.7411 26.8634 23.7071 26.8589 23.6688ZM14.7046 25.9407C14.7423 26.1405 14.8841 26.1922 14.8844 26.1678C14.8863 25.8077 14.7542 25.9181 14.7046 25.9407ZM11.1751 26.5247C11.1729 26.5468 11.3196 27.0524 11.3043 26.8457C11.2923 26.6854 11.1834 26.4406 11.1751 26.5247ZM28.8221 22.9974C28.862 22.9896 28.9182 22.9779 28.9783 23.22C28.944 23.1879 28.8578 23.1767 28.8221 22.9974ZM29.7002 22.7997C29.7116 23.0965 29.6037 23.1176 29.5252 23.0843C29.4469 22.7067 29.6741 22.8976 29.7002 22.7997ZM27.0688 23.2898C27.0624 23.2751 26.9393 23.1828 27.0046 23.4329C27.1002 23.7998 27.1251 23.4216 27.0688 23.2898ZM11.4251 26.7579C11.4344 26.5746 11.2222 26.0602 11.2593 26.4834C11.2782 26.7001 11.4235 26.7887 11.4251 26.7579ZM13.9745 25.9521C13.9453 26.1105 14.1448 26.3415 14.1114 26.0728C14.0798 26.0571 13.9849 25.896 13.9745 25.9521ZM15.9296 25.2749C15.5879 24.55 15.973 25.921 15.9811 25.7919C15.9822 25.7735 15.9378 25.2919 15.9296 25.2749ZM5.31867 27.6333C5.31393 27.7447 5.49045 28.1086 5.45162 27.8533C5.42722 27.6935 5.32175 27.5623 5.31867 27.6333ZM18.8333 25.1992C18.8259 25.2033 18.8186 25.2074 18.8114 25.2111C18.8146 25.1975 18.8214 25.1919 18.8333 25.1992ZM13.23 25.0396C13.5806 26.0899 13.3976 25.2626 13.4099 25.2648C13.4369 25.2714 13.5535 25.5509 13.5901 25.4937C13.5617 25.6258 13.5333 25.7579 13.5049 25.89C13.5627 25.9592 14.008 26.2814 13.98 26.1052C13.9402 25.8542 13.8415 25.9556 13.8337 25.9344C13.8225 25.9042 13.6636 25.2163 13.6476 25.1922C13.6215 25.1537 13.3139 25.2015 13.23 25.0396ZM15.5647 25.4737C15.6114 25.5498 15.6758 25.8221 15.6763 25.7537C15.6765 25.7304 15.624 25.4689 15.6264 25.398C15.6058 25.4232 15.5853 25.4485 15.5647 25.4737ZM13.1929 26.0558C13.0907 25.744 13.2817 25.8314 13.2943 25.866C13.3669 26.0767 13.2763 26.3104 13.1929 26.0558ZM14.5944 25.7217C14.5846 25.7043 14.4366 25.6306 14.4737 25.8076C14.535 25.9358 14.7138 25.9403 14.5944 25.7217ZM15.6427 25.3761C15.6938 25.3974 15.8322 25.6433 15.7423 25.2518C15.7422 25.2518 15.7422 25.2518 15.7421 25.2518C15.709 25.2932 15.6758 25.3347 15.6427 25.3761ZM11.4089 25.8957C11.198 25.2859 11.3988 26.0698 11.5137 26.2569C11.4786 25.971 11.4433 25.9949 11.4089 25.8957ZM11.0476 25.4827C11.0015 25.3746 10.7883 25.5468 10.8923 25.871C10.9293 25.9865 11.0056 25.6605 11.0166 25.6822C11.0331 25.7142 11.0641 26.09 11.1224 26.0024C11.0928 25.8789 11.0632 25.5187 11.0476 25.4827ZM11.2583 25.5084C11.0785 25.0487 11.2391 25.9315 11.3018 25.9212C11.3264 25.9178 11.2841 25.5748 11.2583 25.5084ZM11.611 25.5145C11.5643 25.4372 11.4603 25.3318 11.4654 25.6353C11.5435 25.6453 11.6216 25.6554 11.6998 25.6655C11.6744 25.4981 11.652 25.5825 11.6108 25.5146C11.6109 25.5146 11.611 25.5146 11.611 25.5145ZM29.7375 20.4462C29.621 20.2103 29.7528 20.0839 29.7717 20.1439C29.8321 20.3433 29.7895 20.5515 29.7375 20.4462ZM3.17773 19.7521C3.13923 19.6564 3.06064 19.3319 3.05542 19.5114C3.14501 19.7445 3.2346 19.9776 3.32419 20.2107C3.24283 19.6513 3.22001 19.8576 3.17773 19.7521ZM2.61157 17.763C2.61454 17.7484 2.41001 16.9044 2.59945 17.4571C2.7274 17.8303 2.53278 18.2591 2.40703 17.892C2.42532 17.7058 2.58472 17.8822 2.61157 17.763ZM1.38679 14.1789C1.36985 14.1117 1.45244 13.9913 1.4741 14.0366C1.588 14.2759 1.47776 14.5387 1.38679 14.1789ZM1.74807 14.2743C1.66616 14.119 1.75134 13.9907 1.80257 14.0793C1.83793 14.2369 1.76043 14.2968 1.74807 14.2743ZM26.5617 8.26597C26.3917 7.69869 26.5986 8.95231 26.6279 8.68527C26.6293 8.6727 26.5697 8.29382 26.5617 8.26597ZM1.31248 13.3006C1.3944 13.4559 1.30922 13.5841 1.25799 13.4956C1.22279 13.3381 1.30021 13.2779 1.31248 13.3006ZM26.2443 6.89672C26.0902 6.49499 26.3991 7.88576 26.4193 7.94024C26.5003 8.15508 26.5109 7.58231 26.5082 7.44103C26.3677 7.68783 26.3169 7.08604 26.2443 6.89672ZM26.0954 7.8001C26.0614 7.96211 26.2839 8.21338 26.2359 7.81788C26.2077 7.84302 26.1049 7.75332 26.0954 7.8001ZM25.6137 7.43208C25.5689 7.38914 25.4416 7.29042 25.4692 7.51355C25.4988 7.4661 25.6452 7.66103 25.6137 7.43208ZM25.4012 6.78999C25.2863 6.50261 25.4506 7.3747 25.4602 7.10303C25.4605 7.09251 25.4066 6.80618 25.4012 6.78999ZM25.0333 6.53809C24.9273 6.19955 25.0585 7.04983 25.1206 7.06081C25.1388 7.06252 25.0451 6.57696 25.0333 6.53809ZM25.8513 5.41285C25.7703 5.27473 25.8278 5.89106 25.9497 5.93517C25.9304 6.03508 25.9111 6.13498 25.8918 6.23488C26.1028 6.54392 25.9218 5.70982 25.9697 5.73607C26.0367 5.77358 26.1729 6.46455 26.2056 6.68357C26.1661 6.25128 26.3633 6.20404 26.4616 6.10015C26.3246 5.94328 26.0982 5.66905 25.9758 5.57693C25.9408 5.55018 25.9518 5.74505 25.9233 5.72882C25.8773 5.70179 25.8562 5.42227 25.8515 5.41281C25.8515 5.41282 25.8514 5.41284 25.8513 5.41285ZM24.6313 6.60706C24.4472 6.23663 24.6855 7.06884 24.7136 6.90603C24.7138 6.89391 24.6358 6.6161 24.6313 6.60706ZM0.650312 10.759C0.861652 11.0841 0.855934 11.5732 1.00225 10.8024C0.982521 11.331 1.06932 11.166 1.08684 11.374C1.10044 11.5386 1.00149 11.4201 1.10923 11.7353C0.982528 11.3942 0.764166 11.5402 0.741881 11.4852C0.741981 11.4851 0.742081 11.4851 0.74218 11.4851C0.728892 11.4525 0.582951 10.6556 0.650312 10.759ZM25.1623 5.22084C24.9184 4.20185 25.2368 5.83324 24.995 4.99676C25.1558 6.25024 25.2465 4.94569 25.5006 5.98031C25.104 5.93492 25.957 6.96378 25.3791 5.45527C25.7084 5.97839 25.4097 5.24761 25.4022 5.04192C25.3943 4.82279 25.5622 5.02846 25.4781 4.64752C25.478 4.64753 25.478 4.64754 25.4779 4.64756C25.4094 4.68939 25.3409 4.73122 25.2723 4.77305C25.5128 5.58274 25.3113 5.36635 25.123 4.70505C25.1361 4.87698 25.1492 5.04891 25.1623 5.22084ZM25.7388 5.90945C25.7277 5.89205 25.5903 6.04041 25.6345 6.20377C25.6775 6.30493 25.88 6.13182 25.7388 5.90945ZM26.4102 5.58495C26.352 5.59472 26.2299 5.4521 26.2618 5.76938C26.32 5.75969 26.4422 5.90241 26.4102 5.58495ZM23.4234 6.13262C23.4018 6.40274 23.6439 6.43208 23.5167 6.14332C23.5106 6.12975 23.4246 6.11997 23.4234 6.13262ZM25.0265 5.41014C24.8877 5.11183 25.1266 6.10272 25.129 5.83132C25.1291 5.81533 25.0328 5.42374 25.0265 5.41014ZM0.738447 10.6147C0.693597 10.3691 0.930689 10.4997 0.966075 10.4903C0.992068 10.7217 0.789859 10.8962 0.738447 10.6147ZM26.3254 4.64937C26.0311 3.7935 26.0822 4.84094 26.0606 4.82223C26.039 4.80309 25.9873 4.41327 25.9813 4.40375C25.9681 4.384 25.7935 4.45318 25.7902 4.48172C25.7882 4.50386 25.9311 5.03734 25.9284 5.21511C25.9387 4.89332 26.309 5.01781 26.314 4.95445C26.3176 4.90394 26.1016 4.35718 26.3252 4.64941C26.3252 4.6494 26.3253 4.64939 26.3254 4.64937ZM25.9938 4.71325C26.0853 4.93044 25.9641 4.98465 25.9164 4.90736C25.81 4.73429 25.9826 4.6876 25.9938 4.71325ZM25.6461 4.56683C25.6212 4.519 25.481 4.49953 25.5213 4.75387C25.6499 5.06823 25.7031 4.67846 25.6461 4.56683ZM24.1976 4.89744C24.1702 4.93667 24.0373 4.76201 24.0769 4.98336C24.1043 4.9443 24.2372 5.11881 24.1976 4.89744ZM1.03594 8.5517C0.941926 8.37891 1.05732 8.27696 1.11349 8.35757C1.14552 8.50408 1.04397 8.56655 1.03594 8.5517ZM24.5844 3.3066C24.5506 3.24372 24.1744 3.49452 24.1378 3.6094C24.2281 3.76449 24.6374 3.69439 24.6392 3.60933C24.6397 3.58389 24.5891 3.31662 24.5844 3.3066ZM25.4511 3.02403C25.4225 2.692 25.5264 3.07602 25.5322 3.07993C25.5888 3.12008 25.6704 3.02728 25.7129 3.34399C25.6051 3.23469 25.5075 3.68342 25.4511 3.02403ZM23.8692 3.4357C23.7544 3.58448 24.0917 3.87164 23.9875 3.53975C23.981 3.51972 23.881 3.42013 23.8692 3.4357ZM24.611 3.20274C24.5883 2.93438 25.0448 3.07673 25.1108 3.06369C25.1503 3.55914 25.0279 3.20165 24.9536 3.24247C24.9337 3.25405 24.9804 3.454 24.9782 3.45479C24.943 3.47165 24.9234 3.23373 24.8998 3.23486C24.8851 3.23621 24.643 3.58083 24.611 3.20274ZM25.4267 2.79495C25.4118 2.60433 25.6519 2.47282 25.6723 2.52013C25.8243 2.87191 25.4598 2.85562 25.4267 2.79495ZM24.4857 2.78063C24.4153 2.20981 24.6958 2.54451 24.6134 2.85303C24.6053 2.88123 24.4992 2.64919 24.4857 2.78063ZM23.775 2.89767C23.7648 2.88254 23.5966 2.79985 23.6305 2.97914C23.6656 3.04433 23.8901 3.06349 23.775 2.89767ZM23.727 2.27776C23.7244 2.28276 23.8287 2.62011 23.7517 2.59037C23.7452 2.58742 23.6556 2.20222 23.5989 2.36147C23.5875 2.39422 23.6128 2.65596 23.618 2.67149C23.8311 3.26122 23.8622 2.04219 23.727 2.27776ZM25.3674 2.48012C25.3203 2.31944 25.2546 1.82735 25.3348 2.06699C25.3693 2.17048 25.4047 2.46662 25.3674 2.48012ZM23.2824 2.83465C23.3068 2.52312 23.0304 2.52152 23.0322 2.5996C23.0781 2.78119 23.2798 2.86511 23.2824 2.83465ZM0.704852 6.25279C0.704785 6.2528 0.704718 6.25282 0.704652 6.25283C0.789283 6.30504 0.795203 6.55885 0.800098 6.56586C1.02472 6.89463 0.871528 6.34827 0.881845 6.278C0.903722 6.12612 1.03304 6.80215 1.06162 6.50511C1.00434 6.94684 1.09781 6.7475 1.15073 6.9866C1.36621 7.96245 0.868917 6.56655 0.840225 6.78615C0.836191 6.81657 0.97246 7.11425 0.965405 7.20827C0.942268 7.513 0.380286 6.05334 0.704852 6.25279ZM25.3492 2.01946C25.3235 1.72516 25.6304 1.95313 25.6124 2.20356C25.6095 2.24372 25.3863 2.44852 25.3492 2.01946ZM13.5862 3.97569C13.5955 3.71456 13.3966 3.45036 13.4103 3.64934C13.4172 3.74846 13.5821 4.0903 13.5862 3.97569ZM12.3929 3.11006C12.3319 3.17514 12.4682 4.22836 12.5242 4.04919C12.53 4.02966 12.4305 3.25236 12.3929 3.11006ZM17.189 2.6876C17.0389 2.33189 17.1838 3.02013 17.2366 2.99925C17.2552 2.99199 17.1938 2.69886 17.189 2.6876ZM14.3623 3.35679C14.35 3.33426 14.2728 3.39583 14.3082 3.55357C14.3594 3.64211 14.4443 3.51209 14.3623 3.35679ZM17.1927 2.58469C17.1738 2.7179 17.3515 3.20084 17.3062 2.70271C17.2869 2.74826 17.1947 2.57107 17.1927 2.58469ZM24.0212 1.28906C24.0419 1.57958 23.9197 1.51543 23.8695 1.57632C23.7883 1.21102 23.9917 1.36429 24.0212 1.28906ZM12.781 3.46558C12.7662 3.73775 12.9541 3.91977 12.8711 3.58095C12.8655 3.56277 12.7815 3.45402 12.781 3.46558ZM19.5662 2.06176C19.5617 2.29047 19.7776 2.55277 19.6563 2.17713C19.651 2.16189 19.5664 2.04905 19.5662 2.06176ZM20.2731 2.04952C20.2208 1.98335 20.0665 2.03845 20.1718 2.23919C20.1881 2.27002 20.3111 2.2504 20.2731 2.04952ZM0.832228 6.01321C0.735364 5.6407 0.870195 5.70658 0.900302 5.76901C0.912438 5.79505 0.958319 6.49786 0.832228 6.01321ZM16.6929 2.72745C16.664 2.78243 16.5457 2.71328 16.5684 2.91445C16.6072 2.86393 16.7859 3.11843 16.6929 2.72745ZM13.0888 3.40098C12.9465 3.00375 12.8542 3.06464 12.9881 3.59426C13.0918 3.53579 12.8764 3.11646 13.0888 3.40098ZM17.3513 2.09356C17.314 2.06865 17.395 2.58698 17.4034 2.61045C17.4839 2.83379 17.4228 2.28708 17.3513 2.09356ZM15.1166 2.98939C15.0701 2.77032 14.9913 2.89013 15.0333 3.02867C15.0473 3.0752 15.1543 3.16669 15.1166 2.98939ZM22.6973 1.42895C22.6111 1.23792 22.7099 1.01381 22.7986 1.23928C22.8872 1.57214 22.7077 1.45079 22.6973 1.42895ZM18.2351 2.0471C18.1733 1.7205 18.0559 1.93622 18.172 2.19371C18.201 2.25813 18.2557 2.15632 18.2351 2.0471ZM19.6389 1.3541C19.6142 1.76364 20.1069 1.95036 19.8935 1.4898C19.8783 1.45699 19.6413 1.31946 19.6389 1.3541ZM20.4012 1.4513C20.3745 1.41216 20.1604 0.316037 20.3206 0.722884C20.3415 0.775624 20.3549 1.07419 20.3764 1.13873C20.3887 1.17549 20.5815 1.29628 20.5837 1.26921C20.5858 1.23857 20.5048 0.889758 20.5049 0.848764C20.5051 0.802933 20.6673 1.09078 20.72 1.08354C20.8192 1.06933 20.7702 0.775245 20.7781 0.772639C20.8011 0.765929 20.8827 0.965179 20.9302 0.955242C21.169 0.904122 21.4845 0.582049 21.8004 1.1623C21.5809 0.948176 21.4738 1.24468 21.3224 1.36007C21.2473 0.740682 21.171 1.87997 21.2009 1.1415C21.1522 1.31029 20.4872 1.57292 20.4014 1.45126C20.4013 1.45127 20.4013 1.45129 20.4012 1.4513ZM12.0487 2.86077C12.0163 2.4782 11.8085 2.60812 11.8775 3.04427C11.9194 3.0982 12.0519 2.90423 12.0487 2.86077ZM12.901 1.73783C12.9087 1.66908 12.7796 0.934707 12.9647 1.28275C12.9648 1.28273 12.9649 1.28271 12.965 1.28269C13.0191 1.38433 13.0189 1.56973 13.0377 1.63194C13.0451 1.6574 13.2191 2.00033 13.148 2.07567C13.0398 2.19111 13.0254 1.53478 12.9563 1.54081C12.9479 1.54189 12.9008 1.96325 12.9259 2.04852C12.9288 2.05847 12.9501 1.967 12.9638 2.00178C13.0154 2.13248 13.0503 2.36292 13.0559 2.37308C13.0726 2.39864 13.1953 1.96892 13.2939 2.30226C13.3258 2.40974 13.0457 2.72975 13.0212 2.67549C13.0057 2.64131 12.8801 2.00755 12.8589 1.94701C12.8483 1.91689 12.7633 2.1813 12.7341 2.12663C12.7256 2.11082 12.7181 2.09346 12.7122 2.07908C12.7724 2.27083 12.6487 2.28134 12.6074 2.0596C12.5918 1.97231 12.6851 2.00564 12.6912 2.02022C12.6938 2.02638 12.6967 2.03501 12.699 2.04091C12.6332 1.80572 12.9168 1.75912 12.7836 1.41627C12.8255 1.20504 12.8783 1.93974 12.901 1.73783ZM13.2135 1.26734C13.2186 1.33563 13.2238 1.40393 13.2289 1.47222C13.3385 1.28015 13.5686 1.56705 13.7327 1.53112C13.7744 1.52248 13.6433 1.1251 13.7207 1.22521C13.7828 1.30544 13.9083 1.67322 13.9016 1.76229C13.9001 1.78448 13.7607 1.55669 13.7212 1.59104C13.6045 1.69267 13.709 2.03506 13.7032 2.04606C13.6967 2.05772 13.5637 1.82908 13.5206 1.84926C13.4124 1.90075 13.4041 2.12575 13.1913 1.8774C13.2342 1.62895 13.083 1.13904 13.2135 1.26734ZM18.6882 0.925694C18.6488 0.704803 18.782 0.880747 18.8094 0.841544C18.8489 1.06296 18.7155 0.886471 18.6882 0.925694ZM4.70368 3.47972C4.74851 3.84623 4.98186 3.89167 4.86396 3.60307C4.83783 3.53901 4.73124 3.47677 4.70368 3.47972ZM5.7149 3.50201C5.72335 3.39643 5.55452 3.16039 5.61165 3.43948C5.63007 3.52896 5.71384 3.51574 5.7149 3.50201ZM15.1318 1.24585C15.135 1.23345 15.2305 1.29763 15.2367 1.31548C15.3673 1.68774 15.0616 1.51953 15.1318 1.24585ZM6.79931 2.81841C6.74719 3.07526 7.07002 3.11616 6.91631 2.83356C6.90872 2.81982 6.80179 2.80594 6.79931 2.81841ZM7.20553 2.66686C7.18407 2.68443 7.05336 2.58883 7.07439 2.69917C7.10846 2.87716 7.25543 2.97356 7.20553 2.66686ZM17.0944 0.726835C16.9999 0.322824 17.2035 0.601862 17.242 0.540707C17.3366 0.944992 17.1329 0.665539 17.0944 0.726835ZM16.1445 0.608446C16.6728 0.167067 16.719 1.06199 16.1495 0.813605C16.0956 0.55305 16.1112 0.636259 16.1445 0.608446ZM16.9145 0.501612C16.946 0.766348 16.8628 0.702894 16.813 0.691325C16.7843 0.508655 16.8912 0.555099 16.9145 0.501612ZM4.33369 2.97377C4.30387 2.63731 4.5514 3.00913 4.54975 3.15075C4.5489 3.18144 4.3569 3.15741 4.33369 2.97377ZM15.1107 0.887958C15.0163 0.495564 15.2274 0.620429 15.2589 0.705417C15.3859 1.04723 15.1073 0.797786 15.1107 0.887958ZM17.866 0.2073C17.8344 -0.10868 17.9563 0.0323114 18.0146 0.0246983C18.0424 0.294735 17.916 0.202922 17.866 0.2073ZM17.4015 0.0493956C17.4027 0.0367775 17.4886 0.0483751 17.4951 0.0618944C17.6224 0.350854 17.3798 0.319674 17.4015 0.0493956ZM0.00026083 3.30004C0.000899076 3.28952 0.0656533 3.29688 0.0701425 3.30809C0.184945 3.59424 -0.00970817 3.57067 0.00026083 3.30004Z"
                  fill="#F893BB"
                />
              </svg>
              <NuxtImg src="check.png" class="z-10 relative" />
            </div>

            <h3 class="text-stone-900 text-lg font-bold">{{ situation }}</h3>
          </div>
        </div>

        <!-- Right Content -->
        <div class="flex-1 flex flex-col items-end gap-4 sm:text-right">
          <h2 class="text-stone-900 text-5xl max-w-lg">
            We help homeowners in all situations.
          </h2>
          <p class="text-stone-900 text-base max-w-md">
            Fill out our quick form or call us. We'll review your property
            details — no obligations, no pushy sales talk.
          </p>
          <button
            class="px-4 py-2 bg-pink-600 text-white rounded-full font-semibold text-sm uppercase hover:bg-pink-600/90"
            @click="isOfferDialogOpen = true"
          >
            Get my offer
          </button>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="px-8 sm:px-48 py-6 sm:py-28 bg-white">
      <div class="container mx-auto flex flex-col items-center gap-6">
        <h2 class="text-stone-900 text-5xl text-center">
          Real Homeowners. Real Stories.
        </h2>

        <!-- Rating Badge -->
        <div class="card-base h-16 flex items-center gap-4">
          <div class="flex gap-0.5">
            <div
              v-for="i in 5"
              :key="i"
              class="w-5 h-5 bg-yellow-500 rounded-sm"
            />
          </div>
          <span class="text-stone-900 text-4xl font-bold">4.9</span>
          <span class="text-stone-900 text-base">from 100+ reviews</span>
        </div>

        <!-- Testimonial Cards -->
        <div class="md:grid grid-cols-3 gap-6 w-full space-y-6">
          <div
            v-for="testimonial in testimonials"
            :key="testimonial.name"
            class="card-base flex flex-col justify-between gap-6"
          >
            <div class="flex gap-0.5">
              <div
                v-for="i in 5"
                :key="i"
                class="w-5 h-5 bg-yellow-500 rounded-sm"
              />
            </div>
            <p class="text-stone-900/80 text-xl leading-8">
              {{ testimonial.quote }}
            </p>
            <div
              class="border-t border-zinc-900/40 pt-3 flex items-center gap-5"
            >
              <NuxtImg :src="`testimonials/${testimonial.image}`" />
              <div>
                <p class="text-stone-900 text-lg font-bold">
                  {{ testimonial.name }}
                </p>
                <p class="text-stone-900/60 text-sm font-medium">
                  {{ testimonial.location }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Form Section -->
    <section class="py-16 gradient-footer">
      <div class="container mx-auto max-w-4xl sm:flex gap-20 items-center px-8">
        <!-- Left Content -->
        <div class="flex-1 py-4 flex flex-col justify-between gap-8">
          <div class="flex flex-col gap-4">
            <h2 class="text-white text-4xl font-semibold leading-10">
              Ready to see what your home is worth today?
            </h2>
            <p class="text-white/80 text-base">
              No obligations. No pressure. Just a fair, fast offer.
            </p>
          </div>
          <p class="text-white/50 text-xs">
            Your privacy matters. We'll never share or sell your information.
          </p>
        </div>

        <!-- Right Form -->
        <form
          @submit.prevent="onSubmitContact"
          class="flex-1 flex flex-col gap-3"
        >
          <input
            v-model="contactFormData.name"
            type="text"
            placeholder="NAME"
            required
            class="px-4 py-2 bg-pink-600/25 text-white placeholder:text-white/50 rounded-full text-xs uppercase"
          />
          <input
            v-model="contactFormData.contact"
            type="text"
            placeholder="PHONE/EMAIL"
            required
            class="px-4 py-2 bg-pink-600/25 text-white placeholder:text-white/50 rounded-full text-xs uppercase"
          />
          <input
            v-model="contactFormData.address"
            type="text"
            placeholder="PROPERTY ADDRESS"
            required
            class="px-4 py-2 bg-pink-600/25 text-white placeholder:text-white/50 rounded-full text-xs uppercase"
          />
          <textarea
            v-model="contactFormData.message"
            placeholder="TELL US ABOUT YOUR HOME"
            rows="4"
            class="px-4 py-3 bg-pink-600/25 text-white placeholder:text-white/50 rounded-3xl text-xs uppercase resize-none"
          />
          <button
            type="submit"
            class="px-4 py-2 rounded-full border-2 border-pink-600 text-pink-600 font-semibold text-sm uppercase hover:bg-pink-600/10"
          >
            Submit
          </button>
        </form>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-zinc-950">
      <div class="px-20 py-14 sm:flex justify-between items-start space-y-8">
        <!-- Left Footer -->
        <div class="flex flex-col gap-8">
          <div class="flex items-center gap-4">
            <NuxtImg src="/logo.svg" />
            <NuxtImg src="/name.svg" />
          </div>
        </div>

        <!-- Right Footer -->
        <div class="flex flex-col gap-6">
          <button class="btn-gradient" @click="isOfferDialogOpen = true">
            Get my offer
          </button>
        </div>
      </div>

      <!-- Copyright -->
      <div class="px-2.5 py-4 border-t border-white/10 text-center">
        <p class="text-white/50 text-base">
          Copyright 2025. | Website by Happy Dog Web Productions | Terms of
          Service | Privacy Policy
        </p>
      </div>
    </footer>

    <!-- Offer Request Dialog -->
    <Dialog v-model:open="isOfferDialogOpen">
      <DialogScrollContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Get Your Cash Offer</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll get back to you with a fair cash
            offer for your property.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="onSubmitOffer" class="space-y-6">
          <!-- Personal Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Personal Information</h3>

            <div class="space-y-2">
              <Label>Full Name *</Label>
              <Input
                v-model="formData.name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  v-model="formData.phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  v-model="formData.email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Property Address -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Property Address</h3>

            <div class="space-y-2">
              <Label>Street Address *</Label>
              <Input
                v-model="formData.address"
                type="text"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-2 sm:col-span-1">
                <Label>City *</Label>
                <Input
                  v-model="formData.city"
                  type="text"
                  placeholder="Simi Valley"
                  required
                />
              </div>

              <div class="space-y-2 sm:col-span-1">
                <Label>State *</Label>
                <Select v-model="formData.state" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent class="max-h-[300px]">
                    <SelectItem
                      v-for="state in US_STATES"
                      :key="state.value"
                      :value="state.value"
                    >
                      {{ state.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2 sm:col-span-1">
                <Label>ZIP Code *</Label>
                <Input
                  v-model="formData.zip"
                  type="text"
                  placeholder="93065"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Property & Selling Details -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Property & Selling Details</h3>

            <div class="space-y-2">
              <Label>Condition of Property *</Label>
              <Select v-model="formData.propertyCondition" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="condition in PROPERTY_CONDITIONS"
                    :key="condition.value"
                    :value="condition.value"
                  >
                    {{ condition.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Reason for Selling *</Label>
              <Select v-model="formData.reasonForSelling" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="reason in SELLING_REASONS"
                    :key="reason.value"
                    :value="reason.value"
                  >
                    {{ reason.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>How Soon Do You Want to Move? *</Label>
              <Select v-model="formData.moveTimeline" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="timeline in MOVE_TIMELINES"
                    :key="timeline.value"
                    :value="timeline.value"
                  >
                    {{ timeline.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Desired Offer Amount *</Label>
              <Input
                v-model="formData.desiredOffer"
                type="text"
                placeholder="$500,000"
                required
              />
              <p class="text-sm text-muted-foreground">
                Enter your desired cash offer amount or "Market Value" if unsure
              </p>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Additional Information</h3>

            <div class="space-y-2">
              <Label>Comments or Questions (Optional)</Label>
              <Textarea
                v-model="formData.inquiry"
                placeholder="Tell us anything else we should know about your property or situation..."
                class="min-h-[100px]"
              />
            </div>
          </div>

          <!-- Disclaimer -->
          <div class="bg-muted p-4 rounded-lg">
            <p class="text-sm text-muted-foreground">
              <strong>Privacy Guarantee:</strong> We respect your privacy and
              will never sell, rent, or share your personal information with
              third parties. Your information will only be used to provide you
              with a fair cash offer for your property.
            </p>
          </div>

          <!-- Submit Buttons -->
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              @click="isOfferDialogOpen = false"
              class="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" class="w-full sm:w-auto">
              Submit Request
            </Button>
          </div>
        </form>
      </DialogScrollContent>
    </Dialog>
    <Toaster />
  </div>
</template>
