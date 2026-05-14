# CareerReport

CareerReport is a professional networking platform for the next generation. Build stunning, ATS-friendly resumes, claim your public professional profile, and connect with businesses in a relaxed, business-first environment.

## ✨ Comprehensive Feature List

### 📝 Advanced Resume Builder
- **Real-Time Visual Editor:** Instantly edit and preview your resume exactly as it will appear when exported.
- **Dynamic Templates:** Seamlessly switch between Modern, Split, Minimal, and Classic layouts without losing data.
- **Autosave & Cloud Sync:** Your progress is continuously saved to the cloud via Supabase.
- **Total Customization:** Control section visibility, column counts, and custom image crops directly in the browser.

### 🌐 Public Professional Profiles
- **Custom URLs:** Claim a unique `careerreport.com/u/your-name` link to share with employers.
- **Unified Identity:** A single destination showcasing your published resume, network size, and activity feed.
- **Global Search Engine:** Discover professionals, companies, and opportunities across the entire platform.

### 📣 Professional Social Network
- **Global Activity Feed:** Share career updates, milestones, and professional thoughts with your network.
- **Dynamic Interactions:** Engage with peers through threaded comments, quote reposts, and real-time likes.
- **Meaningful Connections:** Follow industry leaders and colleagues to build a curated professional network.
- **Direct Messaging:** Private, real-time messaging portal to connect directly with recruiters and peers.
- **Smart Notifications:** Real-time in-app alerts for interactions, follows, and network updates.

### 🤖 ATS & AI Metadata Integration (Embedded PDF Data)
- **Invisible Data Layer:** We inject semantic JSON-LD directly into the resume DOM.
- **Machine Readability:** Ensures Applicant Tracking Systems (ATS) and AI recruitment scanners can accurately extract your Name, Contact Info, Skills, and Experience without relying on optical character recognition (OCR) or guessing.
- **The Best of Both Worlds:** Allows users to have visually stunning, heavily styled resumes without sacrificing parsing accuracy when applying to enterprise jobs. The exported PDF retains this metadata structure.
- **AI Integration:** Fully functional AI generation for professional summaries, job experience bullet points, and instant PDF resume parsing. Contextual rewriting ensures high-quality content without hallucination.

### 🔒 Security & Architecture
- **Authentication:** Passwordless, social, and standard login flows powered by Clerk.
- **True Singleton Supabase Client:** Memory-leak-free database connections with custom JWT interceptors for seamless Clerk synchronization.
- **Row-Level Security:** Supabase RLS policies enforce per-user data isolation across resumes, posts, likes, comments, and followers.
- **SSR-Safe:** Next.js Server-Side Rendering compatible token decoding using Node `Buffer` fallbacks.

---

## 🗺️ Roadmap & Status

**Current Status (May 2026):** The core resume builder, PDF parsing, social networking infrastructure, and business ecosystems are **fully deployed and production-ready**.

### 🏗️ Completed Infrastructure
- **AI Core:** Context-aware synthesis, PDF parsing, token optimization, and system pre-prompting.
- **Social Suite:** Feed architecture, real-time messaging, notifications, search, and user interactions.
- **Business Engine:** Employer profiles, employee tagging, and advanced job listing flows.
- **Resumes:** Full template engine, cloud sync, metadata injection, and ATS optimization.

### 🔮 Future Horizons
The following features are slated for future expansion as the platform scales:
- **AI Job Match Score:** Deep semantic comparison between user resumes and real-world job descriptions to highlight application gaps.
- **Apply with CareerReport:** One-click enterprise application pipelines.
- **Algorithmic Discovery:** Engagement-ranked feeds, verified badges, and trending hashtag discovery.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm / yarn / pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Azteriisk/CareerReport.git
   cd CareerReport
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and add your Clerk and Supabase API keys.
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the result.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Animations:** [@formkit/auto-animate](https://auto-animate.formkit.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Styling:** Custom CSS with Gruvbox theme variables.

## 🧪 Testing Architecture

We follow a "Diamond" testing strategy to ensure the application remains stable during rapid development.
*   **Unit Tests (`/tests/unit`)**: Using [Vitest](https://vitest.dev/), we cover pure utility algorithms like the AI Context Compressor and Zod validation schemas. Run with `npm run test`.
*   **E2E Tests (`/tests/e2e`)**: Using [Playwright](https://playwright.dev/), we test the core UI workflows such as building a resume, hitting the Stripe paywall, and exporting PDFs. Run with `npm run test:e2e`.
    *   *Note on E2E Auth:* Playwright uses `@clerk/testing` to bypass bot-protection. Please refer to [CONTRIBUTING.md](./CONTRIBUTING.md) for testing account credentials.

## 🤝 Contributing & Self-Hosting

Contributions are highly welcome! Please refer to our [CONTRIBUTING.md](./CONTRIBUTING.md) for full details on our branching strategy and pull request process.

If you wish to self-host CareerReport:
1. Clone the repository and run `npm install`.
2. Copy the newly added `.env.example` file to `.env.local`.
3. Follow the links inside `.env.example` to register for your free API keys for Clerk (Auth), Supabase (Database), and Google Gemini (AI).
4. Run `npm run dev` to boot up your local instance.

## 📝 License

This project is licensed under the MIT License.
