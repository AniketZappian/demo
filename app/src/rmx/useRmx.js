import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { rmxCall, subscribe, getVersion } from './store';
import { useDemoMode } from './demoMode';
import { useRole } from './RoleContext';

const messageOf = (e) => (e && e.message) || 'Something went wrong.';

export function useRmxQuery(route, data) {
  const paramsJson = JSON.stringify(data ?? {});
  const params = useMemo(() => JSON.parse(paramsJson), [paramsJson]);
  const key = route + paramsJson;
  const [mode] = useDemoMode();
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const latest = useRef(0);
  const seenVersion = useRef(version);

  const fetchNow = useCallback((silent, resultKey) => {
    latest.current += 1;
    const ticket = latest.current;
    if (!silent) setResult({ key: null, data: null, error: null });
    rmxCall(route, params).then(
      (res) => { if (ticket === latest.current) setResult({ key: resultKey, data: res.data, error: null }); },
      (err) => { if (ticket === latest.current) setResult({ key: resultKey, data: null, error: messageOf(err) }); },
    );
  }, [route, params]);

  const loadKey = `${key}|${mode}|${nonce}`;
  useEffect(() => {
    fetchNow(false, loadKey);
    return () => { latest.current += 1; };
  }, [fetchNow, loadKey]);

  useEffect(() => {
    if (seenVersion.current === version) return;
    seenVersion.current = version;
    fetchNow(true, loadKey);
  }, [version, fetchNow, loadKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = result.key === loadKey;
  return {
    data: current ? result.data : null,
    loading: !current,
    error: current ? result.error : null,
    reload,
  };
}

export function useRmxAction(route) {
  const { email, role } = useRole();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const run = useCallback(async (data) => {
    setRunning(true);
    setError(null);
    try {
      const res = await rmxCall(route, data, { email, role });
      return res.data;
    } catch (e) {
      setError(messageOf(e));
      throw e;
    } finally {
      setRunning(false);
    }
  }, [route, email, role]);
  return { run, running, error };
}

export function useReviewApply(route, { onApplied } = {}) {
  const { email, role } = useRole();
  const [ui, setUi] = useState({ open: false, loading: false, error: null, before: null, after: null, applying: false });
  const pending = useRef(null);
  const token = useRef(0);
  const appliedRef = useRef(onApplied);
  useEffect(() => { appliedRef.current = onApplied; });

  const start = useCallback((data) => {
    pending.current = data;
    token.current += 1;
    const mine = token.current;
    setUi({ open: true, loading: true, error: null, before: null, after: null, applying: false });
    rmxCall(route, { ...data, dryRun: true }, { email, role }).then(
      (res) => {
        if (mine === token.current) setUi((u) => ({ ...u, loading: false, before: res.data.before, after: res.data.after }));
      },
      (err) => {
        if (mine === token.current) setUi((u) => ({ ...u, loading: false, error: messageOf(err) }));
      },
    );
  }, [route, email, role]);

  const onApply = useCallback(async () => {
    const mine = token.current;
    setUi((u) => ({ ...u, applying: true, error: null }));
    try {
      const res = await rmxCall(route, { ...pending.current, dryRun: false }, { email, role });
      if (mine !== token.current) return;
      setUi((u) => ({ ...u, open: false, applying: false }));
      if (appliedRef.current) appliedRef.current(res.data);
    } catch (err) {
      if (mine === token.current) setUi((u) => ({ ...u, applying: false, error: messageOf(err) }));
    }
  }, [route, email, role]);

  const onCancel = useCallback(() => {
    token.current += 1;
    setUi((u) => ({ ...u, open: false, loading: false, applying: false }));
  }, []);

  return { start, dialogProps: { ...ui, onApply, onCancel } };
}
