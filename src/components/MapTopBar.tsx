import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/useTheme';

export type AppMode = 'INSPECT' | 'ROUTING';

interface MapTopBarProps {
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isSearchOpen: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  searchResults: any[];
  isSearching: boolean;
  onSelectSearchResult: (item: any) => void;
  selectedOrigin: { latitude: number; longitude: number } | null;
  selectedDestination: { latitude: number; longitude: number } | null;
  topPadding: number;
}

export const MapTopBar: React.FC<MapTopBarProps> = ({
  appMode,
  onModeChange,
  isSearchOpen,
  searchQuery,
  onSearchQueryChange,
  onSearchOpen,
  onSearchClose,
  searchResults,
  isSearching,
  onSelectSearchResult,
  selectedOrigin,
  selectedDestination,
  topPadding,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.topBarContainer, { paddingTop: topPadding }]} pointerEvents="box-none">
      {isSearchOpen ? (
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchInputRow, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Ionicons name="search" size={20} color={colors.iconInactive} style={styles.searchIconLeft} />
            <TextInput
              style={[styles.searchInputSingle, { color: colors.textPrimary }]}
              placeholder={t('map.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              autoFocus
            />
            <TouchableOpacity onPress={onSearchClose}>
              <Ionicons name="close" size={20} color={colors.iconInactive} />
            </TouchableOpacity>
          </View>

          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
          )}

          {!isSearching && searchResults.length > 0 && (
            <View style={[styles.searchResultsContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={item.place_id || index}
                  style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                  onPress={() => onSelectSearchResult(item)}
                >
                  <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.searchResultIcon} />
                  <Text style={[styles.searchResultText, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.topBarWrapper, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[styles.modeButton, appMode === 'INSPECT' && [styles.modeButtonActive, { backgroundColor: colors.selected }]]}
              onPress={() => onModeChange('INSPECT')}
            >
              <Text style={[styles.modeButtonText, { color: colors.textSecondary }, appMode === 'INSPECT' && [styles.modeButtonTextActive, { color: colors.textPrimary }]]}>
                {t('map.modeInspect')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, appMode === 'ROUTING' && [styles.modeButtonActive, { backgroundColor: colors.selected }]]}
              onPress={() => onModeChange('ROUTING')}
            >
              <Text style={[styles.modeButtonText, { color: colors.textSecondary }, appMode === 'ROUTING' && [styles.modeButtonTextActive, { color: colors.textPrimary }]]}>
                {t('map.modePaths')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.searchIconBtn, { backgroundColor: colors.surface }]}
            onPress={onSearchOpen}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {appMode === 'ROUTING' && !isSearchOpen && (!selectedOrigin || !selectedDestination) && (
        <View style={[styles.instructionContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {!selectedOrigin && !selectedDestination && (
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{t('map.pathStart')}</Text>
          )}
          {selectedOrigin && !selectedDestination && (
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{t('map.pathDest')}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topBarContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 10,
  },
  topBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 4,
    height: 48,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  topBar: {
    flexDirection: 'row',
  },
  modeButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#1f2937',
  },
  modeButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  searchBarContainer: {
    width: '90%',
    backgroundColor: 'transparent',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInputSingle: {
    flex: 1,
    fontSize: 16,
  },
  searchResultsContainer: {
    marginTop: 8,
    borderRadius: 24,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  searchResultIcon: {
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
  },
  instructionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
