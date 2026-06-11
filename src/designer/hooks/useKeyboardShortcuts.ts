import { useEffect } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { duplicateElement } from '../utils/elementFactory';
import { clampPosition } from '../utils/geometry';

export function useKeyboardShortcuts(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const {
    template,
    selectedIds,
    clipboard,
    previewMode,
    canUndo,
    canRedo,
    undo,
    redo,
    deleteElements,
    duplicateElements,
    moveElements,
    setClipboard,
    addElement,
    setSelectedIds,
  } = useDesigner();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewMode) return;

      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const isMeta = e.ctrlKey || e.metaKey;

      // Undo / Redo
      if (isMeta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); return; }
      if (isMeta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); if (canRedo) redo(); return; }

      if (isInput) return;

      // Escape
      if (e.key === 'Escape') { setSelectedIds([]); return; }

      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        deleteElements(selectedIds);
        return;
      }

      if (selectedIds.length === 0) return;

      // Copy
      if (isMeta && e.key === 'c') {
        e.preventDefault();
        const els = template.elements.filter((el) => selectedIds.includes(el.id) && !el.locked);
        setClipboard(els);
        return;
      }

      // Cut
      if (isMeta && e.key === 'x') {
        e.preventDefault();
        const els = template.elements.filter((el) => selectedIds.includes(el.id) && !el.locked);
        setClipboard(els);
        deleteElements(els.map((e) => e.id));
        return;
      }

      // Paste
      if (isMeta && e.key === 'v') {
        e.preventDefault();
        if (clipboard.length > 0) {
          const copies = clipboard.map((src) => duplicateElement(src, template.elements, 5));
          copies.forEach((c) => addElement(c));
          setSelectedIds(copies.map((c) => c.id));
        }
        return;
      }

      // Duplicate
      if (isMeta && e.key === 'd') {
        e.preventDefault();
        duplicateElements(selectedIds);
        return;
      }

      // Select all
      if (isMeta && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(template.elements.map((el) => el.id));
        return;
      }

      // Arrow key movement
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (!isArrow) return;
      e.preventDefault();

      let delta = 1;
      if (e.shiftKey) delta = 5;
      if (isMeta) delta = 0.25;

      const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
      const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;

      const moves = selectedIds.flatMap((id) => {
        const el = template.elements.find((e) => e.id === id);
        if (!el || el.locked) return [];
        const { xMm, yMm } = clampPosition(
          el.xMm + dx, el.yMm + dy,
          el.widthMm, el.heightMm,
          template.page.widthMm, template.page.heightMm,
        );
        return [{ id, xMm, yMm }];
      });

      if (moves.length > 0) moveElements(moves);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    previewMode, canUndo, canRedo, selectedIds, clipboard, template,
    undo, redo, deleteElements, duplicateElements, moveElements,
    setClipboard, addElement, setSelectedIds,
  ]);
}
