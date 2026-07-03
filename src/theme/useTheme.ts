import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/useAppStore';

const lightColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceOpaque: 'rgba(255, 255, 255, 0.95)',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  primary: '#F59E0B',
  primaryDim: 'rgba(245, 158, 11, 0.3)',
  iconActive: '#F59E0B',
  iconInactive: '#94a3b8',
  danger: '#ef4444',
  shadow: '#000000',
  divider: '#f1f5f9',
  mapStyle: 'light' as const,
};

const darkColors = {
  background: '#000000',
  surface: '#1c1c1e',
  surfaceOpaque: 'rgba(28, 28, 30, 0.95)',
  textPrimary: '#ffffff',
  textSecondary: '#8e8e93',
  border: '#333333',
  primary: '#F59E0B',
  primaryDim: 'rgba(245, 158, 11, 0.3)',
  iconActive: '#F59E0B',
  iconInactive: '#64748b',
  danger: '#f87171',
  shadow: '#000000',
  divider: '#334155',
  mapStyle: 'dark' as const,
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const themePreference = useAppStore((state) => state.themePreference);

  const isDarkMode = 
    themePreference === 'dark' || 
    (themePreference === 'system' && colorScheme === 'dark');

  const colors = isDarkMode ? darkColors : lightColors;

  return {
    colors,
    isDarkMode,
  };
};
