import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://careerreport.azterisk.net'),
  title: "CareerReport | Your Professional Network",
  description: "Create stunning public resumes and connect with the new generation of professionals.",
  openGraph: {
    title: "CareerReport | Your Professional Network",
    description: "Create stunning public resumes and connect with the new generation of professionals.",
    type: "website",
    siteName: "CareerReport",
    images: [
      {
        url: "/homepage.png",
        width: 1200,
        height: 630,
        alt: "CareerReport - Your Professional Network",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerReport | Your Professional Network",
    description: "Create stunning public resumes and connect with the new generation of professionals.",
    images: ["/homepage.png"],
  }
};

import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          termsPageUrl: "https://careerreport.azterisk.net/terms",
          privacyPageUrl: "https://careerreport.azterisk.net/privacy",
        }
      }}
    >
      <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
        <head>
          {/* Resume template Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&family=Raleway:wght@300;400;600;700&family=Source+Code+Pro:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Nunito+Sans:wght@300;400;600;700&family=EB+Garamond:wght@400;500;700&family=DM+Sans:wght@300;400;500;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflowX: 'hidden' }}>
            <Navbar />
            <PageTransition>
              {children}
            </PageTransition>
            <Footer />
          </div>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
