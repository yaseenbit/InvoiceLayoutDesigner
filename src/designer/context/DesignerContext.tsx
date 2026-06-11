import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  InvoiceTemplate,
  InvoiceElement,
  A4PageSettings,
  PAGE_WIDTH_MM,
  PAGE_HEIGHT_MM,
} from '../types/template.types';
import { duplicateElement } from '../utils/elementFactory';
import {
  bringForward as zBringForward,
  sendBackward as zSendBackward,
  bringToFront as zBringToFront,
  sendToBack as zSendToBack,
} from '../utils/zIndex';

// ─── Default Template ────────────────────────────────────────────────────────

export function createDefaultTemplate(): InvoiceTemplate {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: 'New Invoice Template',
    type: 'A4',
    version: 1,
    createdAt: now,
    updatedAt: now,
    page: {
      widthMm: PAGE_WIDTH_MM,
      heightMm: PAGE_HEIGHT_MM,
      marginTopMm: 10,
      marginRightMm: 10,
      marginBottomMm: 10,
      marginLeftMm: 10,
      defaultFontFamily: 'Inter, sans-serif',
      defaultFontSizePt: 10,
      gridSizeMm: 5,
      snapToGrid: true,
      showGrid: false,
      showRulers: true,
      showMarginGuides: true,
      multiPage: false,
      bodyStartMm: 10,
      bodyEndMm: 260,
    },
    elements: [],
  };
}

// ─── State ───────────────────────────────────────────────────────────────────

const MAX_HISTORY = 60;

interface DesignerState {
  past: InvoiceTemplate[];
  present: InvoiceTemplate;
  future: InvoiceTemplate[];
  selectedIds: string[];
  clipboard: InvoiceElement[];
  zoom: number;
  previewMode: boolean;
  isDirty: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type DesignerAction =
  | { type: 'ADD_ELEMENT'; element: InvoiceElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updater: (el: InvoiceElement) => InvoiceElement }
  | { type: 'DELETE_ELEMENTS'; ids: string[] }
  | { type: 'MOVE_ELEMENTS'; moves: Array<{ id: string; xMm: number; yMm: number }> }
  | { type: 'RESIZE_ELEMENT'; id: string; bounds: { xMm: number; yMm: number; widthMm: number; heightMm: number } }
  | { type: 'DUPLICATE_ELEMENTS'; ids: string[] }
  | { type: 'UPDATE_PAGE'; updates: Partial<A4PageSettings> }
  | { type: 'REORDER'; id: string; direction: 'forward' | 'backward' | 'front' | 'back' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SELECT'; ids: string[] }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PREVIEW'; value: boolean }
  | { type: 'SET_CLIPBOARD'; elements: InvoiceElement[] }
  | { type: 'SET_TEMPLATE'; template: InvoiceTemplate; resetHistory?: boolean }
  | { type: 'MARK_CLEAN' };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function pushHistory(state: DesignerState, next: InvoiceTemplate): DesignerState {
  const now = new Date().toISOString();
  const updated = { ...next, updatedAt: now };
  const past = [...state.past, state.present].slice(-MAX_HISTORY);
  return { ...state, past, present: updated, future: [], isDirty: true };
}

function reducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const elements = [...state.present.elements, action.element];
      return pushHistory(state, { ...state.present, elements });
    }

    case 'UPDATE_ELEMENT': {
      const elements = state.present.elements.map((el) =>
        el.id === action.id ? action.updater(el) : el,
      );
      return pushHistory(state, { ...state.present, elements });
    }

    case 'DELETE_ELEMENTS': {
      const ids = new Set(action.ids);
      const elements = state.present.elements.filter((el) => !ids.has(el.id));
      return {
        ...pushHistory(state, { ...state.present, elements }),
        selectedIds: state.selectedIds.filter((id) => !ids.has(id)),
      };
    }

    case 'MOVE_ELEMENTS': {
      const moveMap = new Map(action.moves.map((m) => [m.id, m]));
      const elements = state.present.elements.map((el) => {
        const move = moveMap.get(el.id);
        return move ? { ...el, xMm: move.xMm, yMm: move.yMm } : el;
      });
      return pushHistory(state, { ...state.present, elements });
    }

    case 'RESIZE_ELEMENT': {
      const { id, bounds } = action;
      const elements = state.present.elements.map((el) =>
        el.id === id ? { ...el, ...bounds } : el,
      );
      return pushHistory(state, { ...state.present, elements });
    }

    case 'DUPLICATE_ELEMENTS': {
      const ids = new Set(action.ids);
      const sources = state.present.elements.filter((el) => ids.has(el.id));
      const copies = sources.map((src) =>
        duplicateElement(src, state.present.elements, 5),
      );
      const elements = [...state.present.elements, ...copies];
      const newIds = copies.map((c) => c.id);
      return {
        ...pushHistory(state, { ...state.present, elements }),
        selectedIds: newIds,
      };
    }

    case 'UPDATE_PAGE': {
      const page = { ...state.present.page, ...action.updates };
      return pushHistory(state, { ...state.present, page });
    }

    case 'REORDER': {
      let elements: InvoiceElement[];
      switch (action.direction) {
        case 'forward':  elements = zBringForward(state.present.elements, action.id); break;
        case 'backward': elements = zSendBackward(state.present.elements, action.id); break;
        case 'front':    elements = zBringToFront(state.present.elements, action.id); break;
        case 'back':     elements = zSendToBack(state.present.elements, action.id); break;
      }
      return pushHistory(state, { ...state.present, elements });
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      const past = state.past.slice(0, -1);
      const future = [state.present, ...state.future];
      return { ...state, past, present: prev, future, isDirty: past.length > 0 };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const future = state.future.slice(1);
      const past = [...state.past, state.present].slice(-MAX_HISTORY);
      return { ...state, past, present: next, future, isDirty: true };
    }

    case 'SELECT':
      return { ...state, selectedIds: action.ids };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(3, action.zoom)) };

    case 'SET_PREVIEW':
      return { ...state, previewMode: action.value, selectedIds: action.value ? [] : state.selectedIds };

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.elements };

    case 'SET_TEMPLATE':
      return {
        ...state,
        present: action.template,
        past: action.resetHistory ? [] : state.past,
        future: action.resetHistory ? [] : state.future,
        selectedIds: [],
        isDirty: false,
      };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface DesignerContextValue {
  template: InvoiceTemplate;
  selectedIds: string[];
  clipboard: InvoiceElement[];
  zoom: number;
  previewMode: boolean;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Map from element id → DOM node for direct manipulation during drag */
  elementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;

  // Undoable mutations
  addElement: (el: InvoiceElement) => void;
  updateElement: (id: string, updater: (el: InvoiceElement) => InvoiceElement) => void;
  deleteElements: (ids: string[]) => void;
  moveElements: (moves: Array<{ id: string; xMm: number; yMm: number }>) => void;
  resizeElement: (id: string, bounds: { xMm: number; yMm: number; widthMm: number; heightMm: number }) => void;
  duplicateElements: (ids: string[]) => void;
  updatePageSettings: (updates: Partial<A4PageSettings>) => void;
  reorder: (id: string, direction: 'forward' | 'backward' | 'front' | 'back') => void;

  // UI-only mutations
  setSelectedIds: (ids: string[]) => void;
  setZoom: (zoom: number) => void;
  setPreviewMode: (value: boolean) => void;
  setClipboard: (elements: InvoiceElement[]) => void;
  undo: () => void;
  redo: () => void;
  setTemplate: (template: InvoiceTemplate, resetHistory?: boolean) => void;
  markClean: () => void;
  newTemplate: () => void;
}

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function DesignerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    past: [],
    present: createDefaultTemplate(),
    future: [],
    selectedIds: [],
    clipboard: [],
    zoom: 1,
    previewMode: false,
    isDirty: false,
  }));

  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const addElement      = useCallback((el: InvoiceElement) => dispatch({ type: 'ADD_ELEMENT', element: el }), []);
  const updateElement   = useCallback((id: string, updater: (el: InvoiceElement) => InvoiceElement) => dispatch({ type: 'UPDATE_ELEMENT', id, updater }), []);
  const deleteElements  = useCallback((ids: string[]) => dispatch({ type: 'DELETE_ELEMENTS', ids }), []);
  const moveElements    = useCallback((moves: Array<{ id: string; xMm: number; yMm: number }>) => dispatch({ type: 'MOVE_ELEMENTS', moves }), []);
  const resizeElement   = useCallback((id: string, bounds: { xMm: number; yMm: number; widthMm: number; heightMm: number }) => dispatch({ type: 'RESIZE_ELEMENT', id, bounds }), []);
  const duplicateElements = useCallback((ids: string[]) => dispatch({ type: 'DUPLICATE_ELEMENTS', ids }), []);
  const updatePageSettings = useCallback((updates: Partial<A4PageSettings>) => dispatch({ type: 'UPDATE_PAGE', updates }), []);
  const reorder         = useCallback((id: string, direction: 'forward' | 'backward' | 'front' | 'back') => dispatch({ type: 'REORDER', id, direction }), []);
  const setSelectedIds  = useCallback((ids: string[]) => dispatch({ type: 'SELECT', ids }), []);
  const setZoom         = useCallback((zoom: number) => dispatch({ type: 'SET_ZOOM', zoom }), []);
  const setPreviewMode  = useCallback((value: boolean) => dispatch({ type: 'SET_PREVIEW', value }), []);
  const setClipboard    = useCallback((elements: InvoiceElement[]) => dispatch({ type: 'SET_CLIPBOARD', elements }), []);
  const undo            = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo            = useCallback(() => dispatch({ type: 'REDO' }), []);
  const setTemplate     = useCallback((template: InvoiceTemplate, resetHistory?: boolean) => dispatch({ type: 'SET_TEMPLATE', template, resetHistory }), []);
  const markClean       = useCallback(() => dispatch({ type: 'MARK_CLEAN' }), []);
  const newTemplate     = useCallback(() => dispatch({ type: 'SET_TEMPLATE', template: createDefaultTemplate(), resetHistory: true }), []);

  const value = useMemo<DesignerContextValue>(() => ({
    template: state.present,
    selectedIds: state.selectedIds,
    clipboard: state.clipboard,
    zoom: state.zoom,
    previewMode: state.previewMode,
    isDirty: state.isDirty,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    elementRefs,
    addElement, updateElement, deleteElements, moveElements,
    resizeElement, duplicateElements, updatePageSettings, reorder,
    setSelectedIds, setZoom, setPreviewMode, setClipboard,
    undo, redo, setTemplate, markClean, newTemplate,
  }), [
    state.present, state.selectedIds, state.clipboard, state.zoom,
    state.previewMode, state.isDirty, state.past.length, state.future.length,
    addElement, updateElement, deleteElements, moveElements,
    resizeElement, duplicateElements, updatePageSettings, reorder,
    setSelectedIds, setZoom, setPreviewMode, setClipboard,
    undo, redo, setTemplate, markClean, newTemplate,
  ]);

  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>;
}

export function useDesigner(): DesignerContextValue {
  const ctx = useContext(DesignerContext);
  if (!ctx) throw new Error('useDesigner must be used inside DesignerProvider');
  return ctx;
}
