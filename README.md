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

## 🚀 Core Innovations & Recent Accomplishments

### 🤖 1. Invisible ATS & AI Metadata Layer (`AtsMetadata.tsx`)
Stunning, heavily styled, and multi-column resumes often fail enterprise Applicant Tracking Systems (ATS) and AI search indexers that rely on naive text flow analysis. 
* We inject a structured, high-fidelity **semantic metadata payload** directly into the resume DOM tree.
* **Double-Layer Extraction:**
  1. **Plaintext Summaries:** Standardized headers like `=== MACHINE READABLE RESUME DATA ===` outline your work, education, and skills.
  2. **Raw JSON Payload:** A fully serialized JSON-LD block (`=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===`) for programmatic extraction by AI agents.
* **Visually Invisible, Programmatically Clear:** Styled via absolute positioning, $1\text{px}$ dimension gates, color transparency, and sub-pixel opacity. Screen readers and automated PDF text extractors pick it up flawlessly while human eyes only see the premium layout templates.

### 🧠 2. Advanced Context-Aware AI Suite
* **Zero-Cold-Start AI PDF Parser:** Import existing PDF resumes instantly. The server parses text, decompresses structure, and feeds structured tokens to Google Gemini to populate all profile fields in seconds.
* **Career Context Prompt:** Users can set a global "Career Context Prompt" (e.g., *"Senior Staff Engineer targeting early-stage YC startups with high-impact, concise bullet points"*). This dynamically primes all AI writing assistants, tailoring professional summary rewrites, job bullets, and category skill generation.

### 💬 3. Professional Social Networking Suite
Transitioned from a single resume builder into a collaborative network with Clerk authentication and custom JWT-to-Supabase RLS token mapping:
* **Public Handles:** Claim a custom username (`/u/username`) that serves as a unified digital footprint featuring your public resume, follower counts, and posts.
* **Social Engagement:** A global activity feed supporting threaded comments, real-time likes, and notifications dropdowns for incoming follows and post interactions.
* **Quote Reposting Modal:** Reshare network thoughts with integrated confirmation gates and nested content validation.
* **Follower Mechanics:** Follow peers and grow your circle, managed with robust Supabase relational integrity.
* **Private Direct Messages:** Seamless direct message portal with real-time syncing so recruiters and professionals can connect immediately.

---

## ✨ Features Breakdown

### 📝 Advanced Resume Builder
- **Real-Time Visual Editor:** Instantly edit and preview your resume exactly as it will appear when exported.
- **Fluid Multi-Page Pagination:** Custom horizontal layout engine using CSS columns and real-time scrollWidth calculation:
  $$\text{Page Count} = \max\left(1, \text{round}\left(\frac{\text{Scroll Width} + 40}{890}\right)\right)$$
  This guarantees zero phantom pages during live preview, margin modifications, template switches, and font-scale rendering updates.
- **Dynamic Templates:** Seamlessly switch between Modern, Split, Minimal, and Classic layouts without losing data.
- **Autosave & Cloud Sync:** Your progress is continuously saved to the cloud via Supabase.
- **Total Customization:** Control section visibility, column counts, custom overrides, and custom image crops directly in the browser.

### 🔒 Security & Architecture
- **Authentication:** Passwordless, social, and standard login flows powered by Clerk.
- **True Singleton Supabase Client:** Memory-leak-free database connections with custom JWT interceptors for seamless Clerk synchronization.
- **Row-Level Security:** Supabase RLS policies enforce per-user data isolation across resumes, posts, likes, comments, and followers.
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
> **Unit Tests (`/tests/unit`)**: Using [Vitest](https://vitest.dev/), we cover pure utility algorithms like the AI Context Compressor, schema validations, and math parsers. Run with `npm run test`.
> 
> **E2E Tests (`/tests/e2e`)**: Using [Playwright](https://playwright.dev/), we test the core UI workflows such as building a resume, PDF export scaling, and social messaging pipelines. Run with `npm run test:e2e`.

*Note on E2E Auth:* Playwright is fully integrated with `@clerk/testing` to bypass bot protection. Credentials and instructions are located in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

---

## 🗺️ Roadmap & Known Issues

> [!IMPORTANT]
> The core layout engines, social infrastructure, and AI modules are fully operational. However, we are actively tracking and refining several known bugs and feature expansions.

### 🐛 Known Issues & DPI Syncing (Active Tasks)
* **Mobile PDF Export Scaling:** PDF printing layout margins and zoom scaling factors can behave inconsistently during direct mobile browser exports. Work is underway to standardize `@media print` queries for mobile viewport boundaries.
* **Multi-DPI Display Layout Synchronization:** Variations in device hardware DPI can occasionally trigger minor layout offsets or slight pixel-spacing differences in resume templates when switching between high-DPI (Retina/4K) monitors and standard-definition screens. We are refining absolute sizing calculations to guarantee pixel-for-pixel rendering symmetry across all resolutions.

### 🔮 Feature Roadmap
* **Full Enterprise Job Board:** Integrate robust job matching dashboards, employer profiles, employee tag indexing, and one-click application systems.
* **Automated ATS Parser Success Test:** Deploy a standardized suite of automated extraction tests using mock resumes to measure the extraction accuracy of our invisible metadata layers against industry-standard parsers, ensuring we remain at 100% readability.
* **Expanded Social Feed Metrics:** Add direct like, share, and comment count indicators to post feeds.
* **Instant Post Conversation Snippets:** Enable feed cards to display the most recent comment inline immediately on posts that have discussions, avoiding the need to click or open comments first.

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
   Copy `.env.example` to `.env.local` and add your Clerk, Supabase, and Gemini API keys.
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:** Navigate to [http://localhost:3000](http://localhost:3000) to view CareerReport locally.

---

## 📝 License & Proprietary Protections

This project is source-available and licensed under the **PolyForm Noncommercial License 1.0.0**. 

* **Educational & Personal Use:** You are welcome to inspect, copy, learn from, modify, self-host for personal use, and contribute to this repository.
* **Commercial Restrictions:** Any commercial exploitation, distribution for monetary compensation, or deployment of CareerReport as a competing hosted SaaS product by third parties is **strictly prohibited**.

For full legal details, please refer to the [LICENSE](./LICENSE) file. All commercial rights and monetization pipelines are exclusively reserved by the author.


