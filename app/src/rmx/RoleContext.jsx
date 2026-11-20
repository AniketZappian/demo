import { createContext, useContext, useMemo, useState } from 'react';
import { ROLE_LABELS, ROLE_USERS, can, deniedReason } from './roles';

const RoleContext = createContext(null);

export function RoleProvider({ initialRole = 'RMX_OPERATOR', children }) {
  const [role, setRole] = useState(initialRole);
  const value = useMemo(
    () => ({
      role,
      label: ROLE_LABELS[role],
      email: ROLE_USERS[role],
      setRole,
      can: (action) => can(role, action),
      deniedReason: (action) => deniedReason(role, action),
    }),
    [role],
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
