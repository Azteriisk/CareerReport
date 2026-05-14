import Link from "next/link";
import { FileText, Cpu, EyeOff, LayoutTemplate } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="landing-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1.2 }}>How CareerReport is <span className="premium-gradient-text">Different</span></h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.6 }}>
          Traditionally, making a beautiful resume meant sacrificing compatibility. Complex multi-column layouts confuse Applicant Tracking Systems (ATS), meaning your perfectly designed resume gets scrambled when you upload it to a job board. Not anymore.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}><LayoutTemplate size={32} /></div>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Uncompromised Design</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Because we don't rely on the visual text for parsing, we can use complex grid layouts, split columns, colored sidebars, and circular headshots without worrying about how a machine will read it. Your resume looks like it was designed by a pro.
            </p>
          </div>

          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent)' }}><EyeOff size={32} /></div>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Invisible ATS Metadata</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              When you export your PDF, we inject a hidden text layer at the absolute top of the document. This layer contains a perfectly flat, machine-readable version of your resume. To humans, it's invisible. To machines, it's exactly what they are looking for.
            </p>
          </div>

          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: '#8b5cf6' }}><Cpu size={32} /></div>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>AI & LLM Native Payload</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Modern job boards use AI to autofill your data. Inside our hidden metadata, we embed a massive raw JSON payload containing your entire resume schema. When an AI like GPT-4 ingests your PDF, it instantly identifies the JSON block and extracts your data with 100% flawless accuracy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
