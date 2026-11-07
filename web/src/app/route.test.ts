import { describe, expect, it } from 'vitest';
import { pathOf, viewFromPath } from './route';
import { readStartup } from './startup';

describe('routes', () => {
  it('maps addresses to screens and back', () => {
    expect(viewFromPath('/')).toBe('welcome');
    expect(viewFromPath('/plan')).toBe('plan');
    expect(viewFromPath('/plan/')).toBe('plan');
    expect(viewFromPath('/plan/counsel')).toBe('counsel');
    expect(viewFromPath('/anything-else')).toBe('welcome');
    for (const view of ['welcome', 'plan', 'counsel'] as const) {
      expect(viewFromPath(pathOf(view))).toBe(view);
    }
  });

  it('opens the welcome at the root every time, and demo links go straight in', () => {
    const now = new Date(2026, 10, 2);
    expect(readStartup(now, '', '/').view).toBe('welcome');
    expect(readStartup(now, '', '/plan').view).toBe('plan');
    expect(readStartup(now, '?example', '/').view).toBe('plan');
    expect(readStartup(now, '?counsel', '/').view).toBe('counsel');
    expect(readStartup(now, '?welcome', '/plan').view).toBe('welcome');
  });
});
