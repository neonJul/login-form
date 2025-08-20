export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function emailPatternValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
