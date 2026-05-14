import React from 'react';
import { X, Sparkles, CheckCircle, Lock } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradeModal({ isOpen, onClose, featureName = "Premium AI Features" }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ 
          background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
          padding: '2rem', 
          textAlign: 'center',
          position: 'relative',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <button 
            onClick={onClose}
            className="btn-icon hover-opacity" 
            style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
          
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--primary)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 20px rgba(250, 189, 47, 0.4)'
          }}>
            <Sparkles size={32} color="var(--bg-color)" />
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Unlock {featureName}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Upgrade to CareerReport Pro to instantly generate, rewrite, and import your resumes with state-of-the-art AI.
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {[
              "Instantly import and parse PDF resumes",
              "AI-powered professional summaries",
              "Smart bullet point generation for jobs",
              "Priority access to new templates",
              "Advanced analytics for your profile"
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                <CheckCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.95rem' }}>{feature}</span>
              </div>
            ))}
          </div>

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem', 
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onClick={() => {
              alert("Stripe Checkout integration coming soon!");
              onClose();
            }}
          >
            <Lock size={18} /> Upgrade to Pro - $9/mo
          </button>
          <p style={{ textAlign: 'center', margin: '1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
