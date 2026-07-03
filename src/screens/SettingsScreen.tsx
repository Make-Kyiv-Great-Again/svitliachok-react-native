import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';

import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme/useTheme';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const lastSyncTime = useAppStore((state) => state.lastSyncTime);
  const themePreference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const formattedSyncTime = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleString() 
    : t('settings.lastSync.never');

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('uk') ? 'en' : 'uk';
    i18n.changeLanguage(nextLang);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10), backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} /> {/* Empty view for centering */}
      </View>
      
      <View style={styles.content}>
        <View style={[styles.settingCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.settingRow}>
            <Ionicons name="sync-circle-outline" size={24} color={colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{t('settings.lastSync.title')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{formattedSyncTime}</Text>
            </View>
          </View>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {t('settings.lastSync.description')}
          </Text>
        </View>

        <View style={[styles.settingCard, { marginTop: 16, backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.settingRow}>
            <Ionicons name="language-outline" size={24} color={colors.primary} />
            <View style={[styles.settingTextContainer, { flex: 1 }]}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{t('settings.language.title')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {i18n.language.startsWith('uk') ? t('settings.language.uk') : t('settings.language.en')}
              </Text>
            </View>
            <TouchableOpacity style={styles.toggleBtn} onPress={toggleLanguage}>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {t('settings.language.description')}
          </Text>
        </View>

        <View style={[styles.settingCard, { marginTop: 16, backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.settingRow}>
            <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
            <View style={[styles.settingTextContainer, { flex: 1 }]}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{t('settings.theme.title')}</Text>
            </View>
          </View>
          
          <View style={styles.themeSelectorRow}>
            {(['system', 'light', 'dark'] as const).map((theme) => {
              const isActive = themePreference === theme;
              return (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeBtn, 
                    { borderColor: colors.border, backgroundColor: isActive ? colors.primaryDim : 'transparent' },
                    isActive && { borderColor: colors.primary }
                  ]}
                  onPress={() => setThemePreference(theme)}
                >
                  <Text style={[styles.themeBtnText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                    {t(`settings.theme.${theme}`)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTextContainer: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  settingValue: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 12,
    lineHeight: 18,
  },
  toggleBtn: {
    backgroundColor: '#F59E0B',
    padding: 8,
    borderRadius: 8,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
