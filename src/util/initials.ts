/** "Sarah Lin, RN" -> "SL". Drops any credential suffix after the comma. */
export function initials(name: string): string {
  return name
    .replace(/,.*$/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}
