import React from 'react';
import Link from 'next/link';
import { Scale, ArrowLeft, Calendar, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CareerReport',
  description: 'Review the Terms of Service and guidelines for using the CareerReport resume builder and networking platform.',
};

export default function TermsOfServicePage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      padding: '4rem 1.5rem',
      backgroundImage: 'radial-gradient(circle at top right, rgba(250, 189, 47, 0.08), transparent 40%)',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: 600,
          marginBottom: '2rem',
          transition: 'color 0.2s',
        }} className="hover-opacity">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <header style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            background: 'rgba(250, 189, 47, 0.1)',
            borderRadius: '12px',
            color: 'var(--primary)',
            marginBottom: '1.25rem',
          }}>
            <Scale size={24} />
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
            fontWeight: 800,
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}>
            Terms of Service
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} /> Last Updated: May 17, 2026
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={14} /> Version 1.0
            </span>
          </div>
        </header>

        {/* Legal Content Card */}
        <div 
          className="glass-panel" 
          style={{
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            lineHeight: '1.7',
          }}
        >
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              By accessing, browsing, or creating an account on <strong>CareerReport</strong> ("Platform"), hosted at <code>https://careerreport.azterisk.net</code> and operated by <strong>Azterisk</strong>, you agree to comply with and be bound by these Terms of Service ("Terms").
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you do not agree to these Terms, you must not use or access the Platform. We reserve the right to modify these Terms at any time, and your continued use of CareerReport following any updates constitutes absolute acceptance of the revised Terms.
            </p>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>2. Description of Services</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              CareerReport is an interactive online platform that enables registered users to build custom professional resumes, display public-facing portfolio profiles, connect and network with other professionals, post updates, send real-time direct messages, and apply for employment listings via our jobs board.
            </p>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>3. User Conduct & Content Guidelines</h2>
            <p style={{ marginBottom: '1rem' }}>
              You are solely responsible for the information, text, resume content, links, and messages you submit, publish, or share on CareerReport. You agree that you will not:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Provide Fraudulent Information:</strong> Submit false credentials, falsify employment or educational history, or impersonate any other individual or business entity on your profile or resume.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Post Malicious Content:</strong> Host resumes or profiles containing malicious scripts, viruses, phishing links, or spam.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Publish Harassing Material:</strong> Send abusive messages, post harassing updates, or upload obscene or threatening media to the public feed or comment sections.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Violate Copyrights:</strong> Upload copyrighted text, logos, or media that you do not own or have the explicit license to use.
              </li>
            </ul>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>4. Intellectual Property & Content License</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Your data remains YOURS:
            </p>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              You retain all ownership, copyright, and intellectual property rights to the resume content, biographies, and portfolios you create on CareerReport.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              By creating a public resume profile, you grant CareerReport and Azterisk a limited, non-exclusive, royalty-free, worldwide license to host, parse, cache, format, and display your public content strictly to render it to visitors on the internet and deliver the core services of our Platform.
            </p>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>5. Payments & Sponsorship Policy</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Certain features on CareerReport, such as Recruiter Subscriptions and Sponsored Job Listings, require payment. By purchasing a subscription or sponsorship, you agree to the following:
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Sponsored Posts:</strong> Billed as a one-time $19 charge for a 30-day active featured window.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Non-Transferable:</strong> Sponsorship credits are permanently bound to the specific job listing they were purchased for. They cannot be transferred to another listing.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Pause Feature:</strong> You may pause your sponsored listing clock to freeze the 30-day window. Pausing is not a refund.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>No Refunds:</strong> There are no refunds on partially consumed subscription periods or sponsored time.
              </li>
            </ul>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>6. Limitation of Liability</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              CareerReport is provided on an "AS IS" and "AS AVAILABLE" basis without any express or implied warranties of merchantability, uptime, speed, or fitness for a particular purpose. 
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              In no event shall Azterisk, its founders, or operators be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the Platform, data loss, connection issues, or the conduct of other users on the social feed.
            </p>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>7. Termination & Suspension</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We reserve the right, in our sole discretion and without prior notice, to suspend or terminate accounts, remove public profiles, and ban users who violate these Terms, engage in disruptive activities, or conduct fraud on the Platform.
            </p>
          </section>

          <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

          <section>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>8. Governing Law & Contact</h2>
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              These Terms shall be governed by and construed in accordance with the laws of the State of Arkansas, United States, without regard to its conflict of law provisions.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions or disputes regarding these Terms of Service, please contact us at:
            </p>
            <div style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--glass-border)',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              marginTop: '1rem',
              display: 'inline-block',
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Email Legal Support:</strong>{' '}
              <a href="mailto:support@azterisk.net" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                support@azterisk.net
              </a>
            </div>
          </section>
        </div>
        
        {/* Footer info */}
        <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} CareerReport by Azterisk. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
