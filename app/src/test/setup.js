import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { resetStore } from '../rmx/store';
import { setDemoMode } from '../rmx/demoMode';

afterEach(() => {
  resetStore();
  setDemoMode('normal');
});
