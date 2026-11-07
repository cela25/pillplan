import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useI18n } from '@/shared/i18n';
import { Icon } from '@/shared/ui/Icon';
import { Tooltip } from '@/shared/ui/Tooltip';
import type { Medicine } from '../model';
import styles from './MedicineList.module.css';

import { MedicineRow, type MedicineListProps } from './MedicineRow';

/** Drag to reorder with mouse, touch or keyboard. Loaded after first paint. */
export default function SortableMedicineList({
  medicines,
  onMove,
  onEdit,
  onRemove,
}: MedicineListProps) {
  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const indexOf = (id: UniqueIdentifier) => medicines.findIndex((m) => m.id === id);
  const nameOf = (id: UniqueIdentifier) => medicines[indexOf(id)]?.name ?? '';
  const total = medicines.length;

  const announcements: Announcements = {
    onDragStart: ({ active }) => t.list.pickedUp(nameOf(active.id)),
    onDragOver: ({ active, over }) =>
      over ? t.list.movedTo(nameOf(active.id), indexOf(over.id) + 1, total) : undefined,
    onDragEnd: ({ active, over }) =>
      over ? t.list.dropped(nameOf(active.id), indexOf(over.id) + 1, total) : undefined,
    onDragCancel: ({ active }) => t.list.cancelled(nameOf(active.id)),
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(indexOf(active.id), indexOf(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t.list.dragInstructions },
      }}
    >
      <SortableContext items={medicines.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <ol className={styles.list}>
          {medicines.map((medicine) => (
            <SortableItem
              key={medicine.id}
              medicine={medicine}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

interface SortableItemProps {
  medicine: Medicine;
  onEdit: (medicine: Medicine) => void;
  onRemove: (medicine: Medicine) => void;
}

function SortableItem({ medicine, onEdit, onRemove }: SortableItemProps) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: medicine.id });

  return (
    <MedicineRow
      medicine={medicine}
      onEdit={onEdit}
      onRemove={onRemove}
      rowRef={setNodeRef}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      handle={
        <Tooltip text={t.list.reorder(medicine.name)} role="label">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className={styles.handle}
            {...attributes}
            {...listeners}
          >
            <Icon name="grip" />
          </button>
        </Tooltip>
      }
    />
  );
}
