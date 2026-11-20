import { useState } from 'react';
import { Box, Drawer, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OfferDetailsTab from './OfferDetailsTab';
import OfferRulesTab from './OfferRulesTab';
import { layout } from '../../../theme/tokens';

export default function OfferDrawer({ offer, onClose }) {
  const [tab, setTab] = useState('details');
  return (
    <Drawer anchor="right" open={!!offer} onClose={onClose} PaperProps={{ sx: { width: layout.drawerPaperWidth } }}>
      {offer && (
        <Box p={2}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{offer.name}</Typography>
              <IconButton aria-label="Close" onClick={onClose}><CloseIcon /></IconButton>
            </Stack>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab value="details" label="Details" />
              <Tab value="rules" label="Rules" />
            </Tabs>
            {tab === 'details' ? <OfferDetailsTab offer={offer} /> : <OfferRulesTab offer={offer} />}
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
