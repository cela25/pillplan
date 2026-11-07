import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { emptyPlan } from '@/features/medicines';
import { testCatalog } from '@/test/catalog';
import { App } from './App';
import type { Startup } from './startup';

const today = new Date(2026, 10, 2);

function startup(patch: Partial<Startup> = {}): Startup {
  return {
    today,
    storage: window.localStorage,
    plan: emptyPlan('2026-11-02'),
    lang: 'en',
    invalidSaved: false,
    example: false,
    counsel: false,
    ...patch,
  };
}

async function addFromSearch(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  optionName: RegExp,
) {
  await user.type(screen.getByRole('combobox', { name: 'Find a medicine' }), query);
  await user.click(screen.getByRole('option', { name: optionName }));
  await user.click(screen.getByRole('button', { name: 'Add to chart' }));
}

const chart = () => screen.getByRole('article', { name: 'Medicine chart' });

describe('PillPlan app', () => {
  it('adds a medicine from the search to the chart', async () => {
    const user = userEvent.setup();
    render(<App startup={startup()} catalog={testCatalog} />);

    expect(within(chart()).getByText('The chart is empty')).toBeInTheDocument();
    await addFromSearch(user, 'metf', /^Metformin/);

    const row = within(chart()).getByRole('rowheader', { name: /Metformin/ });
    expect(row).toHaveTextContent('500 mg');
    expect(within(chart()).getAllByText('tablet')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Medicines on the chart (1)' })).toBeInTheDocument();
  });

  it('shows safety notes for hidden paracetamol and lets the user undo a removal', async () => {
    const user = userEvent.setup();
    render(<App startup={startup()} catalog={testCatalog} />);

    await addFromSearch(user, 'paracetamol (', /^Paracetamol \(acetaminophen\)/);
    await addFromSearch(user, 'panadol extra', /Panadol Extra/);

    const notes = screen.getByRole('region', { name: 'Safety notes' });
    await user.click(within(notes).getByRole('button', { name: /safety note/ }));
    expect(within(notes).getByText('Paracetamol is in 2 medicines')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Paracetamol + caffeine' }));
    expect(screen.getByRole('heading', { name: 'Medicines on the chart (1)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('heading', { name: 'Medicines on the chart (2)' })).toBeInTheDocument();
  });

  it('adds a custom medicine marked as not checked', async () => {
    const user = userEvent.setup();
    render(<App startup={startup()} catalog={testCatalog} />);

    await user.type(screen.getByRole('combobox', { name: 'Find a medicine' }), 'Ginger tea');
    await user.click(screen.getByRole('option', { name: /Add "Ginger tea"/ }));
    await user.click(screen.getByRole('button', { name: 'Add to chart' }));

    await user.click(screen.getByRole('button', { name: /1 safety note/ }));
    expect(screen.getByText('Ginger tea is not in the drug list')).toBeInTheDocument();
  });

  it('moves every dose together when the first dose moves on the clock', async () => {
    const user = userEvent.setup();
    render(<App startup={startup()} catalog={testCatalog} />);

    await user.type(screen.getByRole('combobox', { name: 'Find a medicine' }), 'amox');
    await user.click(screen.getByRole('option', { name: /^Amoxicillin/ }));
    await user.click(screen.getByRole('radio', { name: 'Every 8 hours (3x)' }));
    const handle = screen.getByRole('slider', { name: 'First dose of the day' });
    expect(handle).toHaveAttribute('aria-valuetext', 'First dose 07:00, then 15:00 and 23:00');
    handle.focus();
    await user.keyboard('{PageUp}');
    expect(handle).toHaveAttribute('aria-valuetext', 'First dose 08:00, then 16:00 and 00:00');
    await user.click(screen.getByRole('button', { name: 'Add to chart' }));
    expect(within(chart()).getByRole('columnheader', { name: '16:00' })).toBeInTheDocument();
  });

  it('loads the example and steps through counseling mode', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ example: true, counsel: true })} catalog={testCatalog} />);

    const dialog = await screen.findByRole('dialog', { name: 'Counseling mode' });
    expect(within(dialog).getByText('Medicine 1 of 5')).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /Metformin/ })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Medicine 2 of 5')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(within(dialog).getByText('Medicine 5 of 5')).toBeInTheDocument();
    expect(within(dialog).getByText(/No more than 4 times a day/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('pops tracker bubbles and saves them', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ example: true })} catalog={testCatalog} />);

    const bubble = await screen.findByRole('button', {
      name: /Tuesday, November 3, 23:00: not taken yet/,
    });
    await user.click(bubble);
    expect(
      screen.getByRole('button', { name: /Tuesday, November 3, 23:00: taken/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('pillplan:plan')).toContain('d1-2300');
  });

  it('highlights one dose time', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ example: true })} catalog={testCatalog} />);

    const night = await screen.findByRole('button', { name: /^21:00/, pressed: false });
    await user.click(night);
    expect(
      within(chart()).getByRole('table', { name: 'When to take each medicine' }),
    ).toHaveAttribute('data-spot', '21:00');
  });

  it('stops saving when "Remember on this device" is turned off', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ example: true })} catalog={testCatalog} />);

    await screen.findByRole('rowheader', { name: /Metformin/ });
    expect(window.localStorage.getItem('pillplan:plan')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'More options' }));
    await user.click(screen.getByRole('switch', { name: 'Remember on this device' }));
    expect(window.localStorage.getItem('pillplan:plan')).toBeNull();
  });

  it('lets the apoteker type their own medicine, even with a name from the list', async () => {
    const user = userEvent.setup();
    render(<App startup={startup()} catalog={testCatalog} />);

    await user.click(screen.getByRole('button', { name: 'Type my own medicine' }));
    const name = screen.getByRole('textbox', { name: 'Medicine name' });
    expect(name).toHaveFocus();
    await user.type(name, 'Metformin');
    await user.type(screen.getByRole('textbox', { name: /Signa/ }), '2 dd 1 p.c.');
    await user.click(screen.getByRole('button', { name: 'Add to chart' }));

    expect(within(chart()).getByRole('rowheader', { name: /Metformin/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /1 safety note/ }));
    expect(screen.getByText('Metformin is not in the drug list')).toBeInTheDocument();
  });

  it('fills times, amount and food from a signa', async () => {
    const user = userEvent.setup();
    render(<App startup={startup()} catalog={testCatalog} />);

    await user.type(screen.getByRole('combobox', { name: 'Find a medicine' }), 'amox');
    await user.click(screen.getByRole('option', { name: /^Amoxicillin/ }));
    await user.type(screen.getByRole('textbox', { name: /Signa/ }), '3 dd 1 caps p.c.');

    expect(screen.getByRole('radio', { name: 'Every 8 hours (3x)' })).toBeChecked();
    expect(screen.getByText(/Every 8 hours: 07:00, 15:00, 23:00/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'With or after food' })).toBeChecked();
  });

  it('opens the More drawer with tabs and closes it', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ example: true })} catalog={testCatalog} />);

    await screen.findByRole('rowheader', { name: /Metformin/ });
    await user.click(screen.getByRole('button', { name: 'More options' }));
    const drawer = screen.getByRole('dialog', { name: 'More options' });
    await user.click(within(drawer).getByRole('tab', { name: 'Reminders' }));
    expect(
      within(drawer).getByRole('button', { name: 'Add to phone calendar' }),
    ).toBeInTheDocument();
    expect(within(drawer).getByText('23:00')).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(drawer).not.toHaveAttribute('open'));
  });

  it('switches the whole app and the chart to Indonesian', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ example: true })} catalog={testCatalog} />);

    await screen.findByRole('rowheader', { name: /Metformin/ });
    await user.click(screen.getByRole('button', { name: 'ID' }));
    const sheet = screen.getByRole('article', { name: 'Jadwal minum obat' });
    expect(within(sheet).getAllByText('21.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Biasanya diminum pada malam hari.')).toBeInTheDocument();
  });
});

describe('welcome intro', () => {
  it('opens the app on Start, only once', async () => {
    window.localStorage.clear();
    const user = userEvent.setup();
    render(<App startup={startup({ welcome: true })} catalog={testCatalog} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /patient can actually follow/,
    );

    await user.click(screen.getByRole('button', { name: 'Start a plan' }));
    expect(await screen.findByRole('combobox', { name: 'Find a medicine' })).toBeInTheDocument();
    expect(window.localStorage.getItem('pillplan:welcome-seen')).toBe('1');
  });

  it('skips with Escape and replays from the navbar', async () => {
    const user = userEvent.setup();
    render(<App startup={startup({ welcome: true })} catalog={testCatalog} />);

    await user.keyboard('{Escape}');
    await user.click(await screen.findByRole('button', { name: /Intro/ }));
    expect(await screen.findByRole('button', { name: 'Start a plan' })).toBeInTheDocument();
  });

  it('shows the welcome in Indonesian', () => {
    render(<App startup={startup({ welcome: true, lang: 'id' })} catalog={testCatalog} />);
    expect(screen.getByRole('button', { name: 'Mulai buat jadwal' })).toBeInTheDocument();
  });
});
