/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ComparisonSliderProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  className
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setPosition(percent);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };
    const onEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleMove]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden select-none rounded-[32px] border border-white/10 bg-plum-900 shadow-2xl",
        isDragging ? "cursor-grabbing" : "cursor-ew-resize",
        className
      )}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* After Image (Background / High Quality) */}
      <img 
        src={after} 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        referrerPolicy="no-referrer"
      />
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-30">
        <div className="px-3 py-1 bg-orange-500 text-[8px] font-semibold text-white uppercase tracking-[0.2em] rounded-lg shadow-lg animate-pulse">
          Neural Enhanced
        </div>
        <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-2xl text-[10px] uppercase tracking-[0.3em] font-semibold text-white/60 border border-white/10 shadow-lg">
          {afterLabel}
        </div>
      </div>

      {/* Before Image (Foreground / Lower Quality / Clipped) */}
      <div 
        className="absolute inset-y-0 left-0 overflow-hidden z-10 border-r border-white/30"
        style={{ width: `${position}%` }}
      >
        {/* The inner div must have the same width as the outer container to prevent scaling */}
        <div 
          className="absolute inset-y-0 left-0" 
          style={{ width: containerWidth }}
        >
          <img 
            src={before} 
            alt="Before" 
            className="w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute bottom-6 left-6 px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-2xl text-[10px] uppercase tracking-[0.3em] font-semibold text-white/60 border border-white/10 shadow-lg whitespace-nowrap">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 z-20 pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center border border-black/10">
          <div className="flex gap-[-2px] text-black">
            <ChevronLeft size={14} strokeWidth={4} />
            <ChevronRight size={14} strokeWidth={4} />
          </div>
        </div>
      </div>
    </div>
  );
};
