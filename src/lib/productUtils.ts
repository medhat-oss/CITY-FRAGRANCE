export function parseNotes(notes: string) {
  const parts = (notes || '').split(' • ');
  return {
    topNotes: parts[0] ?? '',
    middleNotes: parts[1] ?? '',
    baseNotes: parts[2] ?? '',
  };
}
