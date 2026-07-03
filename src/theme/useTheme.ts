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
  background: '#0f172a',
  surface: '#1e293b',
  surfaceOpaque: 'rgba(30, 41, 59, 0.95)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
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
