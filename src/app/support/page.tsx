"use client";
import Link from "next/link";
import { FileText, Send } from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="landing-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Support & Feedback</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Running into issues or have a feature request? Let us know.</p>

        {submitted ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Message Sent!</h3>
            <p style={{ margin: 0 }}>Our team has received your ticket and will follow up shortly.</p>
            <button onClick={() => setSubmitted(false)} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>Submit Another</button>
          </div>
        ) : (
          <form 
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Name</label>
              <input type="text" required className="input-field" placeholder="Jane Doe" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Email Address</label>
              <input type="email" required className="input-field" placeholder="john@example.com" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Issue Type</label>
              <select className="input-field" required>
                <option value="bug">Report a Bug</option>
                <option value="feature">Feature Request</option>
                <option value="account">Account / Billing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Description</label>
              <textarea required className="input-field" rows={5} placeholder="Please provide details about your issue..."></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
              Submit Ticket <Send size={18} />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
