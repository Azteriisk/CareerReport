"use client";

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { ResumeData } from '@/lib/resume-schema';

export interface ReorderableCertificationItemProps {
  cert: NonNullable<ResumeData['certifications']>[number];
  index: number;
  total: number;
  onChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

export const ReorderableCertificationItem: React.FC<ReorderableCertificationItemProps> = ({
  cert,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={cert}
      id={cert.id}
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
            title="Drag to reorder certification"
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
              title="Move certification up"
              aria-label="Move certification up"
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
              title="Move certification down"
              aria-label="Move certification down"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginLeft: '4px' }}>
            {cert.name ? (
              <span>
                {cert.name}{cert.issuer ? ` • ${cert.issuer}` : ''}
              </span>
            ) : (
              `Certification ${index + 1}`
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(cert.id)}
          className="btn-icon"
          style={{ color: 'var(--danger)', padding: '2px' }}
          title="Delete certification"
          aria-label="Delete certification"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Name</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={cert.name}
          onChange={(e) => onChange(cert.id, 'name', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>Issuer</label>
          <input
            type="text"
            className="input-field"
            style={{ padding: '0.5rem' }}
            value={cert.issuer}
            onChange={(e) => onChange(cert.id, 'issuer', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>Date</label>
          <input
            type="text"
            className="input-field"
            style={{ padding: '0.5rem' }}
            placeholder="MM/YYYY"
            value={cert.date}
            onChange={(e) => onChange(cert.id, 'date', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>URL (Optional)</label>
        <input
          type="url"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={cert.url || ''}
          onChange={(e) => onChange(cert.id, 'url', e.target.value)}
        />
      </div>
    </Reorder.Item>
  );
};
