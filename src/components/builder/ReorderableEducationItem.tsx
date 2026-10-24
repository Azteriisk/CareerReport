"use client";

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { MonthYearPicker } from './MonthYearPicker';
import { ResumeData } from '@/lib/resume-schema';

export interface ReorderableEducationItemProps {
  edu: ResumeData['education'][number];
  index: number;
  total: number;
  onChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

export const ReorderableEducationItem: React.FC<ReorderableEducationItemProps> = ({
  edu,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={edu}
      id={edu.id}
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
            title="Drag to reorder education"
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
              title="Move education up"
              aria-label="Move education up"
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
              title="Move education down"
              aria-label="Move education down"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginLeft: '4px' }}>
            {edu.studyType || edu.institution ? (
              <span>
                {edu.studyType || 'Degree'}{edu.institution ? ` • ${edu.institution}` : ''}
              </span>
            ) : (
              `Education ${index + 1}`
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(edu.id)}
          className="btn-icon"
          style={{ color: 'var(--danger)', padding: '2px' }}
          title="Delete education"
          aria-label="Delete education"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Institution</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={edu.institution}
          onChange={(e) => onChange(edu.id, 'institution', e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Area of Study</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={edu.area}
          onChange={(e) => onChange(edu.id, 'area', e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>Degree / Study Type</label>
          <input
            type="text"
            className="input-field"
            style={{ padding: '0.5rem' }}
            value={edu.studyType}
            onChange={(e) => onChange(edu.id, 'studyType', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>GPA / Score</label>
          <input
            type="text"
            className="input-field"
            style={{ padding: '0.5rem' }}
            value={edu.score}
            onChange={(e) => onChange(edu.id, 'score', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>Start Date</label>
          <MonthYearPicker value={edu.startDate} onChange={(val) => onChange(edu.id, 'startDate', val)} />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>End Date</label>
          <MonthYearPicker
            disabled={edu.endDate === 'Present'}
            value={edu.endDate === 'Present' ? '' : edu.endDate}
            onChange={(val) => onChange(edu.id, 'endDate', val)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
        <input
          type="checkbox"
          id={`current-edu-${edu.id}`}
          checked={edu.endDate === 'Present'}
          onChange={(e) => onChange(edu.id, 'endDate', e.target.checked ? 'Present' : '')}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor={`current-edu-${edu.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
          Currently studying
        </label>
      </div>
    </Reorder.Item>
  );
};
