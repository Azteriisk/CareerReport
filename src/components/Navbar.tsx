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
import styles from './Navbar.module.css';

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
  const [hasRecruiterAccess, setHasRecruiterAccess] = useState<boolean>(false);

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

      // Check if user owns a business
      const { data: business } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('owner_id', user.id)
        .maybeSingle();

      let ownsBusiness = false;
      if (business?.slug) {
        setBusinessSlug(business.slug);
        ownsBusiness = true;
        setHasRecruiterAccess(true);
      }

      // If not owner, check employee table for jobs posting permissions
      if (!ownsBusiness) {
        const { data: employeeRecord } = await supabase
          .from('company_employees')
          .select('status')
          .eq('user_id', user.id)
          .like('status', 'approved%')
          .maybeSingle();

        const status = employeeRecord?.status || '';
        if (status.includes('jobs')) {
          setHasRecruiterAccess(true);
        }
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
      <header className={`mobile-header ${styles.header}`}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <FileText size={18} />
          </div>
          <h1 className={styles.logoText}>CareerReport</h1>
        </Link>

        {/* Desktop nav pills */}
        <nav className={`desktop-nav ${styles.desktopNav}`}>
          <NavLink href="/" active={pathname === '/'}>Home</NavLink>
          <NavLink href="/builder" active={pathname === '/builder'}>{isSignedIn ? 'My Resume' : 'Create Resume'}</NavLink>
          <NavLink href="/jobs" active={pathname?.startsWith('/jobs') && pathname !== '/jobs/dashboard'}>Jobs</NavLink>
          {isSignedIn && hasRecruiterAccess && (
            <NavLink href="/jobs/dashboard" active={pathname === '/jobs/dashboard'}>Job Center</NavLink>
          )}
          {isSignedIn && businessSlug && (
            <NavLink href={`/co/${businessSlug}`} active={pathname?.startsWith('/co/')}>My Company</NavLink>
          )}
          {isSignedIn ? (
            <NavLink href={`/u/${displayUsername}`} active={pathname?.startsWith('/u/')}>Profile</NavLink>
          ) : (
            <SignInButton mode="modal">
              <button className={styles.signInBtn}>Sign In</button>
            </SignInButton>
          )}
        </nav>

        {/* Desktop auth section */}
        <div className={`nav-auth-section ${styles.authSection}`}>
          <Link href="/support" className={styles.supportLink}>Support</Link>
          {isSignedIn ? (
            <>
              <motion.button
                onClick={handleOpenSettings}
                whileTap={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className={styles.settingsBtn}
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
              <button className={`btn btn-primary ${styles.signUpBtn}`}>Sign Up Free</button>
            </SignUpButton>
          )}
        </div>

        {/* Mobile: right side — avatar or hamburger */}
        <div className={`mobile-nav-right ${styles.mobileNavRight}`}>
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
            className={styles.hamburgerBtn}
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
            className={styles.mobileDrawer}
          >
            <MobileNavLink href="/" active={pathname === '/'}>Home</MobileNavLink>
            <MobileNavLink href="/builder" active={pathname === '/builder'}>{isSignedIn ? 'My Resume' : 'Create Resume'}</MobileNavLink>
            <MobileNavLink href="/jobs" active={pathname?.startsWith('/jobs') && pathname !== '/jobs/dashboard'}>Jobs</MobileNavLink>
            {isSignedIn && hasRecruiterAccess && (
              <MobileNavLink href="/jobs/dashboard" active={pathname === '/jobs/dashboard'}>Job Center</MobileNavLink>
            )}
            {isSignedIn && businessSlug && (
              <MobileNavLink href={`/co/${businessSlug}`} active={pathname?.startsWith('/co/')}>My Company</MobileNavLink>
            )}
            {isSignedIn && (
              <MobileNavLink href={`/u/${displayUsername}`} active={pathname?.startsWith('/u/')}>Profile</MobileNavLink>
            )}
            <MobileNavLink href="/support" active={pathname === '/support'}>Support</MobileNavLink>

            <div className={styles.mobileDrawerDivider} />

            {isSignedIn ? (
              <button onClick={handleOpenSettings} className={styles.mobileSettingsBtn}>
                <Settings size={18} />
                Account Settings
              </button>
            ) : (
              <div className={styles.mobileAuthButtons}>
                <SignInButton mode="modal">
                  <button className={styles.mobileSignInBtn}>Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className={`btn btn-primary ${styles.mobileSignUpBtn}`}>Sign Up Free</button>
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
    <Link href={href} className={`${styles.navLink} ${active ? styles.navLinkActive : styles.navLinkInactive}`}>
      {active && (
        <motion.div
          layoutId="active-nav-pill"
          className={styles.navLinkPill}
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
      className={`${styles.mobileNavLink} ${active ? styles.mobileNavLinkActive : styles.mobileNavLinkInactive}`}
    >
      {children}
    </Link>
  );
}
