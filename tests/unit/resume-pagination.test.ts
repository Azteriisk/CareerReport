import { describe, it, expect } from 'vitest';
import {
  pageCountFromScrollWidth,
  RESUME_PAGE_STRIDE,
  RESUME_COLUMN_GAP,
} from '../../src/lib/resume-pagination';

describe('pageCountFromScrollWidth', () => {
  it('returns 1 for a single column', () => {
    expect(pageCountFromScrollWidth(850)).toBe(1);
    expect(pageCountFromScrollWidth(RESUME_PAGE_STRIDE - RESUME_COLUMN_GAP)).toBe(1);
  });

  it('returns 2 when scrollWidth spans two columns', () => {
    // Two 850px columns + one 40px gap between them
    const twoColumnScrollWidth = 850 + 40 + 850;
    expect(pageCountFromScrollWidth(twoColumnScrollWidth)).toBe(2);
  });

  it('never returns less than 1', () => {
    expect(pageCountFromScrollWidth(0)).toBe(1);
  });

  it('uses scrollWidth semantics, not visible box width', () => {
    // getBoundingClientRect().width stays ~850 for multi-column layout;
    // that must not be used — it would always yield 1 page.
    const visibleBoxOnly = 850;
    expect(pageCountFromScrollWidth(visibleBoxOnly)).toBe(1);

    const fullHorizontalOverflow = 1780;
    expect(pageCountFromScrollWidth(fullHorizontalOverflow)).toBe(2);
  });
});
