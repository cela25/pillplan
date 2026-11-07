/** Random id for a medicine. Only call from event handlers, never during render. */
export function newId(): string {
  return `m${crypto.randomUUID().replaceAll('-', '')}`;
}
