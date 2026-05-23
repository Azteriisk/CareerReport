"use client";

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import styles from './Footer.module.css';

export function Footer() {
  const { isSignedIn } = useUser();

  return (
    <footer className={`site-footer ${styles.footer}`}>
      <div className={styles.linkRow}>
        <Link href="/how-it-works" className={styles.link}>How it Works</Link>
        <Link href="/support" className={styles.link}>Support</Link>
        <Link href="/compatibility" className={styles.link}>Report ATS Compatibility</Link>
        <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
        <Link href="/terms" className={styles.link}>Terms of Service</Link>
        {isSignedIn && (
          <Link href="/business/create" className={styles.linkHighlight}>Company Account Application</Link>
        )}
      </div>
      <p className={styles.copyright}>&copy; 2026 CareerReport. All rights reserved.</p>
    </footer>
  );
}
