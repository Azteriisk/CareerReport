"use client";

import React from 'react';

const months = [
  { v: '01', l: 'Jan.' }, { v: '02', l: 'Feb.' }, { v: '03', l: 'Mar.' },
  { v: '04', l: 'Apr.' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun.' },
  { v: '07', l: 'Jul.' }, { v: '08', l: 'Aug.' }, { v: '09', l: 'Sep.' },
  { v: '10', l: 'Oct.' }, { v: '11', l: 'Nov.' }, { v: '12', l: 'Dec.' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => (currentYear - i + 10).toString());

export interface MonthYearPickerProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange, disabled }) => {
  if (disabled) {
    return <input type="text" disabled className="input-field" style={{ padding: '0.5rem', minWidth: 0, opacity: 0.5 }} value="Present" />;
  }

  const parts = value ? value.split('-') : ['', ''];
  const year = parts[0] || '';
  const month = parts[1] || '';

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <select
        className={`input-field ${!month ? 'empty-date' : ''}`}
        style={{ padding: '0.5rem', minWidth: 0, flex: 1, cursor: 'pointer' }}
        value={month}
        onChange={e => onChange(`${year || currentYear}-${e.target.value}`)}
      >
        <option value="" disabled hidden>Mo.</option>
        {months.map(m => <option key={m.v} value={m.v} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{m.l}</option>)}
      </select>
      <select
        className={`input-field ${!year ? 'empty-date' : ''}`}
        style={{ padding: '0.5rem', minWidth: 0, flex: 1, cursor: 'pointer' }}
        value={year}
        onChange={e => onChange(`${e.target.value}-${month || '01'}`)}
      >
        <option value="" disabled hidden>Yr.</option>
        {years.map(y => <option key={y} value={y} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{y}</option>)}
      </select>
    </div>
  );
};
