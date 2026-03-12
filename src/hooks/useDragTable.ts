import { useRef, useCallback } from 'react';
import type { Point } from '../layout/types';

interface DragState {
  active: boolean;
  tableIndex: number;
  offsetX: number;
  offsetY: number;
}

export function useDragTable(
  onDrag: (tableIndex: number, position: Point) => void,
  getNodePosition: (tableIndex: number) => Point,
) {
  const dragRef = useRef<DragState>({
    active: false,
    tableIndex: -1,
    offsetX: 0,
    offsetY: 0,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent, tableIndex: number) => {
    e.stopPropagation();
    const pos = getNodePosition(tableIndex);
    const svgEl = (e.target as SVGElement).closest('svg');
    if (!svgEl) return;

    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    dragRef.current = {
      active: true,
      tableIndex,
      offsetX: svgPt.x - pos.x,
      offsetY: svgPt.y - pos.y,
    };
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, [getNodePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;

    const svgEl = (e.target as SVGElement).closest('svg');
    if (!svgEl) return;

    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    onDrag(dragRef.current.tableIndex, {
      x: svgPt.x - dragRef.current.offsetX,
      y: svgPt.y - dragRef.current.offsetY,
    });
  }, [onDrag]);

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}
