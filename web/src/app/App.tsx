import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CatalogProvider, MyDrugsList, useCatalog } from '@/features/catalog';
import { buildExamplePlan, MedicinePanel, PlanProvider, usePlan } from '@/features/medicines';
import { SafetyNotes } from '@/features/safety';
import { ChartSheet, toIsoDate } from '@/features/schedule';
import { CalendarExport, StorageControls, usePersistence } from '@/features/storage';
import { Welcome } from '@/features/welcome';
import { newId } from '@/shared/id';
import { I18nProvider, useI18n } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/Field';
import { Drawer } from '@/shared/ui/Drawer';
import { Icon } from '@/shared/ui/Icon';
import { Tooltip } from '@/shared/ui/Tooltip';
import { ToastProvider } from '@/shared/ui/Toast';
import { withViewTransition } from '@/shared/viewTransition';
import type { Catalog } from '@/features/catalog';
import { useView, type View } from './route';
import { readStartup, type Startup } from './startup';
import { LanguageSwitch } from './LanguageSwitch';
import { Wordmark } from '@/shared/ui/Wordmark';
import styles from './App.module.css';

const CounselingMode = lazy(() =>
  import('@/features/schedule/counseling').then((module) => ({ default: module.CounselingMode })),
);

interface AppProps {
  startup?: Startup;
  catalog?: Catalog;
}

export function App({ startup: given, catalog }: AppProps) {
  const [startup] = useState(() => given ?? readStartup());
  return (
    <I18nProvider initial={startup.lang} storage={startup.storage}>
      <CatalogProvider catalog={catalog} storage={startup.storage}>
        <PlanProvider initial={startup.plan}>
          <ToastProvider>
            <Entry startup={startup} />
          </ToastProvider>
        </PlanProvider>
      </CatalogProvider>
    </I18nProvider>
  );
}

/**
 * The welcome film at "/", then the app at "/plan". Leaving the welcome runs one view
 * transition, so the mark at the end of the film glides into the navbar while the rest crossfades.
 */
function Entry({ startup }: { startup: Startup }) {
  const [view, go] = useView(startup.view);
  const start = useCallback(() => go('plan'), [go]);

  if (view === 'welcome') {
    return <Welcome onDone={start} />;
  }
  return <Shell startup={startup} counseling={view === 'counsel'} onNavigate={go} />;
}

interface ShellProps {
  startup: Startup;
  counseling: boolean;
  onNavigate: (view: View) => void;
}

function Shell({ startup, counseling, onNavigate }: ShellProps) {
  const { plan, dispatch } = usePlan();
  const catalog = useCatalog();
  const { t, lang } = useI18n();
  const searchRef = useRef<HTMLInputElement>(null);
  const [highlight, setHighlight] = useState<readonly string[]>([]);
  const persistence = usePersistence(plan, startup.storage);
  const [drawer, setDrawer] = useState(false);
  const demoDone = useRef(!startup.example);
  const today = toIsoDate(startup.today);
  const hasMedicines = plan.medicines.length > 0;

  const loadExample = () => {
    if (!catalog) return;
    withViewTransition(() =>
      dispatch({ type: 'replace', state: buildExamplePlan(catalog, today, newId, t, lang) }),
    );
  };

  // Demo links (?example, ?counsel) wait for the drug list, then fill the chart once.
  useEffect(() => {
    if (demoDone.current || !catalog) return;
    demoDone.current = true;
    if (plan.medicines.length === 0) {
      dispatch({ type: 'replace', state: buildExamplePlan(catalog, today, newId, t, lang) });
    }
  }, [catalog, plan.medicines.length, dispatch, today, t, lang]);

  // "/" jumps to the drug search, like many search boxes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable]');
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.app}>
      <header className={`${styles.topbar} no-print`}>
        <div className={styles.brand}>
          <Wordmark />
          <h1>{t.app.name}</h1>
        </div>
        <nav className={styles.actions} aria-label={t.app.name}>
          <LanguageSwitch />
          <span className={styles.divider} aria-hidden="true" />
          <Tooltip text={t.welcome.replayHint}>
            <Button variant="nav" icon="play" onClick={() => onNavigate('welcome')}>
              {t.welcome.replay}
            </Button>
          </Tooltip>
          <Tooltip text={hasMedicines ? t.counsel.hint : t.app.needMedicine}>
            <Button
              variant="nav"
              icon="counsel"
              aria-disabled={!hasMedicines || undefined}
              onClick={() => hasMedicines && onNavigate('counsel')}
            >
              {t.app.counsel}
            </Button>
          </Tooltip>
          <Tooltip text={hasMedicines ? t.pdf.hint : t.app.needMedicine}>
            <Button
              variant="primary"
              icon="print"
              aria-disabled={!hasMedicines || undefined}
              onClick={() => hasMedicines && window.print()}
            >
              {t.app.print}
            </Button>
          </Tooltip>
          <Tooltip text={t.drawer.title} role="label">
            <Button
              variant="nav"
              icon="more"
              aria-haspopup="dialog"
              onClick={() => setDrawer(true)}
            >
              <span className={styles.moreLabel} aria-hidden="true">
                {t.drawer.more}
              </span>
            </Button>
          </Tooltip>
        </nav>
      </header>

      {startup.invalidSaved ? (
        <p className={`${styles.notice} no-print`} role="status">
          <Icon name="info" size={18} />
          {t.storage.invalidSaved}
        </p>
      ) : (
        <span />
      )}

      <main className={styles.layout}>
        <div className={`${styles.work} no-print`}>
          <section aria-label={t.patient.heading}>
            <TextField
              label={t.patient.nameLabel}
              hint={t.patient.nameHint}
              value={plan.patientName}
              maxLength={120}
              autoComplete="off"
              onChange={(event) => dispatch({ type: 'setPatientName', name: event.target.value })}
            />
          </section>
          <MedicinePanel searchRef={searchRef} />
        </div>
        <div className={styles.preview}>
          <SafetyNotes onHighlight={setHighlight} />
          <ChartSheet today={startup.today} onExample={loadExample} highlight={highlight} />
        </div>
      </main>

      <footer className={`${styles.footer} no-print`}>
        <p>{t.app.privacy}</p>
        <p>{t.app.dataNote}</p>
      </footer>

      <Drawer
        open={drawer}
        title={t.drawer.title}
        closeLabel={t.drawer.close}
        onClose={() => setDrawer(false)}
        tabs={[
          {
            id: 'save',
            label: t.drawer.tabs.save,
            content: (
              <div className={styles.drawerStack}>
                <div className={styles.pdf}>
                  <Button
                    variant="primary"
                    icon="print"
                    disabled={!hasMedicines}
                    onClick={() => {
                      setDrawer(false);
                      window.setTimeout(() => window.print(), 250);
                    }}
                  >
                    {t.pdf.button}
                  </Button>
                  <p className={styles.drawerHint}>{t.pdf.hint}</p>
                </div>
                <StorageControls
                  remember={persistence.remember}
                  available={persistence.available}
                  today={today}
                  onRememberChange={persistence.setRemember}
                />
              </div>
            ),
          },
          { id: 'reminders', label: t.drawer.tabs.reminders, content: <CalendarExport /> },
          { id: 'mydrugs', label: t.drawer.tabs.myDrugs, content: <MyDrugsList /> },
        ]}
      />

      {counseling && hasMedicines && (
        <Suspense fallback={null}>
          <CounselingMode onClose={() => onNavigate('plan')} />
        </Suspense>
      )}
    </div>
  );
}
