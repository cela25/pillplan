import { describe, expect, it } from 'vitest';
import { DIAL, minutesAtPoint, pointAt } from './clockGeometry';

describe('clock geometry', () => {
  it('puts midnight at the top and noon at the bottom', () => {
    expect(pointAt(0)).toEqual({ x: DIAL.center, y: DIAL.center - DIAL.ring });
    const noon = pointAt(720);
    expect(noon.x).toBeCloseTo(DIAL.center);
    expect(noon.y).toBeCloseTo(DIAL.center + DIAL.ring);
  });

  it('reads a pointer back as minutes, snapped to 15', () => {
    const six = pointAt(360);
    expect(minutesAtPoint(six.x, six.y)).toBe(360);
    const near = pointAt(427);
    expect(minutesAtPoint(near.x, near.y)).toBe(420);
    const top = pointAt(1439);
    expect(minutesAtPoint(top.x, top.y)).toBe(0);
  });
});
