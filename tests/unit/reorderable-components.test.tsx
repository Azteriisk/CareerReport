import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Reorder } from 'framer-motion';
import { ReorderableJobItem } from '../../src/components/builder/ReorderableJobItem';
import { ReorderableEducationItem } from '../../src/components/builder/ReorderableEducationItem';
import { ReorderableSkillItem } from '../../src/components/builder/ReorderableSkillItem';
import { ReorderableProjectItem } from '../../src/components/builder/ReorderableProjectItem';
import { ReorderableReferenceItem } from '../../src/components/builder/ReorderableReferenceItem';
import { ReorderableCertificationItem } from '../../src/components/builder/ReorderableCertificationItem';

describe('ReorderableJobItem', () => {
  const mockJob = {
    id: 'job-1',
    name: 'Tech Corp',
    position: 'Staff Engineer',
    url: 'https://example.com',
    startDate: '2022-01',
    endDate: 'Present',
    summary: 'Led infrastructure architecture and scaling.',
    highlights: ['Bullet point 1', 'Bullet point 2']
  };

  it('renders job details and controls', () => {
    const onMove = vi.fn();
    const onMoveHighlight = vi.fn();
    const onChange = vi.fn();
    const onRemove = vi.fn();
    const onJobAI = vi.fn();

    const { getByText, getByTitle, getByLabelText } = render(
      <Reorder.Group axis="y" values={[mockJob]} onReorder={() => {}} as="div">
        <ReorderableJobItem
          job={mockJob}
          index={0}
          total={2}
          isPro={true}
          aiLoading={{}}
          onChange={onChange}
          onRemove={onRemove}
          onJobAI={onJobAI}
          onMove={onMove}
          onMoveHighlight={onMoveHighlight}
        />
      </Reorder.Group>
    );

    expect(getByText(/Staff Engineer • Tech Corp/)).toBeDefined();
    expect(getByLabelText('Drag handle')).toBeDefined();

    // Top item: move up button disabled
    const upBtn = getByTitle('Move job up');
    expect(upBtn.hasAttribute('disabled')).toBe(true);

    // Move down button enabled
    const downBtn = getByTitle('Move job down');
    expect(downBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(downBtn);
    expect(onMove).toHaveBeenCalledWith(0, 1);
  });

  it('reorders bullet points within a job', () => {
    const onMoveHighlight = vi.fn();

    const { getAllByTitle } = render(
      <Reorder.Group axis="y" values={[mockJob]} onReorder={() => {}} as="div">
        <ReorderableJobItem
          job={mockJob}
          index={1}
          total={2}
          isPro={true}
          aiLoading={{}}
          onChange={() => {}}
          onRemove={() => {}}
          onJobAI={() => {}}
          onMove={() => {}}
          onMoveHighlight={onMoveHighlight}
        />
      </Reorder.Group>
    );

    const moveBulletDownBtns = getAllByTitle('Move bullet down');
    fireEvent.click(moveBulletDownBtns[0]);
    expect(onMoveHighlight).toHaveBeenCalledWith('job-1', 0, 1);
  });
});

describe('ReorderableEducationItem', () => {
  const mockEdu = {
    id: 'edu-1',
    institution: 'MIT',
    url: '',
    area: 'Computer Science',
    studyType: 'B.S.',
    startDate: '2016-09',
    endDate: '2020-05',
    score: '3.9',
    courses: []
  };

  it('renders education item and handles move', () => {
    const onMove = vi.fn();
    const { getByText, getByTitle } = render(
      <Reorder.Group axis="y" values={[mockEdu]} onReorder={() => {}} as="div">
        <ReorderableEducationItem
          edu={mockEdu}
          index={1}
          total={3}
          onChange={() => {}}
          onRemove={() => {}}
          onMove={onMove}
        />
      </Reorder.Group>
    );

    expect(getByText(/B\.S\. • MIT/)).toBeDefined();
    fireEvent.click(getByTitle('Move education up'));
    expect(onMove).toHaveBeenCalledWith(1, -1);
  });
});

describe('ReorderableSkillItem', () => {
  const mockSkill = {
    id: 'skill-1',
    name: 'Frontend',
    level: 'Expert',
    keywords: ['React', 'Next.js', 'TypeScript']
  };

  it('renders skill group and reorders keywords', () => {
    const onMove = vi.fn();
    const onMoveKeyword = vi.fn();

    const { getByText, getAllByTitle } = render(
      <Reorder.Group axis="y" values={[mockSkill]} onReorder={() => {}} as="div">
        <ReorderableSkillItem
          skillGroup={mockSkill}
          index={0}
          total={1}
          aiLoading={{}}
          onChange={() => {}}
          onRemove={() => {}}
          onGenerateAI={() => {}}
          onMove={onMove}
          onMoveKeyword={onMoveKeyword}
        />
      </Reorder.Group>
    );

    expect(getByText('Frontend')).toBeDefined();
    const downBtns = getAllByTitle('Move skill down');
    fireEvent.click(downBtns[0]);
    expect(onMoveKeyword).toHaveBeenCalledWith('skill-1', 0, 1);
  });
});

describe('ReorderableProjectItem', () => {
  const mockProj = {
    id: 'proj-1',
    name: 'AI Companion',
    description: 'Autonomous assistant',
    url: 'https://example.com'
  };

  it('renders project and handles up/down reorder', () => {
    const onMove = vi.fn();
    const { getByText, getByTitle } = render(
      <Reorder.Group axis="y" values={[mockProj]} onReorder={() => {}} as="div">
        <ReorderableProjectItem
          project={mockProj}
          index={1}
          total={2}
          onChange={() => {}}
          onRemove={() => {}}
          onMove={onMove}
        />
      </Reorder.Group>
    );

    expect(getByText('AI Companion')).toBeDefined();
    fireEvent.click(getByTitle('Move project up'));
    expect(onMove).toHaveBeenCalledWith(1, -1);
  });
});

describe('ReorderableReferenceItem and ReorderableCertificationItem', () => {
  it('renders reference item', () => {
    const mockRef = { id: 'ref-1', name: 'Dr. Smith', reference: 'Professor of CS' };
    const onMove = vi.fn();
    const { getByText, getByTitle } = render(
      <Reorder.Group axis="y" values={[mockRef]} onReorder={() => {}} as="div">
        <ReorderableReferenceItem
          item={mockRef}
          index={0}
          total={2}
          onChange={() => {}}
          onRemove={() => {}}
          onMove={onMove}
        />
      </Reorder.Group>
    );

    expect(getByText('Dr. Smith')).toBeDefined();
    fireEvent.click(getByTitle('Move reference down'));
    expect(onMove).toHaveBeenCalledWith(0, 1);
  });

  it('renders certification item', () => {
    const mockCert = { id: 'cert-1', name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2024-03' };
    const onMove = vi.fn();
    const { getByText, getByTitle } = render(
      <Reorder.Group axis="y" values={[mockCert]} onReorder={() => {}} as="div">
        <ReorderableCertificationItem
          cert={mockCert}
          index={0}
          total={2}
          onChange={() => {}}
          onRemove={() => {}}
          onMove={onMove}
        />
      </Reorder.Group>
    );

    expect(getByText(/AWS Solutions Architect • Amazon Web Services/)).toBeDefined();
    fireEvent.click(getByTitle('Move certification down'));
    expect(onMove).toHaveBeenCalledWith(0, 1);
  });
});
