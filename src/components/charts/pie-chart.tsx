'use client';

import React, { createContext, useMemo } from 'react';

export interface PieSliceData {
  label: string;
  value: number;
  color: string;
  startAngle: number;
  endAngle: number;
  middleAngle: number;
}

interface PieChartContextType {
  slices: PieSliceData[];
  innerRadius: number;
  outerRadius: number;
  cornerRadius: number;
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
  totalValue: number;
}

export const PieChartContext = createContext<PieChartContextType | null>(null);

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  innerRadius?: number;
  outerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
  children: React.ReactNode;
}

export function PieChart({
  data,
  innerRadius = 48,
  outerRadius = 68,
  padAngle = 0.03,
  cornerRadius = 4,
  hoveredIndex,
  onHoverChange,
  children,
}: PieChartProps) {
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const slices = useMemo(() => {
    if (totalValue === 0) return [];

    const padAngleDegrees = data.length > 1 ? (padAngle * 180) / Math.PI : 0;
    let cumulativeAngle = 0;

    return data.map((item) => {
      const percentage = item.value / totalValue;
      const sliceAngle = percentage * 360;

      const startAngle = cumulativeAngle + padAngleDegrees / 2;
      const endAngle = cumulativeAngle + sliceAngle - padAngleDegrees / 2;
      const middleAngle = cumulativeAngle + sliceAngle / 2;

      cumulativeAngle += sliceAngle;

      return {
        label: item.label,
        value: item.value,
        color: item.color,
        startAngle,
        endAngle,
        middleAngle,
      };
    });
  }, [data, totalValue, padAngle]);

  const contextValue = useMemo<PieChartContextType>(() => {
    return {
      slices,
      innerRadius,
      outerRadius,
      cornerRadius,
      hoveredIndex,
      onHoverChange,
      totalValue,
    };
  }, [slices, innerRadius, outerRadius, cornerRadius, hoveredIndex, onHoverChange, totalValue]);

  // Separate SVG components (like PieSlice) from HTML overlay components (like PieCenter)
  const { svgChildren, htmlChildren } = useMemo(() => {
    const svg: React.ReactNode[] = [];
    const html: React.ReactNode[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;

      // Check if it's PieCenter (or has class-like identification)
      const childType = child.type as any;
      if (childType?.displayName === 'PieCenter' || childType?.name === 'PieCenter') {
        html.push(child);
      } else {
        svg.push(child);
      }
    });

    return { svgChildren: svg, htmlChildren: html };
  }, [children]);

  return (
    <PieChartContext.Provider value={contextValue}>
      <div className="relative w-full h-full flex items-center justify-center">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="-80 -80 160 160"
          style={{ transform: 'rotate(0deg)' }}
        >
          {svgChildren}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {htmlChildren}
        </div>
      </div>
    </PieChartContext.Provider>
  );
}
