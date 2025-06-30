import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Svg, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WaveformPoint {
  value: number;
  timestamp: number;
}

interface WaveDisplayProps {
  data: WaveformPoint[];
  isActive: boolean;
  width: number;
  height: number;
}

export function WaveDisplay({ data, isActive, width, height }: WaveDisplayProps) {
  const animationRef = useRef<any>();

  // Convert data points to SVG path coordinates
  const createPath = () => {
    if (data.length < 2) return '';

    const maxValue = Math.max(...data.map(d => d.value), 10);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const normalizedValue = (point.value - minValue) / range;
      const y = height - (normalizedValue * height * 0.8) - (height * 0.1);
      return `${x},${y}`;
    }).join(' ');

    return points;
  };

  const pathPoints = createPath();
  const strokeColor = isActive ? '#EF4444' : '#60A5FA';
  const glowColor = isActive ? '#FEE2E2' : '#DBEAFE';

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        
        {/* Background grid lines */}
        {[...Array(5)].map((_, i) => (
          <Polyline
            key={`grid-${i}`}
            points={`0,${(i * height) / 4} ${width},${(i * height) / 4}`}
            fill="none"
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="1"
          />
        ))}
        
        {/* Waveform line */}
        {pathPoints && (
          <>
            {/* Glow effect */}
            <Polyline
              points={pathPoints}
              fill="none"
              stroke={glowColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
            
            {/* Main line */}
            <Polyline
              points={pathPoints}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </Svg>
      
      {/* Overlay effects */}
      <View style={[styles.overlay, isActive && styles.activeOverlay]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  activeOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
});