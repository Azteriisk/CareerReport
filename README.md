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

### 🌐 Public Professional Profiles
- **Custom URLs:** Claim a unique `careerreport.com/u/your-name` link to share with employers.
- **Global Search:** Easily find other professionals by their username, profile link, or email address.
- **Profile Networking:** A central hub to share your career journey openly without the noise of traditional social networks.

### 🤖 ATS & AI Metadata Integration (Embedded PDF Data)
- **Invisible Data Layer:** We inject semantic JSON-LD directly into the resume DOM.
- **Machine Readability:** Ensures Applicant Tracking Systems (ATS) and AI recruitment scanners can accurately extract your Name, Contact Info, Skills, and Experience without relying on optical character recognition (OCR) or guessing.
- **The Best of Both Worlds:** Allows users to have visually stunning, heavily styled resumes without sacrificing parsing accuracy when applying to enterprise jobs. The exported PDF retains this metadata structure.

### 🔒 Security & Architecture
- **Authentication:** Passwordless, social, and standard login flows powered by Clerk.
- **True Singleton Supabase Client:** Memory-leak-free database connections with custom JWT interceptors for seamless Clerk synchronization.
- **SSR-Safe:** Next.js Server-Side Rendering compatible token decoding using Node `Buffer` fallbacks.

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
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Database:** [Supabase](https://supabase.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Styling:** Custom CSS with Gruvbox theme variables.

## 📝 License

This project is licensed under the MIT License.
