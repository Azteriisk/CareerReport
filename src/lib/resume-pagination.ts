/** Width of one resume column/page in the horizontal CSS-columns layout (px). */
export const RESUME_PAGE_WIDTH = 850;

/** Gap between columns (px). */
export const RESUME_COLUMN_GAP = 40;

/** Horizontal stride per page: column width + gap (px). */
export const RESUME_PAGE_STRIDE = RESUME_PAGE_WIDTH + RESUME_COLUMN_GAP;

/**
 * Derive visible page count from the hidden measure element's scrollWidth.
 * scrollWidth spans all CSS columns; getBoundingClientRect().width does not.
 */
export function pageCountFromScrollWidth(scrollWidth: number): number {
  return Math.max(1, Math.round((scrollWidth + RESUME_COLUMN_GAP) / RESUME_PAGE_STRIDE));
}
