import { vi } from 'vitest';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderApp } from './render';
import { RMX_TABS } from '../routes';

const heading = (name) => screen.findByRole('heading', { level: 1, name });

describe('demo tour', () => {
  it('shows the demo banner on the dashboard', async () => {
    renderApp('/dashboard');
    expect(await heading('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Demo: sample data')).toBeInTheDocument();
  });

  const tabs = [
    ...RMX_TABS.operations.map((t) => ({ ...t, section: 'operations' })),
    ...RMX_TABS.setup.map((t) => ({ ...t, section: 'setup' })),
  ];

  it('covers all 13 RedirectMax tabs', () => {
    expect(tabs).toHaveLength(13);
  });

  it.each(tabs)('$section/$slug heading equals its tab label', async ({ section, slug, label }) => {
    renderApp(`/redirectmax/${section}/${slug}`);
    expect(await heading(label)).toBeInTheDocument();
    expect(screen.queryByText(/not built yet/i)).not.toBeInTheDocument();
  });

  it('operator pauses dg-101, sees it on Audit, and Viewer cannot pause', async () => {
    const { user } = renderApp('/redirectmax/operations/offers', { role: 'RMX_OPERATOR' });
    await user.click(await screen.findByText('dg-101'));
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    const dialog = await screen.findByRole('dialog', {}, { timeout: 3000 });
    const apply = await within(dialog).findByRole('button', { name: 'Apply' });
    await vi.waitFor(() => expect(apply).toBeEnabled());
    await user.click(apply);
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(await screen.findByRole('tab', { name: 'Audit' }));
    expect(await heading('Audit')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Audit log' });
    const rows = within(table).getAllByRole('row');
    const hit = rows.filter((r) => /dg-101/.test(r.textContent) && /operator@example\.com via lds-api/.test(r.textContent));
    expect(hit).toHaveLength(1);
    expect(rows[1].textContent).toMatch(/operator@example\.com via lds-api/);
    expect(rows[1].textContent).toMatch(/dg-101/);

    await user.click(await screen.findByRole('tab', { name: 'Offers' }));
    await user.click(await screen.findByRole('combobox', { name: 'Role' }));
    await user.click(await screen.findByRole('option', { name: /Viewer/ }));
    await user.click(await screen.findByText('dg-105'));
    expect(await screen.findByRole('button', { name: 'Pause' })).toBeDisabled();
  });
});
