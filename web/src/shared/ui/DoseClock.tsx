import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  doseTimes,
  formatClock,
  fromMinutes,
  MINUTES_PER_DAY,
  toMinutes,
  type ClockTime,
  type IntervalHours,
} from '@/shared/domain/time';
import { useI18n } from '@/shared/i18n';
import { arcPath, DIAL, minutesAtPoint, minuteToDegrees, pointAt } from './clockGeometry';
import styles from './DoseClock.module.css';

interface DoseClockProps {
  every: IntervalHours;
  firstDose: ClockTime;
  /** Leave out for a read-only clock (counseling, print preview). */
  onChange?: (firstDose: ClockTime) => void;
  size?: number;
}

const STEP = 15;
const HOUR_LABELS = [0, 6, 12, 18] as const;

/**
 * A 24-hour dial. The doses sit evenly around it, joined into one shape, so the patient sees
 * "every 8 hours" instead of reading it. Drag the first dose (or use the arrow keys) and the
 * other doses follow, keeping the interval.
 */
export function DoseClock({ every, firstDose, onChange, size = DIAL.size }: DoseClockProps) {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const doses = doseTimes(every, firstDose);
  const start = toMinutes(firstDose);
  const editable = onChange !== undefined;
  const labels = doses.map(({ time }) => formatClock(time, t.locale));

  const setMinutes = (minutes: number) => {
    const next = fromMinutes(((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY);
    if (next !== firstDose) onChange?.(next);
  };

  const fromPointer = (event: PointerEvent<SVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const scale = DIAL.size / box.width;
    setMinutes(
      minutesAtPoint((event.clientX - box.left) * scale, (event.clientY - box.top) * scale, STEP),
    );
  };

  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: STEP,
      ArrowUp: STEP,
      ArrowLeft: -STEP,
      ArrowDown: -STEP,
      PageUp: 60,
      PageDown: -60,
    };
    const move = moves[event.key];
    if (move !== undefined) setMinutes(start + move);
    else if (event.key === 'Home') setMinutes(0);
    else if (event.key === 'End') setMinutes(MINUTES_PER_DAY - STEP);
    else return;
    event.preventDefault();
  };

  // The dose shape is drawn once at 00:00 and rotated to the first dose, so moving it is
  // one CSS transform: the doses travel along the ring instead of jumping.
  const shape = doses.map(({ index }) => pointAt(index * every * 60, DIAL.ring));
  const polygon = shape.map(({ x, y }) => `${x},${y}`).join(' ');
  const handle = pointAt(0);

  return (
    <figure className={styles.clock} data-dragging={dragging || undefined}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${DIAL.size} ${DIAL.size}`}
        className={styles.dial}
        // A slider inside role="img" would be hidden from screen readers, so editable is a group.
        role={editable ? 'group' : 'img'}
        aria-label={t.clock.label(t.interval.every(every), labels)}
        onPointerDown={(event) => {
          if (!editable) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          fromPointer(event);
        }}
        onPointerMove={(event) => dragging && fromPointer(event)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        data-editable={editable || undefined}
      >
        <circle cx={DIAL.center} cy={DIAL.center} r={DIAL.ring} className={styles.ring} />
        <path d={arcPath(6 * 60, 18 * 60)} className={styles.day} />
        <path d={arcPath(18 * 60, 6 * 60)} className={styles.night} />
        {Array.from({ length: 24 }, (_, hour) => {
          const outer = pointAt(hour * 60, DIAL.ring + 14);
          const inner = pointAt(hour * 60, DIAL.ring + (hour % 6 === 0 ? 6 : 10));
          return (
            <line
              key={hour}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              className={styles.tick}
            />
          );
        })}
        {HOUR_LABELS.map((hour) => {
          const at = pointAt(hour * 60, DIAL.ring - 26);
          return (
            <text key={hour} x={at.x} y={at.y} className={styles.hour}>
              {formatClock(fromMinutes(hour * 60), t.locale)}
            </text>
          );
        })}

        {/* The attribute always places the doses; the CSS transform wins where supported and
            is what lets them glide along the ring. */}
        <g
          className={styles.doses}
          transform={`rotate(${minuteToDegrees(start)} ${DIAL.center} ${DIAL.center})`}
          style={{ transform: `rotate(${minuteToDegrees(start)}deg)` }}
        >
          {shape.length > 2 && <polygon points={polygon} className={styles.shape} aria-hidden />}
          {shape.length === 2 && (
            <line
              x1={shape[0]?.x}
              y1={shape[0]?.y}
              x2={shape[1]?.x}
              y2={shape[1]?.y}
              className={styles.shape}
              aria-hidden
            />
          )}
          {shape.map(({ x, y }, index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={index === 0 ? 11 : 8}
              className={styles.dot}
              aria-hidden
            />
          ))}
          <g
            className={styles.handle}
            role={editable ? 'slider' : undefined}
            tabIndex={editable ? 0 : undefined}
            aria-label={editable ? t.clock.firstDose : undefined}
            aria-valuemin={editable ? 0 : undefined}
            aria-valuemax={editable ? MINUTES_PER_DAY - STEP : undefined}
            aria-valuenow={editable ? start : undefined}
            aria-valuetext={editable ? t.clock.valueText(labels) : undefined}
            aria-hidden={editable ? undefined : true}
            onKeyDown={editable ? onKeyDown : undefined}
          >
            <circle cx={handle.x} cy={handle.y} r={editable ? 16 : 11} className={styles.hit} />
          </g>
        </g>

        <text
          x={DIAL.center}
          y={every === 24 ? DIAL.center : DIAL.center - 9}
          className={styles.every}
        >
          {t.interval.every(every)}
        </text>
        {every !== 24 && (
          <text x={DIAL.center} y={DIAL.center + 13} className={styles.count}>
            {t.interval.perDay(24 / every)}
          </text>
        )}
      </svg>
      <figcaption className={styles.times}>
        {labels.map((label, index) => (
          <span key={index} className={styles.time} data-first={index === 0 || undefined}>
            {label}
            {doses[index]?.nextDay && <sup className={styles.next}>+1</sup>}
          </span>
        ))}
      </figcaption>
      {editable && <p className={styles.hint}>{t.clock.hint}</p>}
    </figure>
  );
}
