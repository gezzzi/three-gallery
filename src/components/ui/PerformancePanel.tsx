'use client';

import React from 'react';
import { PerformanceStats } from '@/hooks/usePerformanceMonitor';
import { Activity, Cpu, HardDrive, Zap, Clock } from 'lucide-react';

interface PerformancePanelProps {
  stats: PerformanceStats;
  isVisible: boolean;
  onClose: () => void;
}

export function PerformancePanel({ stats, isVisible, onClose }: PerformancePanelProps) {
  if (!isVisible) return null;

  // FPS color coding
  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFpsStatus = (fps: number) => {
    if (fps >= 50) return 'Smooth';
    if (fps >= 30) return 'Good';
    if (fps >= 20) return 'Acceptable';
    return 'Poor';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-md text-white p-4 rounded-lg shadow-2xl z-[9999] min-w-[320px] border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Performance Monitor</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close performance panel"
        >
          ×
        </button>
      </div>

      {/* Performance Grid */}
      <div className="space-y-3">
        {/* FPS Section */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Frame Rate</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              stats.avgFps >= 50 ? 'bg-green-500/20 text-green-400' :
              stats.avgFps >= 30 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {getFpsStatus(stats.avgFps)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={`text-2xl font-bold ${getFpsColor(stats.fps)}`}>
                {stats.fps}
              </div>
              <div className="text-xs text-gray-400">Current FPS</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getFpsColor(stats.avgFps)}`}>
                {stats.avgFps}
              </div>
              <div className="text-xs text-gray-400">Average FPS</div>
            </div>
          </div>
        </div>

        {/* Rendering Stats */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Rendering</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Triangles:</span>
              <span className="font-mono">{stats.render.triangles.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Draw Calls:</span>
              <span className="font-mono">{stats.render.drawCalls}</span>
            </div>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Memory</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Usage:</span>
              <span className="font-mono text-blue-400">{stats.memory.totalMB} MB</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div className="text-center">
                <div className="font-mono text-white">{stats.memory.geometries}</div>
                <div className="text-gray-500">Geometries</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-white">{stats.memory.textures}</div>
                <div className="text-gray-500">Textures</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-white">{stats.memory.programs}</div>
                <div className="text-gray-500">Shaders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Load Metrics */}
        {(stats.loadTime > 0 || stats.fileSize > 0) && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Load Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {stats.loadTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Load Time:</span>
                  <span className="font-mono">{stats.loadTime}ms</span>
                </div>
              )}
              {stats.fileSize > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">File Size:</span>
                  <span className="font-mono">{stats.fileSize} MB</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-xs text-gray-400">
          {stats.avgFps < 30 && (
            <p className="text-yellow-400">⚠️ Low FPS detected. Try reducing quality settings.</p>
          )}
          {stats.render.triangles > 1000000 && (
            <p className="text-yellow-400">⚠️ High polygon count may affect performance.</p>
          )}
          {stats.memory.totalMB > 100 && (
            <p className="text-yellow-400">⚠️ High memory usage detected.</p>
          )}
          {stats.avgFps >= 50 && stats.render.triangles < 500000 && (
            <p className="text-green-400">✓ Performance is optimal.</p>
          )}
        </div>
      </div>
    </div>
  );
}