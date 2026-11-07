import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { PreparationIcon } from '@/features/medicines';
import type { Preparation } from '@/shared/domain/time';

const FormModel3D = lazy(() => import('./FormModel3D'));

interface FormModelProps {
  preparation: Preparation;
  size: number;
}

function canUse3D(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** If WebGL fails at runtime the flat drawing takes over; the patient never sees an error. */
class Fallback extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The sediaan as a 3D model the patient can turn with a finger, so a capsule or a suspension
 * bottle looks like the one in their hand. Three.js loads only here, only when WebGL works
 * and motion is welcome; everywhere else it is the same flat drawing as the chart.
 */
export function FormModel({ preparation, size }: FormModelProps) {
  const [enabled] = useState(canUse3D);
  const flat = <PreparationIcon preparation={preparation} size={size * 0.75} />;
  if (!enabled) return flat;
  return (
    <Fallback fallback={flat}>
      <Suspense fallback={flat}>
        <FormModel3D preparation={preparation} size={size} />
      </Suspense>
    </Fallback>
  );
}
