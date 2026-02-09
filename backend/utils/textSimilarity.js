export const similarity = (a, b) => {
  if (!a || !b) return 0;
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  const inter = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union ? inter / union : 0;
};
