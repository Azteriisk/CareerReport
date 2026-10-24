/**
 * Utility functions for reordering items within arrays immutably.
 */

/**
 * Reorders an item within an array from startIndex to endIndex.
 * Returns a new array instance without mutating the original.
 * If either index is out of bounds or identical, returns the original array.
 */
export function reorderList<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (
    !Array.isArray(list) ||
    startIndex < 0 ||
    startIndex >= list.length ||
    endIndex < 0 ||
    endIndex >= list.length ||
    startIndex === endIndex
  ) {
    return list;
  }

  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * Moves an item at index in the specified direction (-1 for up/previous, 1 for down/next).
 * Returns a new array instance.
 */
export function moveItemDirection<T>(list: T[], index: number, direction: -1 | 1): T[] {
  return reorderList(list, index, index + direction);
}
