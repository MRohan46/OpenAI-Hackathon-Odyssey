import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme/tokens';

export interface QuestRoutePoint {
  x: number;
  y: number;
  completed?: boolean;
  featured?: boolean;
}

interface QuestRouteLineProps {
  width: number;
  height: number;
  points: QuestRoutePoint[];
  highContrast?: boolean;
}

function routePath(points: QuestRoutePoint[]) {
  if (points.length === 0) return '';

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpoint = (previous.y + point.y) / 2;
    return `${path} C ${previous.x} ${midpoint}, ${point.x} ${midpoint}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

export function QuestRouteLine({ width, height, points, highContrast = false }: QuestRouteLineProps) {
  const path = useMemo(() => routePath(points), [points]);

  if (!path) return null;

  return (
    <View
      aria-hidden
      style={styles.frame}
      testID="quest-route-line"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
        <Path
          d={path}
          fill="none"
          stroke={highContrast ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.74)'}
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={path}
          fill="none"
          stroke={colors.ink}
          strokeWidth={highContrast ? 4.5 : 3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 14"
        />
        {points.slice(1, -1).map((point, index) => (
          <React.Fragment key={`${point.x}-${point.y}-${index}`}>
            <Circle cx={point.x} cy={point.y} r={point.featured ? 15 : 11} fill="rgba(255,255,255,0.92)" />
            <Circle
              cx={point.x}
              cy={point.y}
              r={point.featured ? 10 : 7}
              fill={point.completed ? colors.success : point.featured ? colors.sun : colors.white}
              stroke={colors.ink}
              strokeWidth={point.featured ? 3 : 2.25}
            />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2, pointerEvents: 'none' },
});
