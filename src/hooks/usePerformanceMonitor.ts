'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

export interface PerformanceStats {
  fps: number;
  avgFps: number;
  memory: {
    geometries: number;
    textures: number;
    programs: number;
    totalMB: number;
  };
  render: {
    triangles: number;
    drawCalls: number;
    points: number;
    lines: number;
  };
  loadTime: number;
  fileSize: number;
}

export function usePerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    avgFps: 0,
    memory: {
      geometries: 0,
      textures: 0,
      programs: 0,
      totalMB: 0,
    },
    render: {
      triangles: 0,
      drawCalls: 0,
      points: 0,
      lines: 0,
    },
    loadTime: 0,
    fileSize: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const calculateMemoryUsage = useCallback(() => {
    if (!rendererRef.current) return { geometries: 0, textures: 0, programs: 0, totalMB: 0 };

    const info = rendererRef.current.info;
    const memory = info.memory;
    const programs = info.programs?.length || 0;

    // Estimate memory usage in MB
    // This is a rough estimation as WebGL doesn't provide exact memory usage
    const geometryMemory = memory.geometries * 0.1; // Rough estimate: 100KB per geometry
    const textureMemory = memory.textures * 0.5; // Rough estimate: 500KB per texture
    const programMemory = programs * 0.01; // Rough estimate: 10KB per shader program
    const totalMB = geometryMemory + textureMemory + programMemory;

    return {
      geometries: memory.geometries,
      textures: memory.textures,
      programs,
      totalMB: Math.round(totalMB * 100) / 100,
    };
  }, []);

  const calculateRenderStats = useCallback(() => {
    if (!rendererRef.current) return { triangles: 0, drawCalls: 0, points: 0, lines: 0 };

    const info = rendererRef.current.info;
    const render = info.render;

    return {
      triangles: render.triangles,
      drawCalls: render.calls,
      points: render.points,
      lines: render.lines,
    };
  }, []);

  const updateStats = useCallback(() => {
    if (!rendererRef.current) return;
    
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Calculate FPS
    const fps = 1000 / delta;
    frameTimesRef.current.push(fps);

    // Keep only last 60 frames for average
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate average FPS
    const avgFps = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;

    // Get memory and render stats
    const memory = calculateMemoryUsage();
    const render = calculateRenderStats();

    setStats(prev => ({
      ...prev,
      fps: Math.round(fps),
      avgFps: Math.round(avgFps),
      memory,
      render,
    }));
  }, [calculateMemoryUsage, calculateRenderStats]);

  const startMonitoring = useCallback((renderer: THREE.WebGLRenderer, scene: THREE.Scene) => {
    rendererRef.current = renderer;
    sceneRef.current = scene;
    frameTimesRef.current = [];
    lastTimeRef.current = performance.now();
    setIsMonitoring(true);

    // Reset renderer info
    if (renderer.info) {
      renderer.info.reset();
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  const setLoadMetrics = useCallback((loadTime: number, fileSize: number) => {
    setStats(prev => ({
      ...prev,
      loadTime: Math.round(loadTime),
      fileSize: Math.round(fileSize * 100) / 100, // Convert to MB with 2 decimal places
    }));
  }, []);

  // Animation loop for monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const animate = () => {
      updateStats();
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isMonitoring, updateStats]);

  return {
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    setLoadMetrics,
  };
}