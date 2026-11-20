import { Button, Tooltip } from '@mui/material';
import { useRole } from '../rmx/RoleContext';

export default function ActionButton({ action, disabledReason, children, ...buttonProps }) {
  const role = useRole();
  const roleBlocked = action && !role.can(action);
  const reason = disabledReason || (roleBlocked ? role.deniedReason(action) : null);
  if (!reason) return <Button {...buttonProps}>{children}</Button>;
  return (
    <Tooltip title={reason}>
      <span>
        <Button {...buttonProps} disabled>{children}</Button>
      </span>
    </Tooltip>
  );
}
