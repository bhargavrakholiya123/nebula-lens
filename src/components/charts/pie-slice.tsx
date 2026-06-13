'use client';

import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { PieChartContext } from './pie-chart';

interface PieSliceProps {
  index: number;
  hoverEffect?: 'translate' | 'none';
  hoverOffset?: number;
}

function getArcPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const toRadians = (angle: number) => (angle - 90) * Math.PI / 180;

  // If there's only one slice (full circle)
  if (endAngle - startAngle >= 359.9) {
    return [
      `M ${centerX} ${centerY - outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${centerX - 0.01} ${centerY - outerRadius}`,
      `Z`,
      `M ${centerX} ${centerY - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${centerX - 0.01} ${centerY - innerRadius}`,
      `Z`
    ].join(' ');
  }

  const sRad = toRadians(startAngle);
  const eRad = toRadians(endAngle);

  const x1_out = centerX + outerRadius * Math.cos(sRad);
  const y1_out = centerY + outerRadius * Math.sin(sRad);
  const x2_out = centerX + outerRadius * Math.cos(eRad);
  const y2_out = centerY + outerRadius * Math.sin(eRad);

  const x1_in = centerX + innerRadius * Math.cos(sRad);
  const y1_in = centerY + innerRadius * Math.sin(sRad);
  const x2_in = centerX + innerRadius * Math.cos(eRad);
  const y2_in = centerY + innerRadius * Math.sin(eRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${x1_out} ${y1_out}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out}`,
    `L ${x2_in} ${y2_in}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1_in} ${y1_in}`,
    'Z'
  ].join(' ');
}

export function PieSlice({ index, hoverEffect = 'translate', hoverOffset = 6 }: PieSliceProps) {
  const context = useContext(PieChartContext);

  if (!context) {
    throw new Error('PieSlice must be used within a PieChart component');
  }

  const { slices, innerRadius, outerRadius, cornerRadius, hoveredIndex, onHoverChange } = context;
  const slice = slices[index];

  if (!slice) return null;

  // Calculate coordinates for the arc path
  const path = getArcPath(0, 0, innerRadius, outerRadius, slice.startAngle, slice.endAngle);

  // Compute translation direction (bisecting angle of the slice)
  const middleAngleRad = ((slice.middleAngle - 90) * Math.PI) / 180;
  const isHovered = hoveredIndex === index;
  const dx = isHovered && hoverEffect === 'translate' ? hoverOffset * Math.cos(middleAngleRad) : 0;
  const dy = isHovered && hoverEffect === 'translate' ? hoverOffset * Math.sin(middleAngleRad) : 0;

  return (
    <motion.path
      d={path}
      fill={slice.color}
      stroke={cornerRadius > 0 ? slice.color : 'none'}
      strokeWidth={cornerRadius > 0 ? cornerRadius / 2 : 0}
      strokeLinejoin="round"
      className="cursor-pointer outline-none select-none transition-shadow"
      animate={{
        x: dx,
        y: dy,
        filter: isHovered ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))' : 'drop-shadow(0px 0px 0px rgba(0,0,0,0))',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
    />
  );
}

PieSlice.displayName = 'PieSlice';
