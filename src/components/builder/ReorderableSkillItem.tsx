"use client";

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus, Wand2, Loader2 } from 'lucide-react';
import { ResumeData } from '@/lib/resume-schema';

export interface ReorderableSkillItemProps {
  skillGroup: ResumeData['skills'][number];
  index: number;
  total: number;
  aiLoading: Record<string, boolean>;
  onChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onGenerateAI: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onMoveKeyword: (skillId: string, keywordIndex: number, direction: -1 | 1) => void;
}

export const ReorderableSkillItem: React.FC<ReorderableSkillItemProps> = ({
  skillGroup,
  index,
  total,
  aiLoading,
  onChange,
  onRemove,
  onGenerateAI,
  onMove,
  onMoveKeyword,
}) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={skillGroup}
      id={skillGroup.id}
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
            title="Drag to reorder skill category"
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
              title="Move category up"
              aria-label="Move category up"
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
              title="Move category down"
              aria-label="Move category down"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginLeft: '4px' }}>
            {skillGroup.name || `Category ${index + 1}`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(skillGroup.id)}
          className="btn-icon"
          style={{ color: 'var(--danger)', padding: '2px' }}
          title="Delete skill category"
          aria-label="Delete skill category"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="label" style={{ fontSize: '0.75rem' }}>Category Name</label>
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.5rem' }}
          value={skillGroup.name}
          onChange={(e) => onChange(skillGroup.id, 'name', e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Skills
            <button
              type="button"
              onClick={() => onGenerateAI(skillGroup.id)}
              disabled={aiLoading[`skill-${skillGroup.id}`]}
              className="btn-icon"
              style={{
                fontSize: '0.7rem',
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
              {aiLoading[`skill-${skillGroup.id}`] ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  <Wand2 size={12} /> AI Generate
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onChange(skillGroup.id, 'keywords', [...(skillGroup.keywords || []), ''])}
            className="btn-icon"
            style={{ padding: '2px', color: 'var(--primary)' }}
            title="Add Skill"
            aria-label="Add Skill"
          >
            <Plus size={14} />
          </button>
        </label>
        {(skillGroup.keywords || []).map((keyword, kIndex) => (
          <div key={kIndex} style={{ display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
              <button
                type="button"
                onClick={() => onMoveKeyword(skillGroup.id, kIndex, -1)}
                disabled={kIndex === 0}
                className="btn-icon"
                style={{
                  padding: '2px',
                  opacity: kIndex === 0 ? 0.25 : 0.7,
                  cursor: kIndex === 0 ? 'default' : 'pointer',
                }}
                title="Move skill up"
                aria-label="Move skill up"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => onMoveKeyword(skillGroup.id, kIndex, 1)}
                disabled={kIndex === (skillGroup.keywords || []).length - 1}
                className="btn-icon"
                style={{
                  padding: '2px',
                  opacity: kIndex === (skillGroup.keywords || []).length - 1 ? 0.25 : 0.7,
                  cursor: kIndex === (skillGroup.keywords || []).length - 1 ? 'default' : 'pointer',
                }}
                title="Move skill down"
                aria-label="Move skill down"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1 }}
              value={keyword}
              onChange={(e) => {
                const newKeywords = [...(skillGroup.keywords || [])];
                newKeywords[kIndex] = e.target.value;
                onChange(skillGroup.id, 'keywords', newKeywords);
              }}
            />
            <button
              type="button"
              onClick={() => {
                const newKeywords = (skillGroup.keywords || []).filter((_, i) => i !== kIndex);
                onChange(skillGroup.id, 'keywords', newKeywords);
              }}
              className="btn-icon"
              style={{ color: 'var(--danger)', padding: '4px' }}
              title="Delete skill"
              aria-label="Delete skill"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </Reorder.Item>
  );
};
