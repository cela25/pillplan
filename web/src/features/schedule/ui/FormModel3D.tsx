import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, type PointerEvent } from 'react';
import { DoubleSide, LatheGeometry, Vector2, type Group } from 'three';
import type { Preparation } from '@/shared/domain/time';
import styles from './FormModel3D.module.css';

const AMBER = '#b45f06';
const AMBER_TINT = '#f3d3ad';
const INK = '#222222';

function Tablet() {
  return (
    <group rotation={[0.9, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 0.42, 64]} />
        <meshStandardMaterial color="#fbfbf8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.215, 0]}>
        <boxGeometry args={[1.9, 0.01, 0.06]} />
        <meshStandardMaterial color="#c9c9c4" />
      </mesh>
    </group>
  );
}

/** Two halves: a cylinder with a rounded end each, amber and white like the chart drawing. */
function CapsuleHalf({ color, side }: { color: string; side: 1 | -1 }) {
  return (
    <group position={[side * 0.45, 0, 0]} rotation={[0, 0, (side * Math.PI) / 2]}>
      <mesh>
        <cylinderGeometry args={[0.42, 0.42, 0.9, 48, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.35} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.42, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Capsule() {
  return (
    <group rotation={[0.3, 0.4, -0.5]}>
      <CapsuleHalf color={AMBER} side={-1} />
      <CapsuleHalf color="#fbfbf8" side={1} />
    </group>
  );
}

/** Bottle profile (radius, height), turned on a lathe. */
const BOTTLE = [
  [0, -1.2],
  [0.62, -1.2],
  [0.7, -1.1],
  [0.7, 0.45],
  [0.32, 0.85],
  [0.3, 1.05],
] as const;

function lathe(points: readonly (readonly [number, number])[]): LatheGeometry {
  return new LatheGeometry(
    points.map(([x, y]) => new Vector2(x, y)),
    64,
  );
}

function Bottle({ suspension }: { suspension: boolean }) {
  const glass = useMemo(() => lathe(BOTTLE), []);
  const liquid = useMemo(
    () =>
      lathe([
        [0, -1.15],
        [0.64, -1.15],
        [0.64, suspension ? 0.25 : 0.1],
        [0, suspension ? 0.25 : 0.1],
      ]),
    [suspension],
  );
  const sediment = useMemo(
    () =>
      lathe([
        [0, -1.15],
        [0.645, -1.15],
        [0.645, -0.8],
        [0, -0.8],
      ]),
    [],
  );
  return (
    <group rotation={[0.15, 0.5, 0]}>
      <mesh geometry={liquid}>
        <meshStandardMaterial color={suspension ? AMBER_TINT : AMBER} roughness={0.3} />
      </mesh>
      {suspension && (
        <mesh geometry={sediment}>
          <meshStandardMaterial color={AMBER} roughness={0.8} />
        </mesh>
      )}
      <mesh geometry={glass}>
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.28}
          roughness={0.1}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.3, 48]} />
        <meshStandardMaterial color={INK} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.705, 0.705, 0.55, 64, 1, true]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} side={DoubleSide} />
      </mesh>
    </group>
  );
}

interface Turn {
  x: number;
  y: number;
}

/** Applies the drag rotation. With frameloop "demand" this runs only after a drag moves. */
function Turntable({ preparation, turn }: { preparation: Preparation; turn: { current: Turn } }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    group.current?.rotation.set(turn.current.x, turn.current.y, 0);
  });
  return (
    <group ref={group}>
      {preparation === 'tablet' && <Tablet />}
      {preparation === 'capsule' && <Capsule />}
      {(preparation === 'syrup' || preparation === 'suspension') && (
        <Bottle suspension={preparation === 'suspension'} />
      )}
    </group>
  );
}

/** Drag anywhere on the stage to turn the model; a still model costs no frames. */
export default function FormModel3D({
  preparation,
  size,
}: {
  preparation: Preparation;
  size: number;
}) {
  const turn = useRef<Turn>({ x: 0, y: 0 });
  const last = useRef<{ x: number; y: number } | null>(null);
  const redraw = useRef<() => void>(() => undefined);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = last.current;
    if (!from) return;
    turn.current = {
      x: Math.max(-1.2, Math.min(1.2, turn.current.x + (event.clientY - from.y) * 0.01)),
      y: turn.current.y + (event.clientX - from.x) * 0.01,
    };
    last.current = { x: event.clientX, y: event.clientY };
    redraw.current();
  };
  const stop = () => {
    last.current = null;
  };

  return (
    <div
      className={styles.stage}
      style={{ width: size, height: size }}
      aria-hidden="true"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        last.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={(state) => {
          redraw.current = () => state.invalidate();
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} />
        <Turntable preparation={preparation} turn={turn} />
      </Canvas>
    </div>
  );
}
