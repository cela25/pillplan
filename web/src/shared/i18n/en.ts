/**
 * English text. Every piece of interface text lives here, so the app can be translated
 * in one place. Plain words, numbers as digits, no dashes as punctuation.
 */
import type { DoseForm, FoodRule, IntervalHours, Preparation } from '@/shared/domain/time';

const list = (items: readonly string[]): string =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? ''}`;

export const en = {
  locale: 'en-US',
  language: { label: 'Language', en: 'English', id: 'Bahasa Indonesia' },
  formNames: {
    tablet: ['tablet', 'tablets'],
    capsule: ['capsule', 'capsules'],
    mL: ['mL', 'mL'],
    puff: ['puff', 'puffs'],
    drop: ['drop', 'drops'],
  } satisfies Record<DoseForm, [string, string]>,
  example: {
    patient: 'Example patient',
    purposes: {
      metformin: 'for diabetes',
      amlodipine: 'for blood pressure',
      amoxicillin: 'for the infection',
      simvastatin: 'for cholesterol',
      paracetamol: 'for pain',
    } as Record<string, string>,
  },
  app: {
    name: 'PillPlan',
    tagline: 'Turn a list of medicines into a clear chart a patient can follow.',
    counsel: 'Counseling mode',
    needMedicine: 'Add a medicine first',
    print: 'Print / PDF',
    example: 'Try an example patient',
    repo: 'Source code and documentation',
    disclaimer:
      'PillPlan helps people remember how to take their medicines. It does not replace advice from a doctor or pharmacist.',
    dataNote:
      'Starter drug data comes from US FDA labels. Check it against your own formulary before real use.',
    privacy: 'Everything stays in this browser. Nothing is uploaded.',
  },
  welcome: {
    title: 'Clear medicine plans the patient can actually follow',
    start: 'Start a plan',
    skip: 'Skip intro',
    replay: 'Intro',
    replayHint: 'Show the introduction again',
    points: {
      interval: '3x a day means every 8 hours, also at night',
      forms: 'Tablet, capsule, syrup or suspension at a glance',
      reminder: "Reminders straight to the patient's phone",
    },
  },
  interval: {
    every: (hours: IntervalHours) => (hours === 24 ? 'Once a day' : `Every ${hours} hours`),
    perDay: (count: number) => (count === 1 ? 'once a day' : `${count} times a day`),
    choice: (hours: IntervalHours) =>
      hours === 24 ? 'Every 24 hours (1x)' : `Every ${hours} hours (${24 / hours}x)`,
  },
  clock: {
    label: (every: string, times: readonly string[]) => `${every}: ${list(times)}`,
    firstDose: 'First dose of the day',
    valueText: (times: readonly string[]) =>
      `First dose ${times[0] ?? ''}, then ${list(times.slice(1)) || 'none'}`,
    hint: 'Drag the ringed dot or use the arrow keys. The other doses follow.',
  },
  preparation: {
    legend: 'Preparation',
    names: {
      tablet: 'Tablet',
      capsule: 'Capsule',
      syrup: 'Syrup',
      suspension: 'Suspension',
    } satisfies Record<Preparation, string>,
    note: {
      tablet: '',
      capsule: '',
      syrup: 'Measure with the dosing spoon or cup, not a kitchen spoon.',
      suspension: 'Shake well before each dose. Measure with the dosing spoon or cup.',
    } satisfies Record<Preparation, string>,
  },
  whenNeeded: 'When needed',
  food: {
    before: 'Before food',
    with_after: 'With or after food',
    any: 'With or without food',
  } satisfies Record<FoodRule, string>,
  foodLong: {
    before: 'Take before food, on an empty stomach.',
    with_after: 'Take with food or just after eating.',
    any: 'Take with or without food.',
  } satisfies Record<FoodRule, string>,
  signa: {
    label: 'Signa (how to take)',
    placeholder: 'For example 3 dd 1 tab p.c. or 2x1 sesudah makan',
    hint: 'Type the signa from the prescription. Times, amount and food fill in below.',
    timesCount: (count: number) => (count === 1 ? 'Once a day' : `${count} times a day`),
    preview: (every: string, times: string, dose: string, food: string | null) =>
      [`${every}: ${times}`, dose, food].filter(Boolean).join('. ') + '.',
    previewPrn: (dose: string, max: number | null) =>
      max ? `When needed: ${dose}, at most ${max} times a day.` : `When needed: ${dose}.`,
    check: (tokens: readonly string[]) => `Check: ${tokens.join(', ')}`,
  },
  myDrugs: {
    remember: 'Remember this drug for next time',
    typeOwn: 'Type my own medicine',
    ownHeading: 'Add my own medicine',
    tag: 'My drug, not checked',
    heading: 'My drugs',
    hint: 'Drugs you typed yourself. They are saved on this device only.',
    remove: (name: string) => `Remove ${name} from my drugs`,
    saved: (name: string) => `${name} saved to my drugs.`,
  },
  calendar: {
    heading: 'Phone reminders',
    hint: 'Download a calendar file and open it on the phone for daily reminders.',
    export: 'Add to phone calendar',
    times: 'Reminder times (set on each medicine)',
    none: 'Add a medicine with a fixed time first.',
    eventTitle: (slot: string) => `Medicines: ${slot}`,
    eventLine: (name: string, dose: string) => `${name}: ${dose}`,
    repeats: (days: number) => `Repeats every day for ${days} days.`,
  },
  drawer: {
    more: 'More',
    title: 'More options',
    close: 'Close',
    tabs: { save: 'Save', reminders: 'Reminders', myDrugs: 'My drugs' },
  },
  pdf: {
    button: 'Save as PDF',
    hint: 'Opens the print window. Choose "Save as PDF" as the printer. The PDF looks the same as the chart on screen.',
  },
  patient: {
    heading: 'Patient',
    nameLabel: 'Patient name',
    nameHint: 'Optional. Leave it blank on a shared computer.',
  },
  search: {
    label: 'Find a medicine',
    placeholder: 'Generic or brand name',
    hint: 'Generic, brand or Indonesian name.',
    loading: 'Loading the drug list',
    listLabel: 'Matching medicines',
    addCustom: (name: string) => `Add "${name}" as a custom medicine`,
    customNote: 'Not checked by PillPlan',
    matches: (count: number) => (count === 1 ? '1 match' : `${count} matches`),
    strengths: (labels: readonly string[]) => list(labels),
  },
  form: {
    addHeading: (name: string) => `Add ${name}`,
    editHeading: (name: string) => `Edit ${name}`,
    name: 'Medicine name',
    strength: 'Strength',
    strengthCustomHint: 'For example 5 mg, or 125 mg in 5 mL.',
    amount: 'Amount each time',
    less: 'Less',
    more: 'More',
    form: 'Form',
    forms: { tablet: 'Tablet', capsule: 'Capsule', mL: 'Liquid (mL)', puff: 'Puff', drop: 'Drop' },
    when: 'How often',
    firstDose: 'First dose',
    firstDoseHint: 'The other doses follow at even gaps, also through the night.',
    whenNeededHint: 'Only when the patient needs it, for example for pain.',
    maxPerDay: 'Most times a day',
    timesUnit: 'times',
    food: 'Food',
    warnings: 'Warning stickers',
    purpose: 'What it is for',
    purposeHint: 'Plain words, for example "for blood pressure".',
    advice: 'Note for the patient',
    add: 'Add to chart',
    save: 'Save changes',
    moreDetails: 'More details',
    moreDetailsHint: 'Warnings, purpose and note',
    cancel: 'Cancel',
    errors: {
      name: 'Enter the medicine name.',
      amount: 'Enter an amount above zero.',
      times: 'Choose how often, or "When needed".',
      firstDose: 'Enter the first dose as HH:MM, for example 07:00.',
      maxPerDay: 'Enter how many times a day, from 1 to 24.',
    },
  },
  list: {
    heading: 'Medicines on the chart',
    empty: 'No medicines yet. Find one above to start.',
    edit: 'Edit',
    remove: 'Remove',
    reorder: (name: string) => `Drag, or press Space, to move ${name}`,
    editNamed: (name: string) => `Edit ${name}`,
    removeNamed: (name: string) => `Remove ${name}`,
    added: (name: string) => `${name} added to the chart.`,
    removed: (name: string) => `${name} removed.`,
    undo: 'Undo',
    schedule: (times: readonly string[]) => list(times),
    prnSummary: (max: number | null) =>
      max ? `When needed, at most ${max} times a day` : 'When needed',
    dragInstructions:
      'To move a medicine, press Space or Enter on its handle, use the arrow keys, then press Space or Enter again. Press Escape to cancel.',
    pickedUp: (name: string) => `Picked up ${name}.`,
    movedTo: (name: string, position: number, total: number) =>
      `${name} is now number ${position} of ${total}.`,
    dropped: (name: string, position: number, total: number) =>
      `${name} placed at number ${position} of ${total}.`,
    cancelled: (name: string) => `Moving ${name} was cancelled.`,
  },
  chart: {
    heading: 'Medicine chart',
    patient: 'Patient',
    date: 'Date',
    medicine: 'Medicine',
    caption: 'When to take each medicine',
    none: 'None',
    whenNeededHeading: 'When needed',
    prnLine: (dose: string, max: number | null) =>
      max ? `Take ${dose}. No more than ${max} times a day.` : `Take ${dose} when needed.`,
    emptyTitle: 'The chart is empty',
    emptyBody:
      'Search a medicine on the left, or type the signa from the prescription. It appears here straight away.',
    spotlightLabel: 'Highlight one dose time',
    spotlightHint: (time: string) => `Highlight the ${time} doses`,
    medicinesAt: (count: number) => (count === 1 ? '1 medicine' : `${count} medicines`),
    footer: 'Bring this chart to every doctor and pharmacy visit.',
  },
  tracker: {
    heading: '7-day tracker',
    hint: 'Tap a bubble each time the doses are taken.',
    reset: 'Start a new week',
    bubble: (day: string, time: string, taken: boolean) =>
      `${day}, ${time}: ${taken ? 'taken' : 'not taken yet'}`,
  },
  counsel: {
    title: 'Counseling mode',
    hint: 'Show the patient one medicine at a time, full screen',
    progress: (index: number, total: number) => `Medicine ${index} of ${total}`,
    whatFor: 'What it is for',
    when: 'When to take it',
    how: 'How to take it',
    warnings: 'Remember',
    note: 'Note',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    close: 'Close',
  },
  safety: {
    heading: 'Safety notes',
    count: (n: number) => (n === 1 ? '1 safety note' : `${n} safety notes`),
    okShort: 'No issues found by the checks',
    none: 'No issues found by the checks PillPlan can do.',
    noneDetail:
      'PillPlan checks daily totals, duplicates and time of day. It does not check interactions.',
    maxDailyTitle: (ingredient: string, total: string) => `${ingredient}: ${total} a day`,
    maxDailyDetail: (max: string) =>
      `This is above the usual maximum of ${max} a day. Check with your pharmacist.`,
    duplicateIngredientTitle: (ingredient: string, count: number) =>
      `${ingredient} is in ${count} medicines`,
    duplicateIngredientDetail: (names: readonly string[], ingredient: string) =>
      `${list(names)} all contain ${ingredient}. Taking them together can add up to too much. Check with your pharmacist.`,
    duplicateClassTitle: (drugClass: string) => `Two or more from one group: ${drugClass}`,
    duplicateClassDetail: (names: readonly string[]) =>
      `${list(names)} work in the same way. This is usually not intended. Check with your pharmacist.`,
    timingTitle: (name: string) => `${name}: check the time of day`,
    uncheckedTitle: (name: string) => `${name} is not in the drug list`,
    uncheckedDetail: 'PillPlan cannot check the dose, duplicates or timing for this medicine.',
  },
  storage: {
    heading: 'Save and share',
    remember: 'Remember on this device',
    rememberHint: 'Turn off on a shared computer. Saved data is then removed.',
    unavailable: 'This browser is not letting PillPlan save. Use Export to keep a copy.',
    export: 'Export file',
    import: 'Import file',
    clear: 'Clear all data',
    clearTitle: 'Clear all data?',
    clearBody: 'This removes every medicine, the tracker and the patient name from this device.',
    clearConfirm: 'Yes, clear everything',
    imported: 'Chart imported.',
    importFailed: 'That file is not a PillPlan chart.',
    invalidSaved: 'Saved data could not be read, so PillPlan started a new chart.',
    cleared: 'All data cleared.',
  },
};

export type Strings = typeof en;
