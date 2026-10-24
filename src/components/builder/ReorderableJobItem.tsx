"use client";

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus, Wand2, Loader2, Lock } from 'lucide-react';
import { MonthYearPicker } from './MonthYearPicker';
import { ResumeData } from '@/lib/resume-schema';

export interface ReorderableJobItemProps {
  job: ResumeData['work'][number];
  index: number;
  total: number;
  isPro: boolean;
  aiLoading: Record<string, boolean>;
  onChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onJobAI: (id: string, type: 'summary' | 'bullets') => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onMoveHighlight: (jobId: string, highlightIndex: number, direction: -1 | 1) => void;
}

export const ReorderableJobItem: React.FC<ReorderableJobItemProps> = ({
  job,
  index,
  total,
  isPro,
  aiLoading,
  onChange,
  onRemove,
  onJobAI,
  onMove,
  onMoveHighlight,
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={job}
      id={job.id}
      as="div"
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.01,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        zIndex: 40,
      }}
      style={{
        background: 'rgba(0,0,0,0.2)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid var(--glass-border)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            onPointerDown={(e) => controls.start(e)}
            style={{
              cursor: 'grab',
              touchAction: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '4px',
            }}
            title="Drag to reorder job"
            aria-label="Drag handle"
          >
            <GripVertical size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              className="btn-icon"
              style={{
                padding: '2px',
                opacity: index === 0 ? 0.25 : 0.8,
                cursor: index === 0 ? 'default' : 'pointer',
              }}
              title="Move job up"
              aria-label="Move job up"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={index === total - 1}
              className="btn-icon"
              style={{
                padding: '2px',
                opacity: index === total - 1 ? 0.25 : 0.8,
                cursor: index === total - 1 ? 'default' : 'pointer',
              }}
              title="Move job down"
              aria-label="Move job down"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginLeft: '4px' }}>
            {job.position || job.name ? (
              <span>
                {job.position || 'Position'}{job.name ? ` • ${job.name}` : ''}
              </span>
            ) : (
              `Job ${index + 1}`
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(job.id)}
          className="btn-icon"
          style={{ color: 'var(--danger)', padding: '2px' }}
          title="Delete job"
          aria-label="Delete job"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Company</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={job.name}
          onChange={(e) => onChange(job.id, 'name', e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Position</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={job.position}
          onChange={(e) => onChange(job.id, 'position', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>Start Date</label>
          <MonthYearPicker value={job.startDate} onChange={(val) => onChange(job.id, 'startDate', val)} />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>End Date</label>
          <MonthYearPicker
            disabled={job.endDate === 'Present'}
            value={job.endDate === 'Present' ? '' : job.endDate}
            onChange={(val) => onChange(job.id, 'endDate', val)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="checkbox"
          id={`current-${job.id}`}
          checked={job.endDate === 'Present'}
          onChange={(e) => onChange(job.id, 'endDate', e.target.checked ? 'Present' : '')}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor={`current-${job.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
          I currently work here
        </label>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Summary
          <button
            type="button"
            onClick={() => onJobAI(job.id, 'summary')}
            disabled={aiLoading[`${job.id}-summary`]}
            className="btn-icon"
            style={{
              fontSize: '0.65rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {aiLoading[`${job.id}-summary`] ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <>
                <Wand2 size={10} /> AI Generate {!isPro && <Lock size={8} />}
              </>
            )}
          </button>
        </label>
        <textarea
          className="input-field"
          style={{ padding: '0.5rem', minHeight: '60px' }}
          value={job.summary}
          onChange={(e) => onChange(job.id, 'summary', e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Bullet Points
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onJobAI(job.id, 'bullets')}
              disabled={aiLoading[`${job.id}-bullets`]}
              className="btn-icon"
              style={{
                fontSize: '0.65rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {aiLoading[`${job.id}-bullets`] ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <>
                  <Wand2 size={10} /> AI Generate {!isPro && <Lock size={8} />}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onChange(job.id, 'highlights', [...(job.highlights || []), ''])}
              className="btn-icon"
              style={{ padding: '2px', color: 'var(--primary)' }}
              title="Add Bullet Point"
              aria-label="Add Bullet Point"
            >
              <Plus size={14} />
            </button>
          </div>
        </label>
        {(job.highlights || []).map((highlight, hIndex) => (
          <div key={hIndex} style={{ display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
              <button
                type="button"
                onClick={() => onMoveHighlight(job.id, hIndex, -1)}
                disabled={hIndex === 0}
                className="btn-icon"
                style={{
                  padding: '2px',
                  opacity: hIndex === 0 ? 0.25 : 0.7,
                  cursor: hIndex === 0 ? 'default' : 'pointer',
                }}
                title="Move bullet up"
                aria-label="Move bullet up"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => onMoveHighlight(job.id, hIndex, 1)}
                disabled={hIndex === (job.highlights || []).length - 1}
                className="btn-icon"
                style={{
                  padding: '2px',
                  opacity: hIndex === (job.highlights || []).length - 1 ? 0.25 : 0.7,
                  cursor: hIndex === (job.highlights || []).length - 1 ? 'default' : 'pointer',
                }}
                title="Move bullet down"
                aria-label="Move bullet down"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}
              value={highlight}
              onChange={(e) => {
                const newHighlights = [...(job.highlights || [])];
                newHighlights[hIndex] = e.target.value;
                onChange(job.id, 'highlights', newHighlights);
              }}
            />
            <button
              type="button"
              onClick={() => {
                const newHighlights = (job.highlights || []).filter((_, i) => i !== hIndex);
                onChange(job.id, 'highlights', newHighlights);
              }}
              className="btn-icon"
              style={{ color: 'var(--danger)', padding: '4px' }}
              title="Delete bullet point"
              aria-label="Delete bullet point"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </Reorder.Item>
  );
};
