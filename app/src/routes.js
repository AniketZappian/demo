import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import AddBusinessOutlined from '@mui/icons-material/AddBusinessOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import AltRoute from '@mui/icons-material/AltRoute';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';

// Sidebar groups. `name` '' means no caption. `icon` is a component.
export const NAV = [
  {
    name: '',
    items: [{ name: 'Dashboard', route: '/dashboard', icon: DashboardOutlined }],
  },
  {
    name: 'Report & Analytics',
    items: [{ name: 'Pub-Reports', route: '/pub-report', icon: AssessmentOutlined }],
  },
  {
    name: 'Client Management',
    items: [
      { name: 'Buyers', route: '/buyers', icon: CampaignOutlined },
      { name: 'Campaigns', route: '/campaigns', icon: CampaignOutlined },
      { name: 'Buyer Labels', route: '/buyer-labels', icon: CampaignOutlined },
      { name: 'Buyer Tags', route: '/buyer-tags', icon: CampaignOutlined },
      { name: 'Campaign Tags', route: '/campaign-tags', icon: CampaignOutlined },
      { name: 'PL / DNPL', route: '/pldnpl', icon: CampaignOutlined },
    ],
  },
  {
    name: 'Publisher Management',
    items: [
      { name: 'Publishers', route: '/publisher', icon: AddBusinessOutlined },
      { name: 'Channels', route: '/channel', icon: AddBusinessOutlined },
      { name: 'Publisher Tags', route: '/publisher-tags', icon: AddBusinessOutlined },
      { name: 'Publisher Label', route: '/publisher-label', icon: AddBusinessOutlined },
      { name: 'Channel Label', route: '/channel-label', icon: AddBusinessOutlined },
      { name: 'Source - Channel Mapping', route: '/channel-mapping', icon: AddBusinessOutlined },
    ],
  },
  {
    name: 'Lead Distribution',
    items: [
      { name: 'Pingtree', route: '/ping-tree', icon: AccountTreeOutlined },
      { name: 'Marketplace', route: '/marketplace', icon: AccountTreeOutlined },
      { name: 'Silent', route: '/silent', icon: AccountTreeOutlined },
    ],
  },
  {
    name: 'User Management',
    items: [
      { name: 'Users', route: '/users', icon: ManageAccountsOutlined },
      { name: 'Add User', route: '/add-user', icon: ManageAccountsOutlined },
    ],
  },
];

// Top-level collapsible sidebar button, rendered directly under Dashboard.
export const RMX_NAV = {
  name: 'RedirectMax',
  route: '/redirectmax',
  icon: AltRoute,
  items: [
    { name: 'Operations', route: '/redirectmax/operations', icon: AltRoute },
    { name: 'Setup and changes', route: '/redirectmax/setup', icon: TuneOutlined },
    // Shown only to roles that can review (Approver, Super admin), with a count of waiting items.
    { name: 'Review queue', route: '/redirectmax/review', icon: FactCheckOutlined, requires: 'review.view', badge: 'review' },
  ],
};

export const RMX_TABS = {
  operations: [
    { slug: 'overview', label: 'Overview', screen: 'operations/OverviewScreen' },
    { slug: 'offers', label: 'Offers', screen: 'operations/OffersScreen' },
    { slug: 'payouts', label: 'Payouts', screen: 'operations/PayoutsScreen' },
    { slug: 'decisions', label: 'Decisions', screen: 'operations/DecisionsScreen' },
    { slug: 'simulator', label: 'Simulator', screen: 'operations/SimulatorScreen' },
    { slug: 'syncs', label: 'Syncs and reconciliation', screen: 'operations/SyncsScreen' },
    { slug: 'audit', label: 'Audit', screen: 'operations/AuditScreen' },
  ],
  setup: [
    { slug: 'verticals', label: 'Verticals', screen: 'setup/VerticalsScreen' },
    { slug: 'new-vertical', label: 'New vertical', screen: 'setup/NewVerticalScreen' },
    { slug: 'config', label: 'Config changes', screen: 'setup/ConfigChangesScreen' },
    { slug: 'question-sets', label: 'Question sets', screen: 'setup/QuestionSetsScreen' },
    { slug: 'websites', label: 'Websites', screen: 'setup/WebsitesScreen' },
    { slug: 'settings', label: 'Settings', screen: 'setup/SettingsScreen' },
  ],
  review: [
    { slug: 'queue', label: 'Waiting for review', screen: 'review/ReviewQueueScreen' },
  ],
};
