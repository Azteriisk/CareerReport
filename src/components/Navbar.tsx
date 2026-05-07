"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  SignInButton, 
  SignUpButton, 
  UserButton, 
  useUser,
  useClerk
} from '@clerk/nextjs';

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', color: 'var(--bg-color)' }}>
          <FileText size={18} />
        </div>
        <h1 style={{ fontSize: '1.25rem', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: 'var(--text-primary)' }}>CareerReport</h1>
      </Link>

      <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'var(--surface-color)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <NavLink href="/" active={pathname === '/'}>Home</NavLink>
        <NavLink href="/builder" active={pathname === '/builder'}>My Resume</NavLink>
        <NavLink href="/jobs" active={pathname?.startsWith('/jobs')}>Jobs</NavLink>
        {isSignedIn ? (
          <NavLink href={`/u/${user?.username || 'me'}`} active={pathname?.startsWith('/u/')}>Profile</NavLink>
        ) : (
          <SignInButton mode="modal">
            <button style={{ position: 'relative', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease', zIndex: 1 }}>Sign In</button>
          </SignInButton>
        )}
      </nav>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link href="/support" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>Support</Link>
        {isSignedIn ? (
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                userButtonAvatarBox: {
                  width: '32px',
                  height: '32px',
                  border: '2px solid var(--primary)'
                }
              }
            }}
          />
        ) : (
          <SignUpButton mode="modal">
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Sign Up Free</button>
          </SignUpButton>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string, active: boolean, children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      position: 'relative',
      padding: '0.5rem 1rem',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: 600,
      color: active ? 'var(--bg-color)' : 'var(--text-secondary)',
      transition: 'color 0.2s ease',
      zIndex: 1
    }}>
      {active && (
        <motion.div
          layoutId="active-nav-pill"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--primary)',
            borderRadius: '8px',
            zIndex: -1
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {children}
    </Link>
  );
}
