'use client';

import React, { useState } from 'react';
import { Flag, X, Loader2, CheckCircle2 } from 'lucide-react';
import styles from './ReportModal.module.css';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'message' | 'user';
  targetId?: string;
  targetUserId?: string;
  targetName?: string;
}

const REPORT_REASONS = [
  'Spam, scam, or commercial solicitation',
  'Harassment, bullying, or hate speech',
  'Sexually explicit or inappropriate content',
  'Impersonation or misleading information',
  'Violence or illegal activities',
  'Other violation of Community Guidelines',
];

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetUserId,
  targetName,
}: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ugc/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          targetUserId,
          reason,
          details,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit report. Please try again.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <Flag size={20} color="var(--danger)" />
            <h2 className={styles.title}>
              Report {targetType === 'user' ? 'User' : targetType === 'message' ? 'Message' : 'Post'}
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className={styles.successCard}>
            <CheckCircle2 size={36} />
            <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>Report Submitted</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>
              Thank you for keeping CareerReport safe and professional. Our team reviews all reports within 24 hours.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.description}>
              {targetName ? (
                <>Help us understand what is wrong with this content from <strong>{targetName}</strong>.</>
              ) : (
                <>Help us understand why you are flagging this content for moderation review.</>
              )}
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.label}>
                Reason for report
                <select
                  className={styles.select}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                >
                  {REPORT_REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Additional details (optional)
                <textarea
                  className={styles.textarea}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Provide any context that will help us investigate..."
                />
              </label>

              {error && (
                <p style={{ color: 'var(--error)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
