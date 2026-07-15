import React from 'react';
import { Polygon } from 'react-native-maps';
import { BuildingPolygon } from '../types/api';
import { useTheme } from '../theme/useTheme';

interface BuildingsLayerProps {
  buildings: BuildingPolygon[];
}

export const BuildingsLayer: React.FC<BuildingsLayerProps> = ({ buildings }) => {
  const { isDarkMode } = useTheme();

  return (
    <>
      {buildings.map((building) => {
        let fillColor = isDarkMode 
          ? 'rgba(71, 85, 105, 0.3)'  // Slate-600
          : 'rgba(148, 163, 184, 0.3)'; // Slate-400
        let strokeColor = isDarkMode ? '#475569' : '#94a3b8'; // UNKNOWN

        if (building.status === 'ON') {
          // Warm Amber/Gold glowing lights
          fillColor = isDarkMode 
            ? 'rgba(245, 158, 11, 0.35)' // Amber-500 (Glow in dark mode)
            : 'rgba(217, 119, 6, 0.25)';  // Amber-600 (Subtle gold in light mode)
          strokeColor = isDarkMode ? '#f59e0b' : '#d97706';
        } else if (building.status === 'OFF' || building.status === 'EMERGENCY') {
          // Dark blackout/power outage
          fillColor = isDarkMode 
            ? 'rgba(15, 23, 42, 0.85)'  // Slate-900
            : 'rgba(71, 85, 105, 0.6)';  // Slate-600
          strokeColor = isDarkMode ? '#1e293b' : '#475569';
        }

        return (
          <Polygon
            key={`building-${building.id}`}
            coordinates={building.coordinates}
            fillColor={fillColor}
            strokeColor={strokeColor}
            strokeWidth={1}
            tappable={true}
          />
        );
      })}
    </>
  );
};
