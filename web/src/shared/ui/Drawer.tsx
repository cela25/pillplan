import { useId, useState, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './Drawer.module.css';
import { useModalDialog } from './useModalDialog';

export interface DrawerTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface DrawerProps {
  open: boolean;
  title: string;
  closeLabel: string;
  tabs: readonly DrawerTab[];
  onClose: () => void;
}

/** A panel that slides in from the right, with tabs. Escape or the close button shuts it. */
export function Drawer({ open, title, closeLabel, tabs, onClose }: DrawerProps) {
  const ref = useModalDialog(open, onClose);
  const id = useId();
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby={`${id}-title`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id={`${id}-title`}>{title}</h2>
          <Button variant="quiet" icon="close" onClick={onClose}>
            {closeLabel}
          </Button>
        </header>
        <div className={styles.tabs} role="tablist" aria-label={title}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`${id}-tab-${tab.id}`}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={tab.id === current?.id}
              aria-controls={`${id}-panel`}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          id={`${id}-panel`}
          role="tabpanel"
          className={styles.body}
          aria-labelledby={current ? `${id}-tab-${current.id}` : undefined}
        >
          {current?.content}
        </div>
      </div>
    </dialog>
  );
}
