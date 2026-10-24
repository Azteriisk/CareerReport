import { describe, it, expect } from 'vitest';
import { reorderList, moveItemDirection } from '../../src/lib/reorder-utils';

describe('reorderList', () => {
  it('moves an item from start to end index', () => {
    const original = ['a', 'b', 'c', 'd'];
    const result = reorderList(original, 0, 2);
    expect(result).toEqual(['b', 'c', 'a', 'd']);
    expect(original).toEqual(['a', 'b', 'c', 'd']); // Immutable
  });

  it('moves an item backward', () => {
    const original = ['a', 'b', 'c', 'd'];
    const result = reorderList(original, 3, 1);
    expect(result).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns original list if indices are equal', () => {
    const original = [1, 2, 3];
    expect(reorderList(original, 1, 1)).toEqual([1, 2, 3]);
  });

  it('returns original list if startIndex is negative', () => {
    const original = ['x', 'y'];
    expect(reorderList(original, -1, 1)).toEqual(['x', 'y']);
  });

  it('returns original list if endIndex is out of bounds', () => {
    const original = ['x', 'y'];
    expect(reorderList(original, 0, 5)).toEqual(['x', 'y']);
  });

  it('handles empty or non-array inputs gracefully', () => {
    expect(reorderList([] as any[], 0, 1)).toEqual([]);
    expect(reorderList(null as any, 0, 1)).toBeNull();
  });
});

describe('moveItemDirection', () => {
  it('moves an item up (direction = -1)', () => {
    const list = ['Job 1', 'Job 2', 'Job 3'];
    const result = moveItemDirection(list, 1, -1);
    expect(result).toEqual(['Job 2', 'Job 1', 'Job 3']);
  });

  it('moves an item down (direction = 1)', () => {
    const list = ['Job 1', 'Job 2', 'Job 3'];
    const result = moveItemDirection(list, 1, 1);
    expect(result).toEqual(['Job 1', 'Job 3', 'Job 2']);
  });

  it('does nothing when moving top item up', () => {
    const list = ['Job 1', 'Job 2'];
    const result = moveItemDirection(list, 0, -1);
    expect(result).toEqual(['Job 1', 'Job 2']);
  });

  it('does nothing when moving bottom item down', () => {
    const list = ['Job 1', 'Job 2'];
    const result = moveItemDirection(list, 1, 1);
    expect(result).toEqual(['Job 1', 'Job 2']);
  });
});
