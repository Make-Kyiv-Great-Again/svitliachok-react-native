import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';

import { useTranslation } from 'react-i18next';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const lastSyncTime = useAppStore((state) => state.lastSyncTime);
  const { t, i18n } = useTranslation();

  const formattedSyncTime = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleString() 
    : t('settings.lastSync.never');

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('uk') ? 'en' : 'uk';
    i18n.changeLanguage(nextLang);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} /> {/* Empty view for centering */}
      </View>
      
      <View style={styles.content}>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Ionicons name="sync-circle-outline" size={24} color="#F59E0B" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t('settings.lastSync.title')}</Text>
              <Text style={styles.settingValue}>{formattedSyncTime}</Text>
            </View>
          </View>
          <Text style={styles.settingDescription}>
            {t('settings.lastSync.description')}
          </Text>
        </View>

        <View style={[styles.settingCard, { marginTop: 16 }]}>
          <View style={styles.settingRow}>
            <Ionicons name="language-outline" size={24} color="#F59E0B" />
            <View style={[styles.settingTextContainer, { flex: 1 }]}>
              <Text style={styles.settingTitle}>{t('settings.language.title')}</Text>
              <Text style={styles.settingValue}>
                {i18n.language.startsWith('uk') ? t('settings.language.uk') : t('settings.language.en')}
              </Text>
            </View>
            <TouchableOpacity style={styles.toggleBtn} onPress={toggleLanguage}>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.settingDescription}>
            {t('settings.language.description')}
          </Text>
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
});
