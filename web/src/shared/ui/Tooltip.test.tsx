import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('names an icon-only button', () => {
    render(
      <Tooltip text="Remove Metformin" role="label">
        <button type="button">x</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Remove Metformin' })).toBeInTheDocument();
  });

  it('describes a labelled button', () => {
    render(
      <Tooltip text="Add a medicine first">
        <button type="button">Print</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Print' })).toHaveAccessibleDescription(
      'Add a medicine first',
    );
  });

  it('opens on keyboard focus and closes with Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip text="English">
        <button type="button">EN</button>
      </Tooltip>,
    );
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(tip).not.toHaveAttribute('data-open');
    await user.tab();
    await waitFor(() => expect(tip).toHaveAttribute('data-open'));
    await user.keyboard('{Escape}');
    expect(tip).not.toHaveAttribute('data-open');
  });
});
