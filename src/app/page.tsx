import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { UserSearch } from "@/components/UserSearch";
import { Feed } from "@/components/Feed";
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();
  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: userId ? 'flex-start' : 'center', padding: '4rem 2rem' }}>
        {userId ? (
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>Your Network Feed</h2>
            <Feed />
          </div>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2rem' }}>
              <Sparkles size={16} />
              <span>New: Shareable Profile Links & Job Matching</span>
            </div>
            
            <h2 className="mobile-landing-h2" style={{ fontSize: '4rem', maxWidth: '800px', margin: '0 0 1.5rem 0', lineHeight: 1.1 }}>
              Your resume. Your profile. <span className="premium-gradient-text">Your network.</span>
            </h2>
            
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '3rem', lineHeight: 1.6 }}>
              CareerReport is the professional network for the next generation. Build a stunning resume, claim your public URL, apply for jobs, and connect with professionals in a modern environment.
            </p>

            <div className="mobile-buttons" style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/builder" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                Start Building Free <ArrowRight size={20} />
              </Link>
              <Link href="/jobs" className="btn btn-secondary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                Browse Jobs
              </Link>
            </div>

            <UserSearch />

            <div className="mobile-features" style={{ display: 'flex', gap: '3rem', marginTop: '5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                "Custom Shareable Profile Links",
                "Direct Job Applications",
                "Professional Networking",
                "ATS-Friendly Export"
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={20} color="var(--accent)" />
                  <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
