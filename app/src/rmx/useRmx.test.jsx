import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { RoleProvider } from './RoleContext';
import { useRmxQuery, useRmxAction, useReviewApply } from './useRmx';
import { R, rmxCall, RmxError } from './store';
import { setDemoMode } from './demoMode';

const wrapperFor = (role) => function Wrapper({ children }) {
  return <RoleProvider initialRole={role}>{children}</RoleProvider>;
};
const operator = wrapperFor('RMX_OPERATOR');
const OP = { email: 'operator@example.com', role: 'RMX_OPERATOR' };

describe('useRmxQuery', () => {
  it('goes loading -> data', async () => {
    const { result } = renderHook(() => useRmxQuery(R.offers, {}), { wrapper: operator });
    expect(result.current).toMatchObject({ loading: true, data: null, error: null });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.length).toBeGreaterThan(5);
  });

  it('is stable for a new object literal each render and reloads on a param change', async () => {
    const { result, rerender } = renderHook(({ v }) => useRmxQuery(R.offers, { vertical: v }), {
      wrapper: operator, initialProps: { v: 'debt' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ v: 'debt' });
    expect(result.current.loading).toBe(false);
    rerender({ v: 'payday' });
    expect(result.current).toMatchObject({ loading: true, data: null });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.map((o) => o.offerId)).toEqual(['sp-201', 'sp-202']);
  });

  it('reports errors and reloads', async () => {
    setDemoMode('error');
    const { result } = renderHook(() => useRmxQuery(R.offers), { wrapper: operator });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).toBe('Sample error: the RedirectMax internal API did not answer.');
    expect(result.current.data).toBeNull();
    act(() => setDemoMode('normal'));
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(result.current.error).toBeNull();
  });

  it('shows loading again on a demo-mode change', async () => {
    const { result } = renderHook(() => useRmxQuery(R.offers), { wrapper: operator });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => setDemoMode('empty'));
    expect(result.current).toMatchObject({ loading: true, data: null });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
  });

  it('refetches silently after a mutation', async () => {
    const { result } = renderHook(() => useRmxQuery(R.offers, { vertical: 'debt' }), { wrapper: operator });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const seen = [];
    const stop = setInterval(() => seen.push(result.current.loading), 0);
    await act(async () => {
      await rmxCall(R.offerCatalog, { offerId: 'dg-101', operatorStatus: 'paused', dryRun: false }, OP);
    });
    await waitFor(() => expect(result.current.data.find((o) => o.offerId === 'dg-101').operatorStatus).toBe('paused'));
    clearInterval(stop);
    expect(seen.every((l) => l === false)).toBe(true);
    expect(result.current.data).not.toBeNull();
  });

  it('reload() fetches again', async () => {
    const { result } = renderHook(() => useRmxQuery(R.offers), { wrapper: operator });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeTruthy();
  });
});

describe('useRmxAction', () => {
  it('injects the actor and resolves to the payload', async () => {
    const { result } = renderHook(() => useRmxAction(R.offerCatalog), { wrapper: operator });
    let payload;
    await act(async () => {
      payload = await result.current.run({ offerId: 'dg-101', operatorStatus: 'paused', dryRun: false });
    });
    expect(payload.applied).toBe(true);
    expect(result.current.running).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('rejects with the RmxError and sets error', async () => {
    const { result } = renderHook(() => useRmxAction(R.offerCatalog), { wrapper: wrapperFor('RMX_VIEWER') });
    let caught;
    await act(async () => {
      try {
        await result.current.run({ offerId: 'dg-101', operatorStatus: 'paused', dryRun: false });
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(RmxError);
    expect(result.current.error).toBe('Viewer cannot pause, resume or change caps and budgets.');
  });
});

describe('useReviewApply', () => {
  it('previews with a dry run, then applies and calls onApplied', async () => {
    const onApplied = vi.fn();
    const { result } = renderHook(() => useReviewApply(R.offerCatalog, { onApplied }), { wrapper: operator });
    expect(result.current.dialogProps.open).toBe(false);
    act(() => { result.current.start({ offerId: 'dg-101', operatorStatus: 'paused' }); });
    expect(result.current.dialogProps).toMatchObject({ open: true, loading: true });
    await waitFor(() => expect(result.current.dialogProps.loading).toBe(false));
    expect(result.current.dialogProps.before).toEqual({ operatorStatus: 'active' });
    expect(result.current.dialogProps.after).toEqual({ operatorStatus: 'paused' });
    expect(result.current.dialogProps.error).toBeNull();
    expect((await rmxCall(R.offers)).data.find((o) => o.offerId === 'dg-101').operatorStatus).toBe('active');
    await act(async () => { await result.current.dialogProps.onApply(); });
    expect(onApplied).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps).toMatchObject({ open: false, applying: false });
    expect((await rmxCall(R.offers)).data.find((o) => o.offerId === 'dg-101').operatorStatus).toBe('paused');
  });

  it('shows a preview error and cancels', async () => {
    const { result } = renderHook(() => useReviewApply(R.offerCatalog), { wrapper: operator });
    act(() => { result.current.start({ offerId: 'dg-104', operatorStatus: 'active' }); });
    await waitFor(() => expect(result.current.dialogProps.loading).toBe(false));
    expect(result.current.dialogProps.error).toBe('A data-pass offer cannot go live without counsel approval and a counsel reference.');
    act(() => result.current.dialogProps.onCancel());
    expect(result.current.dialogProps.open).toBe(false);
  });
});
