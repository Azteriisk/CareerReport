"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsModal } from '@/components/SettingsModal';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useAuth,
  useClerk
} from '@clerk/nextjs';
import { supabase, setTokenGetter } from '@/lib/supabase';

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [globalUsername, setGlobalUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Register the Clerk token getter globally so every Supabase request
  // automatically gets a fresh, valid token — no more manual token management.
  useEffect(() => {
    if (isSignedIn) {
      setTokenGetter(() => getToken({ template: 'supabase' }));
    } else {
      setTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    async function getProfileAndBusiness() {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username) {
        setGlobalUsername(profile.username);
      }

      const { data: business } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (business?.slug) {
        setBusinessSlug(business.slug);
      }
    }

    getProfileAndBusiness();
  }, [user?.id]);

  const handleOpenSettings = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfileData(data);
    }
    setShowSettings(true);
    setMobileMenuOpen(false);
  };

  const displayUsername = globalUsername || user?.username || 'me';

  return (
    <>
      <header
        className="mobile-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', color: 'var(--bg-color)' }}>
            <FileText size={18} />
          </div>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 700, color: 'var(--text-primary)' }}>CareerReport</h1>
        </Link>

        {/* Desktop nav pills */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'var(--surface-color)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <NavLink href="/" active={pathname === '/'}>Home</NavLink>
          <NavLink href="/builder" active={pathname === '/builder'}>{isSignedIn ? 'My Resume' : 'Create Resume'}</NavLink>
          <NavLink href="/jobs" active={pathname?.startsWith('/jobs')}>Jobs</NavLink>
          {isSignedIn && (
            businessSlug ? (
              <NavLink href={`/co/${businessSlug}`} active={pathname?.startsWith('/co/')}>My Company</NavLink>
            ) : (
              <NavLink href="/business/create" active={pathname === '/business/create'}>Post Jobs</NavLink>
            )
          )}
          {isSignedIn ? (
            <NavLink href={`/u/${displayUsername}`} active={pathname?.startsWith('/u/')}>Profile</NavLink>
          ) : (
            <SignInButton mode="modal">
              <button style={{ position: 'relative', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s ease', zIndex: 1 }}>Sign In</button>
            </SignInButton>
          )}
        </nav>

        {/* Desktop auth section */}
        <div className="nav-auth-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/support" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>Support</Link>
          {isSignedIn ? (
            <>
              <motion.button
                onClick={handleOpenSettings}
                whileTap={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
                title="Account Settings"
              >
                <Settings size={22} />
              </motion.button>
              <NotificationsDropdown />
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: { width: '32px', height: '32px', border: '2px solid var(--primary)' }
                  }
                }}
              />
            </>
          ) : (
            <SignUpButton mode="modal">
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Sign Up Free</button>
            </SignUpButton>
          )}
        </div>

        {/* Mobile: right side — avatar or hamburger */}
        <div className="mobile-nav-right" style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }}>
          {isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: { width: '30px', height: '30px', border: '2px solid var(--primary)' }
                }
              }}
            />
          )}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* Mobile slide-down drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              zIndex: 999,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid var(--glass-border)',
              padding: '1.25rem 1.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <MobileNavLink href="/" active={pathname === '/'}>Home</MobileNavLink>
            <MobileNavLink href="/builder" active={pathname === '/builder'}>{isSignedIn ? 'My Resume' : 'Create Resume'}</MobileNavLink>
            <MobileNavLink href="/jobs" active={pathname?.startsWith('/jobs')}>Jobs</MobileNavLink>
            {isSignedIn && (
              businessSlug ? (
                <MobileNavLink href={`/co/${businessSlug}`} active={pathname?.startsWith('/co/')}>My Company</MobileNavLink>
              ) : (
                <MobileNavLink href="/business/create" active={pathname === '/business/create'}>Post Jobs</MobileNavLink>
              )
            )}
            {isSignedIn && (
              <MobileNavLink href={`/u/${displayUsername}`} active={pathname?.startsWith('/u/')}>Profile</MobileNavLink>
            )}
            <MobileNavLink href="/support" active={pathname === '/support'}>Support</MobileNavLink>

            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />

            {isSignedIn ? (
              <button
                onClick={handleOpenSettings}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <Settings size={18} />
                Account Settings
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <SignInButton mode="modal">
                  <button style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
                    Sign Up Free
                  </button>
                </SignUpButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showSettings && (
        <SettingsModal
          user={user}
          profileData={profileData}
          onClose={() => setShowSettings(false)}
          onUpdate={(newData) => {
            setProfileData(newData);
            if (newData?.username) setGlobalUsername(newData.username);
          }}
        />
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ position: 'relative', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, color: active ? 'var(--bg-color)' : 'var(--text-secondary)', transition: 'color 0.2s ease', zIndex: 1 }}>
      {active && (
        <motion.div
          layoutId="active-nav-pill"
          style={{ position: 'absolute', inset: 0, background: 'var(--primary)', borderRadius: '8px', zIndex: -1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: '1.05rem',
        fontWeight: 600,
        color: active ? 'var(--bg-color)' : 'var(--text-primary)',
        background: active ? 'var(--primary)' : 'transparent',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {children}
    </Link>
  );
}
