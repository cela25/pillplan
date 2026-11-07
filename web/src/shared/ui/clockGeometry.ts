import { MINUTES_PER_DAY } from '@/shared/domain/time';

/**
 * A 24-hour dial: midnight at the top, noon at the bottom, clockwise.
 * Pure geometry so the interactive clock and the welcome film draw the same thing.
 */
export const DIAL = { size: 240, center: 120, ring: 92 } as const;

export function minuteToDegrees(minutes: number): number {
  return (minutes / MINUTES_PER_DAY) * 360;
}

export function pointAt(minutes: number, radius: number = DIAL.ring): { x: number; y: number } {
  const radians = (minuteToDegrees(minutes) * Math.PI) / 180;
  return {
    x: DIAL.center + radius * Math.sin(radians),
    y: DIAL.center - radius * Math.cos(radians),
  };
}

/** Pointer position (in dial units) back to minutes of the day, snapped to `step`. */
export function minutesAtPoint(x: number, y: number, step = 15): number {
  const degrees = (Math.atan2(x - DIAL.center, DIAL.center - y) * 180) / Math.PI;
  const minutes = (((degrees + 360) % 360) / 360) * MINUTES_PER_DAY;
  return (Math.round(minutes / step) * step) % MINUTES_PER_DAY;
}

/** SVG arc path along the ring between two times of day, clockwise. */
export function arcPath(
  fromMinutes: number,
  toMinutes: number,
  radius: number = DIAL.ring,
): string {
  const start = pointAt(fromMinutes, radius);
  const end = pointAt(toMinutes, radius);
  const span = (toMinutes - fromMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const large = span > MINUTES_PER_DAY / 2 ? 1 : 0;
  return `M${start.x} ${start.y}A${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}
