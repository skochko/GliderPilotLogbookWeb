<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import LandingNav from '@/components/landing/LandingNav.vue'
import LandingScreenshotFrame from '@/components/landing/LandingScreenshotFrame.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { useLanding } from '@/composables/useLanding'

const { fetchLanding, screenshotFor } = useLanding()

const badges = ['Google Sheets sync', 'Mobile friendly', 'Your data are secure']

const features = [
  {
    title: 'Club Flight Import',
    description:
      'Participating clubs can add missing flights from their accounting system into your spreadsheet — only with your consent.',
  },
  {
    title: 'Digital Logbook',
    description:
      'View, add, and edit flights in a clean interface built for glider pilots. Manual entries always stay available.',
  },
  {
    title: 'Google Sheets Sync',
    description: 'Every change is written to your spreadsheet — the logbook you own in Google Drive.',
  },
  {
    title: 'Medical Tracking',
    description: 'Keep medical certificate dates visible alongside your flying summary.',
  },
  {
    title: 'Legality Tracking',
    description: 'See currency and qualification status on your dashboard at a glance.',
  },
  {
    title: 'Statistics',
    description: 'Track totals, trends, and monthly activity without manual spreadsheet work.',
  },
  {
    title: 'Privacy First',
    description: 'Your spreadsheet stays in Google Drive. We cache data only to keep the app fast.',
  },
]

const steps = [
  {
    title: 'Continue with Google',
    description: 'Use your existing Google account — no separate password to manage.',
  },
  {
    title: 'Connect your logbook',
    description: 'Link an existing Glider Pilot Logbook spreadsheet or create a new one.',
  },
  {
    title: 'Fly and review',
    description:
      'Log flights, check legality and currency, and optionally request club import where your club is onboarded.',
  },
]

const faqItems = [
  {
    question: 'Where is my flight data stored?',
    answer:
      'The official copy is in your Google Spreadsheet. We keep a temporary synced cache on our servers for speed, which is removed when you disconnect.',
  },
  {
    question: 'Can my club add flights automatically?',
    answer:
      'Participating clubs can import flight records into your spreadsheet with your consent. Manual entries always remain available.',
  },
  {
    question: 'Do I need a separate username and password?',
    answer: 'No. Sign in uses Google OAuth only.',
  },
  {
    question: 'What happens if I disconnect my logbook?',
    answer:
      'Your spreadsheet and flight data remain in Google Drive. Disconnecting removes the link between the app and that spreadsheet and deletes our cached copy.',
  },
]

onMounted(() => {
  void fetchLanding()
})
</script>

<template>
  <div class="landing-page min-h-screen">
    <LandingNav />

    <main>
      <!-- Hero -->
      <section class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="mx-auto max-w-3xl text-center">
            <h1 class="text-[2.125rem] font-semibold tracking-tight text-landing-text sm:text-[2.625rem]">
              Glider Pilot Logbook
            </h1>
            <p class="mt-3 text-lg text-landing-secondary sm:text-xl">
              The digital ecosystem connecting glider pilots and clubs
            </p>
            <p class="mt-5 text-base font-medium leading-relaxed text-landing-text sm:text-lg">
              Automate flight records. Bridge club systems and personal logbooks. Keep your flying
              history up to date.
            </p>
            <p class="mt-5 text-base leading-relaxed text-landing-secondary sm:text-lg">
              Glider Pilot Logbook is more than a digital logbook. It connects pilots, participating
              clubs and flight data — reducing manual copying while your
              <strong class="font-semibold text-landing-text">Google Spreadsheet</strong> remains the
              official record.
            </p>
            <p class="mt-4 text-sm leading-relaxed text-landing-muted sm:text-base">
              Where clubs are onboarded, flights can import into your logbook with your consent. You
              stay the owner of your data and can add or edit entries at any time.
            </p>

            <div
              id="about-app"
              class="mt-8 rounded-2xl border border-landing-border bg-landing-card px-5 py-6 text-left shadow-sm sm:px-7"
            >
              <h2 class="text-lg font-semibold text-landing-text">Purpose of this application</h2>
              <p class="mt-3 text-sm leading-relaxed text-landing-secondary sm:text-base">
                Glider Pilot Logbook lets glider pilots:
              </p>
              <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-landing-secondary sm:text-base">
                <li>View, add, and edit flight entries through a fast web and mobile interface</li>
                <li>Keep the official record in Google Sheets on Google Drive (you remain the owner)</li>
                <li>See dashboard totals, medical dates, and legality / currency information</li>
                <li>
                  Optionally allow a participating gliding club to import missing flights into your
                  spreadsheet, only with your consent
                </li>
              </ul>
              <p class="mt-4 text-sm leading-relaxed text-landing-secondary sm:text-base">
                When you choose <strong class="font-semibold text-landing-text">Sign in with Google</strong>,
                you authorise Glider Pilot Logbook to access only the Google account and spreadsheet
                files needed to provide these features. See our
                <RouterLink to="/privacy" class="font-medium text-landing-primary hover:underline"
                  >Privacy Policy</RouterLink
                >
                and
                <RouterLink to="/help/google-drive-access" class="font-medium text-landing-primary hover:underline"
                  >Google Drive access</RouterLink
                >
                pages for details.
              </p>
            </div>

            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <RouterLink
                to="/login"
                class="inline-flex w-full items-center justify-center rounded-lg bg-landing-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-landing-primary-hover sm:w-auto"
              >
                Get started
              </RouterLink>
              <a
                href="#landing-preview"
                class="inline-flex w-full items-center justify-center rounded-lg border border-landing-border bg-landing-card px-5 py-3 text-sm font-medium text-landing-text transition hover:border-landing-primary/30 hover:bg-white sm:w-auto"
              >
                View demo
              </a>
            </div>

            <ul class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-landing-secondary">
              <li v-for="badge in badges" :key="badge" class="inline-flex items-center gap-2">
                <svg
                  class="h-4 w-4 text-landing-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ badge }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Club to logbook -->
      <section class="landing-section pt-0">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="mx-auto max-w-3xl text-center">
            <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">
              From club records to personal logbook — automatically
            </h2>
            <p class="mt-5 text-base leading-relaxed text-landing-secondary sm:text-lg">
              For most club flying, the flight is recorded in the club's system first. Traditionally,
              pilots and administrators spend hours copying that data between systems, spreadsheets and
              personal logbooks.
            </p>
            <p class="mt-4 text-base font-medium leading-relaxed text-landing-text sm:text-lg">
              Glider Pilot Logbook automates this handoff.
            </p>
            <p class="mt-3 text-sm leading-relaxed text-landing-muted sm:text-base">
              Participating clubs import missing flights into your spreadsheet — only with your approval.
            </p>
          </div>
        </div>
      </section>

      <!-- Product screenshot -->
      <section id="landing-preview" class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <p class="mb-8 text-center text-sm text-landing-muted">
            Below is a static screenshot of the signed-in pilot app — not part of this page.
          </p>
          <LandingScreenshotFrame
            browser-path="gliderpilotlogbook.co.uk/flights"
            :image-url="screenshotFor('product')?.image_url"
            :alt-text="screenshotFor('product')?.alt_text ?? 'Glider Pilot Logbook product screenshot'"
            caption="Flights, statistics, and settings in one pilot-focused interface."
          />
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">
              Built for pilots — with club automation when you need it
            </h2>
            <p class="mt-4 text-base text-landing-secondary sm:text-lg">
              Log flights yourself or let participating clubs fill the gaps. Your Google Spreadsheet
              stays the official record.
            </p>
          </div>

          <ul class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="feature in features"
              :key="feature.title"
              class="rounded-2xl border border-landing-border bg-landing-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 class="text-lg font-semibold text-landing-text">{{ feature.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-landing-secondary sm:text-base">
                {{ feature.description }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <!-- Google Sheets -->
      <section id="google-sheets" class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="grid items-center gap-10 rounded-3xl border border-landing-border bg-landing-card p-8 shadow-sm lg:grid-cols-2 lg:p-12">
            <div>
              <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">
                Your data stays in your Google account.
              </h2>
              <p class="mt-4 text-base leading-relaxed text-landing-secondary sm:text-lg">
                Glider Pilot Logbook connects to a spreadsheet in your Google Drive. You keep full
                ownership of your records, can export or share through Google at any time, and avoid
                vendor lock-in.
              </p>
              <p class="mt-4 text-base leading-relaxed text-landing-secondary sm:text-lg">
                Disconnecting removes our link and cached copy — your spreadsheet and flight history
                remain in Drive.
              </p>
            </div>
            <div class="rounded-2xl border border-landing-border bg-landing-bg p-6">
              <ul class="space-y-4 text-sm text-landing-secondary sm:text-base">
                <li class="flex gap-3">
                  <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-primary" aria-hidden="true" />
                  Spreadsheet remains yours in Google Drive
                </li>
                <li class="flex gap-3">
                  <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-primary" aria-hidden="true" />
                  Writes go to Google Sheets; reads are fast via cache
                </li>
                <li class="flex gap-3">
                  <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-primary" aria-hidden="true" />
                  Optional club sync with your explicit consent
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Dashboard preview -->
      <section class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">
              Dashboard at a glance
            </h2>
            <p class="mt-4 text-base text-landing-secondary sm:text-lg">
              Flying totals, medical dates, and legality groups — the information you check before
              you go flying.
            </p>
          </div>
          <div class="mt-10">
            <LandingScreenshotFrame
              browser-path="gliderpilotlogbook.co.uk/dashboard"
              :image-url="screenshotFor('dashboard')?.image_url"
              :alt-text="screenshotFor('dashboard')?.alt_text ?? 'Dashboard preview'"
              caption="Example dashboard view after you sign in and connect your logbook."
            />
          </div>
        </div>
      </section>

      <!-- Mobile -->
      <section class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="grid items-center gap-10 lg:grid-cols-2">
            <div class="order-2 lg:order-1">
              <LandingScreenshotFrame
                variant="phone"
                :image-url="screenshotFor('mobile')?.image_url"
                :alt-text="screenshotFor('mobile')?.alt_text ?? 'Mobile logbook experience'"
                caption="The same app on a phone — screenshot for illustration."
              />
            </div>
            <div class="order-1 lg:order-2">
              <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">
                Designed for the airfield.
              </h2>
              <p class="mt-4 text-base leading-relaxed text-landing-secondary sm:text-lg">
                Check legality, review recent flights, and confirm logbook entries from your phone
                or tablet — wherever you are on the field.
              </p>
              <p class="mt-4 text-base leading-relaxed text-landing-secondary sm:text-lg">
                The interface is mobile-first so the same tools work comfortably on small screens.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">How it works</h2>
            <p class="mt-4 text-base text-landing-secondary sm:text-lg">
              Connect your spreadsheet once, then use the app every day — with optional club import
              when your club is onboarded.
            </p>
          </div>

          <ol class="mt-12 grid gap-6 md:grid-cols-3">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              class="rounded-2xl border border-landing-border bg-landing-card p-6 shadow-sm"
            >
              <p class="text-sm font-semibold text-landing-primary">Step {{ index + 1 }}</p>
              <h3 class="mt-2 text-lg font-semibold text-landing-text">{{ step.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-landing-secondary sm:text-base">
                {{ step.description }}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="landing-section">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-[1.75rem] font-semibold text-landing-text sm:text-[2rem]">
              Frequently asked questions
            </h2>
          </div>

          <div class="mx-auto mt-10 max-w-3xl space-y-3">
            <details
              v-for="item in faqItems"
              :key="item.question"
              class="group rounded-2xl border border-landing-border bg-landing-card px-5 py-4 shadow-sm"
            >
              <summary
                class="cursor-pointer list-none text-base font-medium text-landing-text marker:content-none [&::-webkit-details-marker]:hidden"
              >
                <span class="flex items-center justify-between gap-4">
                  {{ item.question }}
                  <span class="text-landing-muted transition group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p class="mt-3 text-sm leading-relaxed text-landing-secondary sm:text-base">
                {{ item.answer }}
              </p>
            </details>
          </div>

          <p class="mt-8 text-center text-sm text-landing-secondary">
            More answers on our
            <RouterLink to="/faq" class="font-medium text-landing-primary hover:underline">FAQ page</RouterLink>.
          </p>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="landing-section pb-8">
        <div class="mx-auto max-w-landing px-4 sm:px-6">
          <div
            class="rounded-3xl bg-landing-primary px-6 py-12 text-center text-white sm:px-10 sm:py-14"
          >
            <h2 class="text-[1.75rem] font-semibold sm:text-[2rem]">Ready to connect your logbook?</h2>
            <p class="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
              Get started with Google and connect your spreadsheet — a modern pilot interface on top of the
              logbook you own. When your club joins the programme, flight records can flow in with your
              approval.
            </p>
            <RouterLink
              to="/login"
              class="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-medium text-landing-primary transition hover:bg-white/95"
            >
              Get started
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-landing-border bg-landing-card">
      <div class="mx-auto max-w-landing px-4 py-10 sm:px-6">
        <SiteFooter>
          <p class="mb-4 text-landing-secondary">Good lift and happy soaring!</p>
        </SiteFooter>
      </div>
    </footer>
  </div>
</template>
