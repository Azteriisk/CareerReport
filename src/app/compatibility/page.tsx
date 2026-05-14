"use client";
import Link from "next/link";
import { FileText, ServerCrash } from "lucide-react";
import { useState } from "react";

export default function CompatibilityPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isCompany, setIsCompany] = useState(false);

  return (
    <div className="landing-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Report ATS Incompatibility</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          We inject machine-readable invisible payloads into every PDF to ensure perfect extraction. If a specific Applicant Tracking System or AI Autofill tool fails to parse our PDFs, please report it here so we can analyze their parser and push an update.
        </p>

        {submitted ? (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Report Received</h3>
            <p style={{ margin: 0 }}>Thank you for helping us make CareerReport the most compatible platform in the world. Our engineering team will investigate the parser immediately.</p>
            <button onClick={() => setSubmitted(false)} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>Report Another</button>
          </div>
        ) : (
          <form 
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Which Job Board, ATS, or Company portal failed?</label>
              <input type="text" required className="input-field" placeholder="e.g. Workday, Greenhouse, Taleo, Company XYZ" />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">What specifically failed to parse?</label>
              <select className="input-field" required>
                <option value="everything">Everything was blank/scrambled</option>
                <option value="dates">Dates or timelines were incorrect</option>
                <option value="bullets">Experience bullet points were merged together</option>
                <option value="contact">Contact info or Name was missing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', background: 'var(--surface-highlight)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <input 
                type="checkbox" 
                id="isCompany" 
                checked={isCompany} 
                onChange={(e) => setIsCompany(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isCompany" style={{ cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                I represent the company that owns this ATS/Parser
              </label>
            </div>

            {isCompany && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  We'd love to collaborate with your engineering team to ensure our payload structure matches your ingestion requirements. Please provide your contact info.
                </p>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Work Email</label>
                  <input type="email" required className="input-field" placeholder="engineering@yourcompany.com" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Company Name</label>
                  <input type="text" required className="input-field" placeholder="Your Company" />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', marginTop: '0.5rem' }}>
              Submit Report <ServerCrash size={18} />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
