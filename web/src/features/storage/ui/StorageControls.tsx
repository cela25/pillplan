import { useRef, useState } from 'react';
import { emptyPlan, usePlan } from '@/features/medicines';
import { useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Switch } from '@/shared/ui/Field';
import { useToast } from '@/shared/ui/Toast';
import { downloadBlob, exportFileName, exportPlan, importPlan } from '../logic/file';
import styles from './StorageControls.module.css';

interface StorageControlsProps {
  remember: boolean;
  available: boolean;
  today: string;
  onRememberChange: (remember: boolean) => void;
}

export function StorageControls({
  remember,
  available,
  today,
  onRememberChange,
}: StorageControlsProps) {
  const { plan, dispatch } = usePlan();
  const { t } = useI18n();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const result = importPlan(await file.text());
    if (result.ok) {
      dispatch({ type: 'replace', state: result.plan });
      toast(t.storage.imported);
    } else {
      toast(t.storage.importFailed);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <section className={`${styles.section} no-print`} aria-labelledby="storage-heading">
      <h3 id="storage-heading" className={styles.heading}>
        {t.storage.heading}
      </h3>
      {available ? (
        <div>
          <Switch label={t.storage.remember} checked={remember} onChange={onRememberChange} />
          <p className={styles.hint}>{t.storage.rememberHint}</p>
        </div>
      ) : (
        <p className={styles.hint}>{t.storage.unavailable}</p>
      )}
      <div className={styles.buttons}>
        <Button
          icon="download"
          onClick={() => {
            const now = new Date();
            downloadBlob(exportPlan(plan, now), exportFileName(now));
          }}
        >
          {t.storage.export}
        </Button>
        <Button icon="upload" onClick={() => fileInput.current?.click()}>
          {t.storage.import}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label={t.storage.import}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button variant="danger" icon="remove" onClick={() => setConfirming(true)}>
          {t.storage.clear}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={t.storage.clearTitle}
        body={t.storage.clearBody}
        confirmLabel={t.storage.clearConfirm}
        cancelLabel={t.form.cancel}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          dispatch({ type: 'replace', state: emptyPlan(today) });
          setConfirming(false);
          toast(t.storage.cleared);
        }}
      />
    </section>
  );
}
