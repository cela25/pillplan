// Remotion's asset-types.d.ts declares `declare module '*.css';`, which types every CSS
// import as any and hides Vite's typed CSS modules (styles.x would no longer be checked).
// PillPlan imports no plain .css through TypeScript, so the line is removed after install.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

for (const flavor of ['cjs', 'esm']) {
  const file = new URL(`../node_modules/remotion/dist/${flavor}/asset-types.d.ts`, import.meta.url);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  const next = text.replace(/^declare module '\*\.css';\r?\n/m, '');
  if (next !== text) writeFileSync(file, next);
}
