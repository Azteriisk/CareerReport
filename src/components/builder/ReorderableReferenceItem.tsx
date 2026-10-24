"use client";

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { ResumeData } from '@/lib/resume-schema';

export interface ReorderableReferenceItemProps {
  item: NonNullable<ResumeData['references']>[number];
  index: number;
  total: number;
  onChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

export const ReorderableReferenceItem: React.FC<ReorderableReferenceItemProps> = ({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
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
            title="Drag to reorder reference"
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
              title="Move reference up"
              aria-label="Move reference up"
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
              title="Move reference down"
              aria-label="Move reference down"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginLeft: '4px' }}>
            {item.name || `Reference ${index + 1}`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="btn-icon"
          style={{ color: 'var(--danger)', padding: '2px' }}
          title="Delete reference"
          aria-label="Delete reference"
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
          value={item.name}
          onChange={(e) => onChange(item.id, 'name', e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Contact Info / Description</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={item.reference}
          onChange={(e) => onChange(item.id, 'reference', e.target.value)}
        />
      </div>
    </Reorder.Item>
  );
};
