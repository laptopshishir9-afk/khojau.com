import React from 'react';
import { useStore } from '../context/StoreContext.tsx';

interface NepalFlagProps {
  className?: string;
  width?: number;
  height?: number;
}

export const NepalFlag: React.FC<NepalFlagProps> = ({ className = 'w-5 h-6', width, height }) => {
  const { settings } = useStore();
  const customFlag = settings?.nepalFlagUrl;

  if (customFlag) {
    return (
      <img
        src={customFlag}
        alt="Nepal Flag"
        className={`${className} object-contain`}
        style={{ width, height }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 125"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      aria-label="Flag of Nepal"
    >
      {/* Outer Blue Border (Double Pennant) */}
      <polygon
        points="4,4 4,121 96,65 38,65 78,4"
        fill="#003893"
        stroke="#003893"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Inner Crimson Red Field */}
      <polygon
        points="9,10 9,114 88,65 35,65 71,10"
        fill="#DC2626"
      />

      {/* Upper Triangle: Crescent Moon & Rays */}
      <g fill="#FFFFFF">
        <path d="M22,38 C22,46 34,46 34,38 C34,43 25,43 25,38 Z" />
        <circle cx="28" cy="35" r="4.5" />
        <path d="M24,35 L28,29 L32,35 Z" />
        <path d="M28,32 L23,34 L26,38 L30,38 L33,34 Z" opacity="0.9" />
      </g>

      {/* Lower Triangle: 12-pointed Sun */}
      <g fill="#FFFFFF" transform="translate(32, 90)">
        <circle cx="0" cy="0" r="5" />
        {/* 12 Sun Rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
          <polygon
            key={i}
            points="-1.5,-6 0,-11 1.5,-6"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </svg>
  );
};
