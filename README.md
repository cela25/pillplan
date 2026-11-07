# PillPlan

A counter tool for the apoteker: type the prescription signa (for example `3 dd 1 tab p.c.`), and PillPlan checks the plan and turns it into one clear picture chart, a counseling view and phone reminders, in English or Indonesian.

## What it does

- Signa entry in Latin or Indonesian fills the interval (`3 dd 1` = every 8 hours), first dose, amount and food, with a live preview
- A draggable 24-hour dose clock: move the first dose and every dose follows at even gaps
- Drug search by generic, brand or Indonesian name, plus your own medicines ("My drugs")
- A chart with one column per dose time (07.00, 15.00, 23.00) that prints on one A4 page, or saves as PDF
- The sediaan (tablet, capsule, syrup, suspension) as a picture, with a 3D model in counseling mode
- Safety notes: daily maximum per ingredient across products, duplicates, time of day
- Counseling mode, a 7-day tracker and a calendar file for phone reminders
- Fully static: no server, no database, nothing leaves the browser

## Run it locally

```
cd web
npm install
npm run dev          # http://localhost:5173
npm test
npm run build && npm run preview   # production build on http://localhost:4173
```

Drug data lives in `data-src/*.csv` (edit in Excel or Sheets). Rebuild it with:

```
cd tools
uv run python -m pillplan_tools.catalog.build
uv run pytest
```

Starter drug data comes from US FDA labels. Check it against your own formulary before real use. PillPlan does not replace advice from a doctor or pharmacist.

Author: Ancela Riupassa
