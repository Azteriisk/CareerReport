# CareerReport

CareerReport is a professional networking platform for the next generation. Build stunning, ATS-friendly resumes, claim your public professional profile, and connect with businesses in a relaxed, business-first environment.

## ✨ Comprehensive Feature List

### 📝 Advanced Resume Builder
- **Real-Time WYSIWYG Editor:** Instantly preview your resume exactly as it will appear when printed or exported.
- **Multiple Premium Templates:** Choose from Modern, Modern Split, Minimal, and Classic layouts dynamically.
- **Responsive Design:** Fully functional builder on both mobile and desktop.
- **Autosave & Cloud Sync:** Never lose your work. Your resume is automatically synced to the cloud via Supabase.
- **Dynamic Columns:** Customize your Work Experience and Education sections with single or double-column layouts.
- **Custom Image Cropping:** Upload, crop, and perfectly align your headshot directly within the browser.
- **Public/Private Toggle:** Instantly control whether your resume is visible on your public profile.
- **Optional Sections:** Add Projects, References, and Certifications on demand — only what you need.

### 🌐 Public Professional Profiles
- **Custom URLs:** Claim a unique `careerreport.com/u/your-name` link to share with employers.
- **Resume Tab:** View any user's published resume directly from their profile page.
- **Posts Tab:** Browse a user's activity feed from their profile.
- **Follower / Following Counts:** See your network size at a glance.
- **Profile Networking:** A central hub to share your career journey openly without the noise of traditional social networks.

### 📣 Social Networking Feed
- **Post Creator:** Share career updates, milestones, and professional thoughts with your network.
- **Image Attachments:** Attach images to posts with a built-in lightbox viewer.
- **Quote Reposts:** Embed and comment on existing posts in your own voice.
- **Likes System:** Like posts from other users with real-time optimistic UI updates.
- **Comments:** Threaded comment sections on every post, with avatar, name, and delete support.
- **Inline Delete Confirmation:** Two-click delete flow prevents accidental post removal.
- **Follow / Unfollow:** Follow other professionals to build your network.

### 🤖 ATS & AI Metadata Integration (Embedded PDF Data)
- **Invisible Data Layer:** We inject semantic JSON-LD directly into the resume DOM.
- **Machine Readability:** Ensures Applicant Tracking Systems (ATS) and AI recruitment scanners can accurately extract your Name, Contact Info, Skills, and Experience without relying on optical character recognition (OCR) or guessing.
- **The Best of Both Worlds:** Allows users to have visually stunning, heavily styled resumes without sacrificing parsing accuracy when applying to enterprise jobs. The exported PDF retains this metadata structure.
- **AI Placeholder Integration:** Stubbed AI rewrite and bullet-point generation buttons (premium feature hooks) for summaries and job descriptions.

### 🔒 Security & Architecture
- **Authentication:** Passwordless, social, and standard login flows powered by Clerk.
- **True Singleton Supabase Client:** Memory-leak-free database connections with custom JWT interceptors for seamless Clerk synchronization.
- **Row-Level Security:** Supabase RLS policies enforce per-user data isolation across resumes, posts, likes, comments, and followers.
- **SSR-Safe:** Next.js Server-Side Rendering compatible token decoding using Node `Buffer` fallbacks.

---

## 🗺️ Roadmap / To-Do

### 🤖 AI Features
- [ ] **AI Resume Generation** — Full resume generation from a job description or LinkedIn URL input
- [ ] **AI Pre-prompting** — Allow users to provide a "career context" system prompt that personalizes all AI suggestions (tone, industry, seniority level)
- [ ] **AI Job Match Score** — Score the user's resume against a pasted job description and highlight gaps

### 💼 Job Board
- [ ] **Job Listing Improvements** — Richer job cards with salary ranges, remote/hybrid tags, and company logos
- [ ] **Job Posting Flow** — Full employer-side flow: create, preview, and publish job listings
- [ ] **Apply with CareerReport** — One-click application that sends the user's public resume + profile link to the employer

### 🏢 Business Accounts
- [ ] **Business Account Setup** — Separate account type for employers with a company profile, logo, and bio
- [ ] **Company Profile Pages** — Public pages at `/co/company-name` with open listings and follower counts
- [ ] **Employee Tagging** — Employees can link their profile to a verified company

### 📣 Social Networking (Remaining)
- [ ] **Notifications** — In-app alerts for new followers, likes, comments, and reposts
- [ ] **Messaging / DMs** — Direct messages between connected users
- [ ] **Hashtags & Discover** — Tag posts with topics and surface trending content
- [ ] **Search** — Global search across users, companies, and posts
- [ ] **Verified Badges** — Manual or automated verification for notable professionals and businesses
- [ ] **Feed Algorithm** — Ranked feed based on follows, engagement, and recency instead of purely chronological

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

## 📝 License

This project is licensed under the MIT License.
