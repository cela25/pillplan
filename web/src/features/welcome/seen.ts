/** Whether the welcome intro was already shown on this device. Storage can be blocked. */
export const WELCOME_KEY = 'pillplan:welcome-seen';

export function hasSeenWelcome(storage: Storage | null): boolean {
  try {
    return storage?.getItem(WELCOME_KEY) === '1';
  } catch {
    return false;
  }
}

export function markWelcomeSeen(storage: Storage | null): void {
  try {
    storage?.setItem(WELCOME_KEY, '1');
  } catch {
    // Not remembered; the intro shows again next time, which is harmless.
  }
}
