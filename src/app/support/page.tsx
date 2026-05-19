"use client";
import Link from "next/link";
import { FileText, Send, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function SupportPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("bug");
  const [description, setDescription] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Autofill user details when Clerk session is loaded and signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setName(user.fullName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [isLoaded, isSignedIn, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          issueType,
          description,
          userId: user?.id || null,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit support ticket.");
      }

      setSubmitted(true);
      setDescription(""); // Clear only the description, keep name/email
    } catch (err: any) {
      console.error("Support Ticket Submission Error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--text-primary) 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Support & Feedback</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Running into issues or have a feature request? Let us know.</p>

        {submitted ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent)', padding: '2.5rem 2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', marginBottom: '1rem', color: '#10b981' }}>
              <Send size={24} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Ticket Submitted Successfully!</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: 1.5 }}>
              Thank you for reaching out. We have logged your request and our support desk will follow up at <strong>{email}</strong> shortly.
            </p>
            <button 
              onClick={() => setSubmitted(false)} 
              className="btn btn-secondary" 
              style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px' }}
            >
              Submit Another Ticket
            </button>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface-color)', padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}
          >
            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Name</label>
              <input 
                type="text" 
                required 
                disabled={isSubmitting}
                className="input-field" 
                placeholder="Jane Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Email Address</label>
              <input 
                type="email" 
                required 
                disabled={isSubmitting}
                className="input-field" 
                placeholder="john@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Issue Type</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="input-field" 
                  required
                  disabled={isSubmitting}
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#18181b', color: 'var(--text-primary)', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="bug">Report a Bug</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account / Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="label" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Description</label>
              <textarea 
                required 
                disabled={isSubmitting}
                className="input-field" 
                rows={5} 
                placeholder="Please provide details about your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '120px' }}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary" 
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '8px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.8 : 1 }}
            >
              {isSubmitting ? (
                <>
                  Submitting Ticket <Loader2 className="animate-spin" size={18} />
                </>
              ) : (
                <>
                  Submit Ticket <Send size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

