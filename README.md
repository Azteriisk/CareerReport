# CareerReport

<p align="center">
  <img src="./homepage.png" alt="CareerReport Homepage Preview" width="100%" style="border-radius: 12px; border: 1px solid var(--glass-border); box-shadow: 0 8px 30px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <strong>CareerReport</strong> is a state-of-the-art professional networking platform and resume builder designed for the next generation. Build stunning, pixel-perfect, ATS-friendly resumes, claim your custom public profile, and network in a sleek, business-first environment.
</p>

<p align="center">
  <a href="#-core-innovations"><img src="https://img.shields.io/badge/Innovations-ATS%20%26%20AI%20Tailored%20Resumes-orange?style=flat-square" alt="Core Innovations" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20Clerk-blue?style=flat-square" alt="Tech Stack" /></a>
  <a href="#-testing-architecture"><img src="https://img.shields.io/badge/Testing-Diamond%20Strategy-emerald?style=flat-square" alt="Testing Strategy" /></a>
</p>

<p align="center">
  <img src="./whatisthis.png" alt="CareerReport Platform Banner" width="80%" style="border-radius: 8px; border: 1px solid var(--glass-border); box-shadow: 0 6px 24px rgba(0,0,0,0.25);" />
</p>

---

### 🚀 Core Innovations & Recent Accomplishments

### 💼 1. Recruiter Monetization, Live Stripe & Bulk Credits
CareerReport now ships a complete recruiter-side business model with tiered subscriptions, sponsored jobs, bulk packs, and live production payments:
* **Business Subscription Tiers (`src/lib/business-tier.ts`):** Four tiers — Free Starter (3 jobs), Recruiter Pro ($49/mo, 10 jobs + AI), Recruiter Enterprise ($149/mo, 25 jobs), and Unlimited ($299/mo, unlimited). Tier state is encoded directly in the `business_profiles.bio` field using a `[Tier: id]` tag, requiring zero DB migrations.
* **Premium Seat Allocation:** Recruiter Pro includes 3 premium employee seats, Enterprise 5, Unlimited 10. Seat status is encoded in `company_employees.status` via a pipe-delimited `|premium` suffix.
* **Live Stripe Subscription Checkout (`/api/stripe/checkout-session`):** Real-time upgrade redirects to Stripe Checkout with custom metadata. Successful transactions trigger the Stripe Webhook handler (`/api/webhooks/stripe`) to instantly update the recruiter's subscription level in the Supabase database.
* **Sponsored Job Posts (`/jobs/sponsored`, $19/month per listing):** Recruiters can upgrade standard listings to Featured using live one-time Stripe checkout pages or bulk packs. Featured posts receive a gold-highlighted card border, a `+25pt` algorithmic boost in the candidate relevance engine, and are pinned at the top of personalized feeds with a `✨ Sponsored Match for You` badge. Status is stored as `open:featured` in the existing `jobs.status` field.
* **Bundle Credit System:** Recruiters can purchase a Triple Pack ($49, 3 credits) or Campaign Pack ($149, 10 credits) from `/jobs/sponsored`. Credit balance is stored zero-migration-style in `business_profiles.bio` as `[SponsorCredits: N]`, visible in the recruiter billing tab and beside listing activation triggers.
* **Pauseable Sponsorship Clock:** Recruiters can pause the 30-day featured clock at any time (`⏸ Pause Sponsorship`). While paused, the listing reverts to standard placement in candidate feeds and the countdown freezes. Resuming (`▶ Resume Sponsorship`) instantly restores featured placement. The pause state is encoded zero-migration-style as `open:featured:paused`.
* **Non-Transferable Sponsorship Rule:** Each sponsorship credit is permanently bound to the listing it was purchased for. Enforced in both the UI checkout confirmation checkboxes and helper JSDoc constraints.

### 📝 2. Responsive Resume Builder & Pro AI Features (`/builder`)
A premium, highly interactive real-time resume editor designed to deliver pixel-perfect results on both desktop and mobile viewports:
* **Interactive Live Editor:** Edit and preview resumes dynamically with multiple professional layout templates (Modern, Split, Minimal, Classic) and real-time page-count calculations.
* **Pro AI Resume Optimizer:** Integrated AI editing highlights and action-oriented suggestions that run securely via Gemini to guide professionals through the resume building loop.
* **Pro Multi-Resume Save System:** Seamless draft management allowing premium users to maintain, clone, rename, and toggle visibility on multiple resume versions.
* **Cover Letter Architect:** A built-in dual-mode cover letter builder (Premium AI Storyteller with 5 narrative personas + Free 4-step Guided Creator). Enables candidates to curate cover letters per company/role and toggle their inclusion as Page 1 of the exported PDF.

### 🤖 3. Invisible ATS & AI Metadata Layer (`AtsMetadata.tsx`)
Stunning, heavily styled, and multi-column resumes often fail enterprise Applicant Tracking Systems (ATS) and AI search indexers that rely on naive text flow analysis. 
* We inject a structured, high-fidelity **semantic metadata payload** directly into the resume DOM tree.
* **Double-Layer Extraction:**
  1. **Plaintext Summaries:** Standardized headers like `=== MACHINE READABLE RESUME DATA ===` outline your work, education, and skills.
  2. **Raw JSON Payload:** A fully serialized JSON-LD block (`=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===`) for programmatic extraction by AI agents.
* **Visually Invisible, Programmatically Clear:** Styled via absolute positioning, 1px dimension gates, color transparency, and sub-pixel opacity. Screen readers and automated PDF text extractors pick it up flawlessly while human eyes only see the premium layout templates.
* **Automated ATS Success Testing Harness:** Backed by a programmatic Vitest testing suite (`tests/unit/ats-harness.test.ts`) that runs generated resumes through Lever and Greenhouse parsing simulator heuristics to guarantee 100% data extraction accuracy.

### 🧠 4. Advanced Context-Aware AI Suite
* **Resilient AI PDF Import (Pro):** Multi-stage import pipeline for existing resumes:
  1. **Embedded JSON fast-path** — CareerReport exports include a machine-readable JSON block for instant, zero-token imports.
  2. **Text extraction + Gemini** — Standard PDFs are parsed with `pdf-parse`, then structured via `generateObject` and a Zod schema.
  3. **Vision fallback** — Scanned or image-heavy PDFs with no selectable text are sent directly to Gemini as a PDF file input.
* **Analytics & Limits Hardening:** Implemented 32,000 character token TDoS (Token Denial of Service) protection on AI routes, a 15-candidate limit for recruiter applicant stack ranking.

### 💬 5. Professional Social Networking & Secure Direct Messaging
Transitioned from a single resume builder into a collaborative network with Clerk authentication and custom JWT-to-Supabase RLS token mapping:
* **Public Handles & Follow UX:** Claim a custom username (`/u/username`) that serves as a unified footprint featuring your public resume, follower counts, and posts. Tapping Follow while logged out triggers an elegant custom "Account Required" modal rather than an immediate redirect to sign-in.
* **Social Engagement Feed:** A global activity feed supporting threaded comments, real-time likes, reposting, and direct metrics indicators (like, comment, and repost counts).
* **Instant Post Thread Previews:** Renders the top three most recent conversation bubbles directly on the homepage social card feeds so users can preview discussions without clicking into full post dialogs.
* **Private Direct Messages:** Seamless direct message portal with real-time syncing.
  * **Premium Delivery Policy (RLS):** Messaging delivery is restricted to Premium consumers and Pro Recruiter members, and recipients must have an active public profile.
  * **Reply Fast-Path (Security Definer):** An RLS helper function (`public.has_initiated_conversation`) runs with `SECURITY DEFINER` privileges to safely query message threads, avoiding infinite RLS recursion loops and enabling standard candidates to reply to conversations initiated by premium recruiters.

### 📱 6. Google Play Store TWA Integration (Android Billing)
To ship CareerReport as a fully native-feeling app on the Google Play Store, we implemented a custom Android **Trusted Web Activity (TWA)** wrapper integration:
* **Dynamic Payment Bridge:** In standard web viewports, users check out securely via Stripe. When launched inside the Google Play TWA, Chrome's container injects the **Digital Goods API** (`window.getDigitalGoodsService`), which we automatically intercept to trigger the native Google Play Billing dialog using the standard **Payment Request API**.
* **Secure Server Verification:** Added `/api/checkout/google-play` to securely authenticate with Google Cloud using JWT service accounts and verify subscription purchase tokens against Google Play Publisher APIs.
* **Database Token Mapping:** Linked purchase tokens directly into the user's `career_context` record as `[GooglePlayToken: <token>]` to enable active session mapping and lookup without requiring complex database migrations.
* **Real-time Developer Notifications (RTDN):** Created `/api/webhooks/google-play` to receive Google Cloud Pub/Sub webhook events, automatically syncing `is_pro` status and cleaning tokens when subscriptions renew, hold, or cancel/expire.

### ✉️ 7. Automated Onboarding Candidate Drips & Analytics
* **Standard Welcome Campaign:** Includes a 3-step Welcome and Career Acceleration onboarding email drip. New candidates are auto-subscribed upon profile registration via a custom Postgres trigger (`on_profile_created_enroll_drip`).
* **Processing Engine API (`/api/admin/drips`):** A secure background dispatch endpoint that aggregates pending candidate schedules, simulation-delivers templates, writes historical send logs to `sent_drip_emails`, and advances sequence queues.
* **Interactive Campaign Manager Console:** Renders an elegant control widget inside the administrator dashboard exposing live analytics metrics, enrollment queues, and a manual simulation trigger button.
* **Operational Event Analytics:** Tracks site-wide events (direct messages dispatched, anonymous guest exports, and logged-in user resume prints) via an event tracking API (`/api/analytics`), feeding real-time visual dashboards and recent logs inside `/admin`.
* **Advanced RLS Cleanups & Roster Safeguards:** 
  * Cascade triggers (`on_profile_deleted_cleanup`, `on_post_deleted_cleanup`, and `on_business_deleted_cleanup`) safely scrub orphan comments, likes, and applicant records on delete.
  * Granular safeguards on `company_employees` prevent non-owners from editing or deleting the owner's status record even if they possess team administration write permissions.

### 🗺️ Long Term
- [ ] Native Mobile App (iOS/Android) for Job Seekers (Web-only Recruiter Dashboard to avoid app store fees)

---

## ✨ Features Breakdown

### 📝 Advanced Resume Builder
- **Real-Time Visual Editor:** Instantly edit and preview your resume exactly as it will appear when exported.
- **Fluid Multi-Page Pagination:** Custom horizontal layout engine using CSS columns (`850px` column width, `40px` gap) and **`scrollWidth`** on a hidden measure element — not `getBoundingClientRect().width`, which only sees the first column. Shared logic lives in `src/lib/resume-pagination.ts` and drives the builder preview, PDF/print export, and public profile views (desktop and mobile).
  $$\text{Page Count} = \max\left(1,\ \text{round}\left(\frac{\text{scrollWidth} + 40}{890}\right)\right)$$
- **Multiple Resumes (Pro):** Premium users can save, switch, rename, and delete multiple resume drafts tied to one profile.
- **Dynamic Templates:** Seamlessly switch between Modern, Split, Minimal, and Classic layouts without losing data.
- **Autosave & Cloud Sync:** Your progress is continuously saved to the cloud via Supabase.
- **Total Customization:** Control section visibility, column counts, custom overrides, and custom image crops directly in the browser.

### 🔒 Security & Architecture
- **Authentication:** Passwordless, social, and standard login flows powered by Clerk.
- **True Singleton Supabase Client:** Memory-leak-free database connections with custom JWT interceptors for seamless Clerk synchronization.
- **Row-Level Security:** Supabase RLS policies enforce per-user data isolation across resumes, posts, likes, comments, and followers.
- **AI guards (`src/lib/ai-guard.ts`):** Shared validation for PDF uploads, career-context length caps, and server-side Pro checks (optional `SUPABASE_SERVICE_ROLE_KEY` for reliable production lookups).
- **SSR-Safe:** Next.js Server-Side Rendering compatible token decoding using Node `Buffer` fallbacks.

---

## 🛠 Tech Stack

| Technology | Role in CareerReport |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Server Actions) |
| **Authentication** | [Clerk](https://clerk.com/) (Session management, JWT integration) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + granular Row-Level Security) |
| **AI Engine** | [Google Gemini API](https://ai.google.dev/) (PDF Parsing, Contextual Synthesis) |
| **Animations** | [@formkit/auto-animate](https://auto-animate.formkit.com/) (Micro-interactions) |
| **Styling** | Custom Vanilla CSS (HSL styling systems, Gruvbox theme variables) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🧪 Testing Architecture

We follow a **"Diamond" testing strategy** to ensure full stability during rapid updates.

> [!TIP]
> **Unit Tests (`/tests/unit`)**: Using [Vitest](https://vitest.dev/), we cover pure utility algorithms like the AI Context Compressor, Greenhouse/Lever ATS parsing heuristics (`ats-harness.test.ts`), schema validations, and math parsers. Run with `npm run test`.
> 
> **E2E Tests (`/tests/e2e`)**: Using [Playwright](https://playwright.dev/), we test core UI workflows: recruiter sponsor modals (`sponsored-listings.spec.ts`), PDF import ATS validation portals (`pdf-imports.spec.ts`), builder loops, PDF export, responsive layouts, API smoke tests, and **multipage pagination regressions** (`pagination.spec.ts`). Run with `npm run test:e2e`.
>
> **Unit coverage highlights:** `resume-pagination`, `pdf-resume-import`, `ai-guard`, `ats-harness`, resume schema, template render, and AI context compression.

*Note on E2E Auth:* Playwright is fully integrated with `@clerk/testing` to bypass bot protection. Credentials and instructions are located in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

---

## 🗺️ Roadmap & Known Issues

> [!IMPORTANT]
> The core layout engines, social infrastructure, and AI modules are fully operational. We actively maintain a checklist of recently implemented user flow improvements alongside upcoming milestones.

<details>
<summary><b>✅ Recent Accomplishments (Completed Tasks)</b></summary>

* [x] **Recruiter Subscription Tiers:** Four-tier business model (Free → Pro → Enterprise → Unlimited) encoded zero-migration-style into `business_profiles.bio`. Defines active job slot limits, AI access, and premium seat counts per tier.
* [x] **Premium Employee Seats:** Pro gets 3, Enterprise 5, Unlimited 10 premium seats — assignable by the company owner from the company profile page. Seat status encoded in `company_employees.status` via a `|premium` pipe suffix.
* [x] **Sponsored Job Posts ($19/month):** One-click featured upgrade from the Recruiter Dashboard. Stores `open:featured` in the existing `jobs.status` field. Featured posts get gold card styling, `+25pt` relevance boost, and top-of-feed pinning for matching candidates.
* [x] **Pauseable Sponsorship Clock:** Recruiters can freeze and resume the 30-day featured clock from the Manage Listings tab. Paused state encoded as `open:featured:paused` — listing reverts to standard placement while paused. New `toggleSponsorPause()` helper in `job-tier.ts` handles the transition.
* [x] **Non-Transferable Sponsorship Gate:** Checkout modal requires checkbox acknowledgement that the credit is permanently bound to the target listing and cannot be reassigned. Enforced in both the UI and the `job-tier.ts` JSDoc.
* [x] **Sponsor Checkout Modal:** In-dashboard glassmorphic checkout modal with benefit summary grid, order summary, card inputs, and simulated Stripe processing — architected to swap to live Stripe Sessions.
* [x] **Sponsored Jobs Info Page (`/jobs/sponsored`):** Full conversion-focused recruiter marketing page — animated stat counters, how-it-works steps, benefit grid, pricing tiers (Single $19, Triple $49, Campaign $149), FAQ accordion, and hero mockup preview.
* [x] **Cover Letter Architect (AI + Guided):** Dual-mode cover letter system in `/builder` — premium AI storytelling with 5 narrative tones via Gemini, and a free 4-step guided creator requiring zero AI tokens. Per-role scope (company + job title). PDF export toggle injects cover letter as Page 1.
* [x] **Multipage Pagination Fix:** Restored `scrollWidth`-based page counting across builder, exports, and public profiles; added shared `resume-pagination` helper and Playwright regression tests.
* [x] **PDF Import Reliability:** Added embedded-JSON fast path, Gemini vision fallback for scanned PDFs, and server-side Pro/rate-limit/size guards.
* [x] **Guest Follow UX:** Unsigned visitors see Follow on profiles; tapping opens the Account Required modal with tailored benefits (not an immediate sign-in redirect).
* [x] **Multiple Resumes (Pro):** Premium users can maintain multiple named resume drafts from the builder.
* [x] **Universal Spinner Standard:** Unified the spinner placement and visual styling in the resume builder to match the exact top-left positioning used on other sub-pages.
* [x] **Sleek Builder Footer Mechanics:** Configured the resume builder's footer visibility to remain hidden unless the user scrolls all the way to the bottom of the builder.
* [x] **Redundant Footer Cleans:** Fixed double footer rendering on the HomePage and removed the redundant footer on the Profile Page for perfect visual consistency.
* [x] **Form Select Styling Harmonization:** Re-designed the support ticket select background color and border styles to match the premium, custom-colored input fields of the surrounding form.
* [x] **Supabase Profile URL Integrity:** Standardized team owner resolution to prioritize database profile usernames first, preventing Clerk empty username handles from defaulting owner links to `/u/owner`.
* [x] **Dynamic Title Customization & Encoding:** Implemented inline custom employee title updates (e.g., "CEO" or "Lead Developer") in the Team Management dashboard without database schema bloat, utilizing a robust pipe-delimited suffix encoder directly on the `status` column.
* [x] **Secure Ownership Transfer:** Introduced dual-tier safety confirmation popups allowing owners to safely delegate page ownership to senior team members, with automatic demotion of the former owner to a `"Former Owner"` high-authority status.
* [x] **Decentralized Team Administration:** Expanded dashboard access to employees with `profile` permissions, allowing them to manage standard member details and customize titles.
* [x] **Google Play Billing Bridge (TWA):** Integrated native Android Play Store payment prompts into the web app using Digital Goods and Payment Request APIs, falling back to Stripe on the web.
* [x] **Google Developer API Verification:** Created backend secure verification routes (`/api/checkout/google-play`) to cryptographically validate subscription order tokens using Google Cloud JWT credentials.
* [x] **Real-time Developer Notifications (RTDN):** Created Pub/Sub webhook endpoints (`/api/webhooks/google-play`) to auto-sync subscription cancels, expirations, and active states.
* [x] **Live Stripe Checkout for Subscriptions:** Replaced the simulated plan upgrade modal in the Recruiter Dashboard with a real Stripe Checkout Session redirect (`/api/stripe/checkout-session`).
* [x] **Live Stripe Checkout for Sponsored Posts:** Replaced the simulated featured-upgrade modal with a one-time Stripe Checkout Session.
* [x] **Stripe Webhook Handler (`/api/webhooks/stripe`):** Implemented to handle `checkout.session.completed` for bundles and jobs, securely parsing zero-migration metadata.
* [x] **Sponsored Post Expiration & Clock Control:** Implemented logic for pausing and resuming sponsorship clocks, and checking elapsed unpaused time.
* [x] **Bundle Credit System:** Implemented Triple Pack ($49, 3 credits) and Campaign Pack ($149, 10 credits) from the `/jobs/sponsored` pricing section. Stored credit balance in `business_profiles.bio` as `[SponsorCredits: N]` (zero-migration).
* [x] **Credit Balance Display in Dashboard:** Show remaining sponsorship credits in the Billing tab and alongside the "Sponsor Post" button on each listing.
* [x] **AI Analytics & Limits Hardening:** Implemented 32,000 char token TDoS protection on the AI generators, 15-candidate stack ranking limits, and RLS database lockdown policies.
* [x] **Testing & Webhook Integrity:** Initialized Playwright E2E suite and ensured no mocked applicants or simulated data leaks to the recruiter dashboard.
* [x] **Multiple Cover Letters:** Allow saving multiple cover letters per resume (one per company/role), stored as an array in `ResumeData.coverLetters[]`.
* [x] **Cover Letter Library UI:** Add a "My Cover Letters" panel in the builder sidebar listing saved letters by company/role, with edit/delete controls.
* [x] **Guided Creator Template Polish:** Offer 2–3 opening sentence templates per guided step to reduce blank-page friction for new users.
* [x] **Expand Testing Suite:** Added E2E Playwright coverage for resume PDF import flows and verified social feed pagination structures.
* [x] **Sponsored Post E2E Tests:** Deployed full E2E test suite covering the recruiter sponsor modal workflows, terms acknowledgement checkboxes, and pause/resume clock toggles.
* [x] **Automated ATS Success Testing Harness:** Engineered programmatic Vitest suite simulating Greenhouse and Lever parser heuristics to ensure 100% extraction accuracy of invisible resume metadata layers.
* [x] **Instant Post Thread Previews:** Rendered the top three most recent conversation bubbles directly on the homepage social card feeds so users can preview discussions without clicking into full post dialogs.
* [x] **Advanced RLS Audit & DB Triggers:** Integrated database cascading triggers to automatically clean up orphaned post comments, likes, or messaging channels if a user profile is deleted.
* [x] **Roster RLS Safeguards:** Solidified backend RLS validation checks preventing a non-owner with team permissions from editing or modifying the owner's status record directly.
* [x] **Expanded Social Feed Metrics:** Rendered direct like, comment, and repost count indicators on post feeds.
* [x] **Recruiter Analytics Dashboard:** Exposed per-listing views, Click-Through Rates (CTR), and standard vs. sponsored visual ROI traffic comparative performance matrices in the overview tab.
* [x] **Premium Messaging & Reply Bypass:** Enforced premium sender delivery limits and public recipient checks on `messages` table RLS, using `security definer` recursive-safe checks to allow standard candidate reply capabilities.
* [x] **Operational Site Event Analytics:** Added anonymous guest and user resume print/export event logs alongside the real-time visual Systems Analytics dashboard widget in the administrator panel.
* [x] **Automated Onboarding Drip Campaigns:** Created PostgreSQL schemas and default Welcome campaigns that auto-subscribe new profiles via Postgres triggers, processed by backend simulated dispatcher endpoints and managed inside `/admin` control consoles.

</details>

---

### 🔮 Feature Roadmap & Feedback

All planned roadmap objectives have been successfully implemented! If you have ideas for new features, want to report a bug, or have feedback, please reach out via our [Support Page](/support).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm / yarn / pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Azteriisk/CareerReport.git
   cd CareerReport
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and add your Clerk, Supabase, Gemini, and Stripe keys.
   ```bash
   cp .env.example .env.local
   ```
   Optional but recommended for production: `SUPABASE_SERVICE_ROLE_KEY` (enables reliable server-side Pro checks on AI routes).

4. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📝 License & Proprietary Protections

This project is source-available and licensed under the **PolyForm Noncommercial License 1.0.0**. 

* **Educational & Personal Use:** You are welcome to inspect, copy, learn from, modify, self-host for personal use, and contribute to this repository.
* **Commercial Restrictions:** Any commercial exploitation, distribution for monetary compensation, or deployment of CareerReport as a competing hosted SaaS product by third parties is **strictly prohibited**.

For full legal details, please refer to the [LICENSE](./LICENSE) file. All commercial rights and monetization pipelines are exclusively reserved by the author.
