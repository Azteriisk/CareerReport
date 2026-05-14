import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerReport | Your Professional Network",
  description: "Create stunning public resumes and connect with the new generation of professionals.",
  openGraph: {
    title: "CareerReport | Your Professional Network",
    description: "Create stunning public resumes and connect with the new generation of professionals.",
    type: "website",
    siteName: "CareerReport",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerReport | Your Professional Network",
    description: "Create stunning public resumes and connect with the new generation of professionals.",
  }
};

import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { SyncUser } from "@/components/SyncUser";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <SyncUser />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflowX: 'hidden' }}>
            <Navbar />
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
