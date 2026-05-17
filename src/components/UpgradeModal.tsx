import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onUpgradeSuccess?: () => void;
}

export function UpgradeModal({ isOpen, onClose, featureName = "Premium AI Features" }: UpgradeModalProps) {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCheckout = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in or create an account to upgrade your profile!");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize Stripe checkout');
      }

      const { url } = await response.json();
      
      // Redirect the user to the Stripe Checkout Page
      window.location.href = url;
    } catch (err: any) {
      console.error('Stripe Checkout redirection error:', err);
      setErrorMessage(err.message || 'Unable to connect to Stripe. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLoading(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
      padding: '1rem'
    }} onClick={handleClose}>
      <div style={{
        background: 'var(--surface-color)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        {!loading && (
          <button 
            onClick={handleClose}
            className="btn-icon hover-opacity" 
            style={{ 
              position: 'absolute', 
              top: '1.25rem', 
              right: '1.25rem', 
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>
        )}

        {loading ? (
          /* Loading State */
          <div style={{ padding: '5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>Connecting to Stripe...</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '280px' }}>
                Securing a payment session. You will be redirected to Stripe to finalize your upgrade.
              </p>
            </div>
          </div>
        ) : !isSignedIn ? (
          /* Premium Auth Prompt for Unsigned Guest Users */
          <div>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
              padding: '2.5rem 2rem 2rem 2rem', 
              textAlign: 'center',
              borderBottom: '1px solid var(--glass-border)'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'var(--primary)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 25px rgba(250, 189, 47, 0.45)'
              }}>
                <Sparkles size={32} color="var(--bg-color)" />
              </div>
              
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Account Required</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                To unlock powerful features like <strong>{featureName}</strong>, you need to create a free account or sign in first.
              </p>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {[
                  "Save multiple resumes to the cloud",
                  "Unlock state-of-the-art AI generation tools",
                  "Get a personalized public shareable URL",
                  "Directly connect with top hiring employers"
                ].map((benefit, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                    <CheckCircle size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{benefit}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SignUpButton mode="modal">
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    Create Free Account
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="btn btn-secondary" style={{ width: '100%', padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    Sign In to Existing Account
                  </button>
                </SignInButton>
              </div>
            </div>
          </div>
        ) : (
          /* Upgrade Description Step */
          <div>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
              padding: '2.5rem 2rem 2rem 2rem', 
              textAlign: 'center',
              borderBottom: '1px solid var(--glass-border)'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'var(--primary)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 25px rgba(250, 189, 47, 0.45)'
              }}>
                <Sparkles size={32} color="var(--bg-color)" />
              </div>
              
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Unlock {featureName}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                Upgrade to CareerReport Pro to instantly generate, rewrite, and import your resumes with state-of-the-art AI.
              </p>
            </div>

            <div style={{ padding: '2rem' }}>
              {errorMessage && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.25rem' }}>
                {[
                  "Instantly import and parse PDF resumes",
                  "AI-powered professional summaries",
                  "Smart bullet point generation for jobs",
                  "Priority access to new templates",
                  "Advanced analytics for your profile"
                ].map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-primary)' }}>
                    <CheckCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '1.1rem', 
                  fontSize: '1.1rem', 
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
                onClick={handleStartCheckout}
              >
                <Lock size={18} /> Upgrade to Pro - $9/mo
              </button>
              <p style={{ textAlign: 'center', margin: '1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Cancel anytime. Secure checkout powered by Stripe.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
