'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Storage key for persisting position */
  storageKey?: string;
  /** Initial position if no stored position exists */
  initialPosition?: Position;
  /** Boundary padding from screen edges */
  boundaryPadding?: number;
}

interface UseDraggableReturn {
  position: Position;
  isDragging: boolean;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  resetPosition: () => void;
}

/**
 * Hook to make an element draggable with position persistence
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const {
    storageKey,
    initialPosition = { x: 0, y: 0 },
    boundaryPadding = 10,
  } = options;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Load saved position on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosition(parsed);
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [storageKey]);

  // Save position when it changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined' && (position.x !== 0 || position.y !== 0)) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch {
        // Ignore storage errors
      }
    }
  }, [storageKey, position]);

  const constrainPosition = useCallback((x: number, y: number): Position => {
    if (typeof window === 'undefined') return { x, y };
    
    const maxX = window.innerWidth - boundaryPadding - 60; // 60px for element width
    const maxY = window.innerHeight - boundaryPadding - 60; // 60px for element height
    
    return {
      x: Math.max(-maxX + 100, Math.min(maxX - 100, x)),
      y: Math.max(-maxY + 100, Math.min(maxY - 100, y)),
    };
  }, [boundaryPadding]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const newPos = constrainPosition(
      dragStartRef.current.posX + deltaX,
      dragStartRef.current.posY + deltaY
    );
    
    setPosition(newPos);
  }, [constrainPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  }, [position]);

  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [initialPosition, storageKey]);

  return {
    position,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as const,
        touchAction: 'none' as const,
      },
    },
    resetPosition,
  };
}
