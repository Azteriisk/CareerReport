# Contributing to CareerReport

Thank you for your interest in contributing to CareerReport! We welcome pull requests, bug reports, and feature suggestions.

## Development Workflow

1.  **Fork the repository** and clone your fork.
2.  **Install dependencies:** `npm install`
3.  **Set up environment variables:** Copy `.env.example` to `.env.local` and fill in your keys (Clerk, Supabase, Google Gemini).
4.  **Run the development server:** `npm run dev`
5.  **Create a new branch:** `git checkout -b feature/your-feature-name`
6.  **Make your changes and write tests.**

## Testing Architecture
We follow a "Diamond" testing strategy:
-   **End-to-End (E2E) Tests:** Located in `tests/e2e/`. We use [Playwright](https://playwright.dev/) to test core user flows (e.g., building a resume, hitting the paywall).
-   **Unit Tests:** Located in `tests/unit/`. We use [Vitest](https://vitest.dev/) to test pure functions and utility algorithms (e.g., the AI context compressor).

### Running Tests
-   **Unit tests:** `npm run test`
-   **E2E tests:** `npm run test:e2e` (Requires Playwright browsers to be installed via `npx playwright install`)
    -   *E2E Authentication:* The Playwright suite is configured with `@clerk/testing` to automate authentication. You must have `CLERK_TESTING_TOKEN` in your `.env.local` to bypass bot protections.
    -   **Reserved Testing Account:** 
        -   **Email:** `test@test.com`
        -   **Password:** `CareerReportTest2026!`

## Code Style
-   Use TypeScript for all new files.
-   Ensure there are no build-breaking TS errors (`npm run build`).
-   Prefer standard CSS modules or inline styled-components as established in the repository over bringing in new heavy styling frameworks.

## Submitting a Pull Request
1.  Push your changes to your fork.
2.  Open a Pull Request against the `main` branch.
3.  Ensure all GitHub Actions (tests and builds) pass.
4.  Provide a clear summary of your changes in the PR description.
