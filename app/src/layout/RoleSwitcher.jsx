import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { ROLES, ROLE_LABELS, ROLE_USERS } from '../rmx/roles';
import { useRole } from '../rmx/RoleContext';
import { colors } from '../theme/tokens';

export default function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <Select
      size="small"
      value={role}
      onChange={(e) => setRole(e.target.value)}
      SelectDisplayProps={{ 'aria-label': 'Role' }}
      renderValue={(value) => `${ROLE_LABELS[value]} · ${ROLE_USERS[value]}`}
      sx={{
        mr: 1,
        minWidth: 240,
        color: colors.white,
        fontSize: 13,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.white },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.white },
        '& .MuiSvgIcon-root': { color: colors.white },
        '& .MuiSelect-select': { py: 0.5 },
      }}
    >
      {ROLES.map((r) => (
        <MenuItem key={r} value={r}>
          {ROLE_LABELS[r]} · {ROLE_USERS[r]}
        </MenuItem>
      ))}
    </Select>
  );
}
