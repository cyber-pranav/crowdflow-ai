'use client';

import { useState } from 'react';
import type { HeatmapData, ZoneDensityData } from '@/types';

interface StadiumMapProps {
  densityData: HeatmapData | null;
  routePath?: { x: number; y: number }[];
  onZoneClick?: (zoneId: string) => void;
}

// Zone shape definitions for SVG rendering
const ZONE_SHAPES: Record<string, { path: string; labelPos: { x: number; y: number } }> = {
  'stand-north': {
    path: 'M 250 60 Q 400 20 550 60 L 530 130 Q 400 100 270 130 Z',
    labelPos: { x: 400, y: 85 },
  },
  'stand-south': {
    path: 'M 270 470 Q 400 500 530 470 L 550 540 Q 400 580 250 540 Z',
    labelPos: { x: 400, y: 515 },
  },
  'stand-east': {
    path: 'M 570 150 L 670 200 L 670 400 L 570 450 L 570 150 Z',
    labelPos: { x: 620, y: 300 },
  },
  'stand-west': {
    path: 'M 230 150 L 130 200 L 130 400 L 230 450 L 230 150 Z',
    labelPos: { x: 180, y: 300 },
  },
  'concourse-north': {
    path: 'M 270 130 Q 400 100 530 130 L 520 170 Q 400 150 280 170 Z',
    labelPos: { x: 400, y: 150 },
  },
  'concourse-south': {
    path: 'M 280 430 Q 400 450 520 430 L 530 470 Q 400 500 270 470 Z',
    labelPos: { x: 400, y: 450 },
  },
  'concourse-east': {
    path: 'M 530 170 L 570 150 L 570 450 L 530 430 Z',
    labelPos: { x: 550, y: 300 },
  },
  'concourse-west': {
    path: 'M 270 170 L 230 150 L 230 450 L 270 430 Z',
    labelPos: { x: 250, y: 300 },
  },
  'food-north': {
    path: 'M 290 130 L 350 120 L 350 160 L 290 165 Z',
    labelPos: { x: 320, y: 142 },
  },
  'food-south': {
    path: 'M 450 440 L 520 435 L 520 470 L 450 468 Z',
    labelPos: { x: 485, y: 455 },
  },
  'food-east': {
    path: 'M 575 200 L 640 185 L 640 240 L 575 245 Z',
    labelPos: { x: 608, y: 215 },
  },
  'restroom-nw': {
    path: 'M 235 155 L 275 148 L 275 180 L 235 185 Z',
    labelPos: { x: 255, y: 168 },
  },
  'restroom-se': {
    path: 'M 525 430 L 565 425 L 565 455 L 525 458 Z',
    labelPos: { x: 545, y: 442 },
  },
  'gate-a': {
    path: 'M 365 20 L 435 20 L 435 55 L 365 55 Z',
    labelPos: { x: 400, y: 38 },
  },
  'gate-b': {
    path: 'M 675 265 L 730 265 L 730 335 L 675 335 Z',
    labelPos: { x: 702, y: 300 },
  },
  'gate-c': {
    path: 'M 365 545 L 435 545 L 435 580 L 365 580 Z',
    labelPos: { x: 400, y: 562 },
  },
  'gate-d': {
    path: 'M 70 265 L 125 265 L 125 335 L 70 335 Z',
    labelPos: { x: 98, y: 300 },
  },
  'emergency-ne': {
    path: 'M 610 80 L 665 80 L 665 115 L 610 115 Z',
    labelPos: { x: 638, y: 98 },
  },
  'emergency-sw': {
    path: 'M 115 485 L 175 485 L 175 520 L 115 520 Z',
    labelPos: { x: 145, y: 502 },
  },
  'vip-west': {
    path: 'M 110 200 L 125 200 L 125 260 L 110 260 Z',
    labelPos: { x: 118, y: 230 },
  },
  'medical': {
    path: 'M 640 380 L 690 380 L 690 420 L 640 420 Z',
    labelPos: { x: 665, y: 400 },
  },
};

const SHORT_NAMES: Record<string, string> = {
  'stand-north': 'N. Stand',
  'stand-south': 'S. Stand',
  'stand-east': 'E. Stand',
  'stand-west': 'W. Stand',
  'concourse-north': 'N. Concourse',
  'concourse-south': 'S. Concourse',
  'concourse-east': 'E. Conc.',
  'concourse-west': 'W. Conc.',
  'food-north': '🍔 Food',
  'food-south': '🍔 Food',
  'food-east': '🍔 Food',
  'restroom-nw': '🚻',
  'restroom-se': '🚻',
  'gate-a': 'Gate A',
  'gate-b': 'Gate B',
  'gate-c': 'Gate C',
  'gate-d': 'Gate D',
  'emergency-ne': '🚨 Exit',
  'emergency-sw': '🚨 Exit',
  'vip-west': 'VIP',
  'medical': '🏥',
};

export default function StadiumMap({ densityData, routePath, onZoneClick }: StadiumMapProps) {
  const [hoveredZone, setHoveredZone] = useState<ZoneDensityData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getZoneData = (zoneId: string): ZoneDensityData | undefined => {
    return densityData?.zones.find(z => z.zoneId === zoneId);
  };

  const handleMouseMove = (e: React.MouseEvent, zoneId: string) => {
    const rect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top - 10,
      });
    }
    const data = getZoneData(zoneId);
    if (data) setHoveredZone(data);
  };

  return (
    <div className="stadium-map-container" style={{ position: 'relative' }}>
      <svg
        viewBox="0 0 800 600"
        className="stadium-svg"
        style={{ filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.08))' }}
      >
        {/* Background */}
        <defs>
          <radialGradient id="field-gradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#166534" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#14532d" stopOpacity="0.3" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Playing field */}
        <rect x="280" y="175" width="240" height="250" rx="8"
          fill="url(#field-gradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        {/* Field lines */}
        <line x1="400" y1="175" x2="400" y2="425" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <circle cx="400" cy="300" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <circle cx="400" cy="300" r="3" fill="rgba(255,255,255,0.2)" />

        {/* Render zones */}
        {Object.entries(ZONE_SHAPES).map(([zoneId, shape]) => {
          const zoneData = getZoneData(zoneId);
          const fillColor = zoneData?.color || 'rgba(100, 116, 139, 0.3)';
          const isCritical = zoneData?.densityLevel === 'CRITICAL';

          return (
            <g key={zoneId}>
              <path
                d={shape.path}
                fill={fillColor}
                fillOpacity={0.6}
                className={`stadium-zone ${isCritical ? 'critical' : ''}`}
                onMouseMove={(e) => handleMouseMove(e, zoneId)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onZoneClick?.(zoneId)}
              />
              <text
                x={shape.labelPos.x}
                y={shape.labelPos.y - 4}
                className="stadium-zone-label"
                style={{ fontSize: zoneId.startsWith('gate') || zoneId.startsWith('emergency') || zoneId === 'vip-west' || zoneId === 'medical' ? 8 : 9 }}
              >
                {SHORT_NAMES[zoneId] || zoneId}
              </text>
              {zoneData && zoneData.currentOccupancy > 0 && (
                <text
                  x={shape.labelPos.x}
                  y={shape.labelPos.y + 10}
                  className="stadium-zone-value"
                  style={{ fontSize: 9 }}
                >
                  {zoneData.occupancyPercent}%
                </text>
              )}
            </g>
          );
        })}

        {/* Route path overlay */}
        {routePath && routePath.length > 1 && (
          <polyline
            className="route-path"
            points={routePath.map(p => `${p.x},${p.y}`).join(' ')}
            filter="url(#glow)"
          />
        )}

        {/* Stadium label */}
        <text x="400" y="300" textAnchor="middle" fill="rgba(255,255,255,0.3)"
          fontSize="12" fontFamily="var(--font-primary)" fontWeight="600">
          ⚽ FIELD
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredZone && (
        <div
          className="zone-tooltip"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="zone-tooltip-title">
            <span style={{
              display: 'inline-block', width: 8, height: 8,
              borderRadius: 'var(--radius-sm)', background: hoveredZone.color,
              marginRight: 6,
            }} />
            {hoveredZone.zoneName}
          </div>
          <div className="zone-tooltip-stat">
            Density: <span style={{ color: hoveredZone.color }}>{hoveredZone.densityLevel}</span>
          </div>
          <div className="zone-tooltip-stat">
            Occupancy: <span>{hoveredZone.currentOccupancy} / {hoveredZone.capacity}</span>
          </div>
          <div className="zone-tooltip-stat">
            Fill: <span>{hoveredZone.occupancyPercent}%</span>
          </div>
          <div className="zone-tooltip-stat">
            Trend: <span>{hoveredZone.trend === 'rising' ? '📈 Rising' : hoveredZone.trend === 'falling' ? '📉 Falling' : '➡️ Stable'}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div className="density-bar">
              <div className="density-bar-fill"
                style={{ width: `${hoveredZone.occupancyPercent}%`, background: hoveredZone.color }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--density-low)' }} />
          Low (&lt;30%)
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--density-medium)' }} />
          Medium (30-60%)
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--density-high)' }} />
          High (60-85%)
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--density-critical)' }} />
          Critical (&gt;85%)
        </div>
      </div>
    </div>
  );
}
