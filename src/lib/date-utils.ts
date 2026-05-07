export const formatResumeDate = (date: string) => {
  if (!date || date === 'Present') return date;
  const parts = date.split('-');
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return date;
};
