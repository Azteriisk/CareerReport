"use client";

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export function Footer() {
  const { isSignedIn } = useUser();

  return (
    <footer className="site-footer" style={{ 
      padding: '2.5rem 2rem', 
      textAlign: 'center', 
      color: 'var(--text-secondary)', 
      borderTop: '1px solid var(--glass-border)', 
      fontSize: '0.875rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      background: 'var(--surface-color)',
      marginTop: 'auto',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Link href="/how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">How it Works</Link>
        <Link href="/support" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Support</Link>
        <Link href="/compatibility" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Report ATS Compatibility</Link>
        <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Privacy Policy</Link>
        <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} className="footer-link">Terms of Service</Link>
        {isSignedIn && (
          <Link href="/business/create" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} className="footer-link">Company Account Application</Link>
        )}
      </div>
      <p style={{ margin: 0, opacity: 0.8 }}>&copy; 2026 CareerReport. All rights reserved.</p>
      <style dangerouslySetInnerHTML={{__html: `
        .footer-link:hover {
          color: var(--primary) !important;
        }
      `}} />
    </footer>
  );
}
