import { useState, useCallback, useRef } from 'react';
import type { Rect } from '../layout/types';

interface PanZoomState {
  panX: number;
  panY: number;
  zoom: number;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.0;
const ZOOM_SPEED = 0.001;

export function usePanZoom(initialBounds: Rect) {
  const [state, setState] = useState<PanZoomState>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });

  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const viewBox = `${initialBounds.x - state.panX / state.zoom} ${initialBounds.y - state.panY / state.zoom} ${initialBounds.width / state.zoom} ${initialBounds.height / state.zoom}`;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SPEED;
    setState(prev => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * (1 + delta))),
    }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only start panning from the background, not from table nodes
    if ((e.target as SVGElement).closest('[data-table-node]')) return;
    isPanningRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setState(prev => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const resetView = useCallback(() => {
    setState({ panX: 0, panY: 0, zoom: 1 });
  }, []);

  return {
    viewBox,
    zoom: state.zoom,
    handlers: {
      onWheel: handleWheel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    resetView,
  };
}
