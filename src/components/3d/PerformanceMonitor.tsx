'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';

interface PerformanceMonitorProps {
  onUpdate?: () => void;
}

export function PerformanceMonitor({ onUpdate }: PerformanceMonitorProps) {
  const { gl } = useThree();
  
  useFrame(() => {
    // Trigger update on each frame to update stats
    if (onUpdate) {
      onUpdate();
    }
  });
  
  useEffect(() => {
    // Reset renderer info when component mounts
    if (gl && gl.info) {
      gl.info.reset();
    }
  }, [gl]);
  
  return null;
}