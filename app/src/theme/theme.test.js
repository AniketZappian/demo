import { describe, it, expect } from 'vitest';
import { createTheme } from '@mui/material/styles';
import { colors, layout, fonts } from './tokens';
import defaultTheme, { theme } from './theme';

describe('theme tokens', () => {
  it('has the contract colours', () => {
    expect(colors).toEqual({
      topBar: '#0C247B',
      navActive: '#2A4BC0',
      navActiveHover: '#4a72ff',
      pageBg: '#F1F2F4',
      navText: '#000',
      white: '#fff',
      demoBanner: '#ff841f',
      demoBannerText: '#212529',
      changedRowBg: '#fff8c5',
      diffAddBg: '#dafbe1',
      diffRemoveBg: '#ffebe9',
      codeBg: '#f6f8fa',
    });
  });

  it('has the contract layout and fonts', () => {
    expect(layout).toEqual({
      drawerWidth: 200,
      navItemHeight: 40,
      navItemRadius: 5,
      navFontSize: 12,
      navIconSize: 18,
      navIconMinWidth: 35,
      drawerPaperWidth: 480,
    });
    expect(fonts.mono).toBe('Menlo, Consolas, monospace');
  });
});

describe('theme', () => {
  it('is exported as named and default', () => {
    expect(defaultTheme).toBe(theme);
  });

  it('uses the MUI default primary', () => {
    expect(theme.palette.primary.main).toBe(createTheme().palette.primary.main);
    expect(theme.palette.primary.main).toBe('#1976d2');
  });
});
