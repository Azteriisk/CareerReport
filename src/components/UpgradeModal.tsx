import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Lock, CreditCard, ShieldCheck, Loader2, ArrowRight, Check } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onUpgradeSuccess?: () => void;
}

export function UpgradeModal({ isOpen, onClose, featureName = "Premium AI Features", onUpgradeSuccess }: UpgradeModalProps) {
  const { user, isSignedIn } = useUser();
  const [step, setStep] = useState<'landing' | 'checkout' | 'processing' | 'success'>('landing');
  const [cardName, setCardName] = useState(user?.fullName || 'Alec');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12 / 29');
  const [cvc, setCVC] = useState('424');
  const [zip, setZip] = useState('72201');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCheckout = () => {
    if (!isSignedIn) {
      alert("Please sign in or create an account to upgrade your profile!");
      return;
    }
    setStep('checkout');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    setStep('processing');

    try {
      // Simulate Stripe payment network latency (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Persist the upgrade in the Supabase database
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase upgrade error:', error);
        throw new Error('Database updates failed. Please try again.');
      }

      // Success! Move to the next step and trigger callback
      setStep('success');
      if (onUpgradeSuccess) {
        onUpgradeSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during transaction.');
      setStep('checkout');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state for next open
    setStep('landing');
    setIsSubmitting(false);
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
        {step !== 'processing' && (
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

        {/* STEP 1: Landing Page Description */}
        {step === 'landing' && (
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
                Cancel anytime. Secure payment processing.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Simulated Stripe Card Form */}
        {step === 'checkout' && (
          <form onSubmit={handlePay} style={{ padding: '2.5rem 2rem 2rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(250, 189, 47, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>Secure Checkout</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Powered by Stripe Test Sandbox</p>
              </div>
            </div>

            {errorMessage && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.5px' }}>Cardholder Name</label>
                <input 
                  type="text" 
                  required
                  value={cardName} 
                  onChange={e => setCardName(e.target.value)}
                  className="input-field" 
                  style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }} 
                  placeholder="e.g. Alec" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.5px' }}>Card Details</label>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '8px', 
                  background: 'rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', padding: '0.75rem 1rem' }}>
                    <CreditCard size={18} color="var(--text-secondary)" style={{ marginRight: '0.75rem' }} />
                    <input 
                      type="text" 
                      required
                      value={cardNumber} 
                      onChange={e => setCardNumber(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.95rem' }} 
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: 1, padding: '0.75rem 1rem', borderRight: '1px solid var(--glass-border)' }}>
                      <input 
                        type="text" 
                        required
                        value={expiry} 
                        onChange={e => setExpiry(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.95rem', textAlign: 'center' }} 
                        placeholder="MM / YY" 
                      />
                    </div>
                    <div style={{ flex: 1, padding: '0.75rem 1rem', borderRight: '1px solid var(--glass-border)' }}>
                      <input 
                        type="text" 
                        required
                        value={cvc} 
                        onChange={e => setCVC(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.95rem', textAlign: 'center' }} 
                        placeholder="CVC" 
                      />
                    </div>
                    <div style={{ flex: 1, padding: '0.75rem 1rem' }}>
                      <input 
                        type="text" 
                        required
                        value={zip} 
                        onChange={e => setZip(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.95rem', textAlign: 'center' }} 
                        placeholder="ZIP" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
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
            >
              <Lock size={18} /> Pay $9.00 USD
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="var(--accent)" />
              <span>Payments are encrypted and processed securely.</span>
            </div>
          </form>
        )}

        {/* STEP 3: Simulated Payment Processing State */}
        {step === 'processing' && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>Authorizing Charge...</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '280px' }}>
                Connecting to Stripe secure banking gateway to authorize premium benefits.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Checkout Successful Screen */}
        {step === 'success' && (
          <div style={{ padding: '3.5rem 2rem 2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div style={{ 
              width: '72px', 
              height: '72px', 
              background: 'var(--accent)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
            }}>
              <Check size={36} color="var(--bg-color)" style={{ strokeWidth: 3 }} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Upgrade Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 2.25rem 0', lineHeight: 1.5, maxWidth: '320px' }}>
              Welcome to **CareerReport Pro**! All professional AI writer capabilities are now permanently unlocked for your account.
            </p>

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
              onClick={handleClose}
            >
              Start Using AI Writer <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
