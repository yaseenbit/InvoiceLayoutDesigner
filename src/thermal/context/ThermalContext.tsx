import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ThermalTemplate,
  ThermalElement,
  ThermalPageSettings,
  ThermalPaperMm,
} from '../types/thermal.types';
import { createThermalElement, duplicateThermalElement } from '../utils/thermalElementFactory';

// ─── Default template ─────────────────────────────────────────────────────────

function createDefaultThermalTemplate(): ThermalTemplate {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: 'Receipt Template',
    type: 'THERMAL',
    version: 1,
    page: {
      widthMm: 80,
      heightMm: 160,
      autoHeight: true,
      dpi: 203,
      defaultFontFamily: 'monospace',
      defaultFontSizePt: 9,
      gridSizeMm: 2,
      snapToGrid: true,
      showGrid: true,
      showRulers: true,
    },
    elements: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ─── History ──────────────────────────────────────────────────────────────────

const MAX_HISTORY = 60;

interface HistoryState {
  past: ThermalTemplate[];
  present: ThermalTemplate;
  future: ThermalTemplate[];
}

function pushHistory(state: HistoryState, next: ThermalTemplate): HistoryState {
  const past = [...state.past, state.present].slice(-MAX_HISTORY);
  return { past, present: next, future: [] };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_TEMPLATE'; payload: ThermalTemplate }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'UPDATE_PAGE_SETTINGS'; payload: Partial<ThermalPageSettings> }
  | { type: 'ADD_ELEMENT'; payload: ThermalElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; changes: Partial<ThermalElement> } }
  | { type: 'DELETE_ELEMENTS'; payload: string[] }
  | { type: 'MOVE_ELEMENTS'; payload: { ids: string[]; dxMm: number; dyMm: number } }
  | { type: 'DUPLICATE_ELEMENT'; payload: string }
  | { type: 'BRING_FORWARD'; payload: string }
  | { type: 'SEND_BACKWARD'; payload: string }
  | { type: 'BRING_TO_FRONT'; payload: string }
  | { type: 'SEND_TO_BACK'; payload: string };

// ─── UI State ─────────────────────────────────────────────────────────────────

interface UiState {
  selectedIds: string[];
  zoom: number;
  previewMode: boolean;
  clipboard: ThermalElement | null;
}

const DEFAULT_UI: UiState = {
  selectedIds: [],
  zoom: 1,
  previewMode: false,
  clipboard: null,
};

type UiAction =
  | { type: 'SELECT'; payload: string[] }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_CLIPBOARD'; payload: ThermalElement | null };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function thermalReducer(state: HistoryState, action: Action): HistoryState {
  const { present } = state;
  const now = new Date().toISOString();

  const update = (newTemplate: Partial<ThermalTemplate>): ThermalTemplate => ({
    ...present,
    ...newTemplate,
    updatedAt: now,
  });

  switch (action.type) {
    case 'UNDO':
      if (!state.past.length) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future].slice(0, MAX_HISTORY),
      };

    case 'REDO':
      if (!state.future.length) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: state.future[0],
        future: state.future.slice(1),
      };

    case 'LOAD_TEMPLATE':
      return pushHistory(state, action.payload);

    case 'SET_TEMPLATE_NAME':
      return pushHistory(state, update({ name: action.payload }));

    case 'UPDATE_PAGE_SETTINGS':
      return pushHistory(state, update({ page: { ...present.page, ...action.payload } }));

    case 'ADD_ELEMENT':
      return pushHistory(state, update({ elements: [...present.elements, action.payload] }));

    case 'UPDATE_ELEMENT':
      return pushHistory(state, update({
        elements: present.elements.map((el) =>
          el.id === action.payload.id ? { ...el, ...action.payload.changes } as ThermalElement : el,
        ),
      }));

    case 'DELETE_ELEMENTS':
      return pushHistory(state, update({
        elements: present.elements.filter((el) => !action.payload.includes(el.id)),
      }));

    case 'MOVE_ELEMENTS':
      return pushHistory(state, update({
        elements: present.elements.map((el) =>
          action.payload.ids.includes(el.id)
            ? { ...el, xMm: Math.max(0, el.xMm + action.payload.dxMm), yMm: Math.max(0, el.yMm + action.payload.dyMm) }
            : el,
        ),
      }));

    case 'DUPLICATE_ELEMENT': {
      const src = present.elements.find((el) => el.id === action.payload);
      if (!src) return state;
      const dup = duplicateThermalElement(src, present.elements);
      return pushHistory(state, update({ elements: [...present.elements, dup] }));
    }

    case 'BRING_FORWARD': {
      const el = present.elements.find((e) => e.id === action.payload);
      if (!el) return state;
      const above = present.elements.filter((e) => e.zIndex > el.zIndex);
      if (!above.length) return state;
      const minAbove = Math.min(...above.map((e) => e.zIndex));
      return pushHistory(state, update({
        elements: present.elements.map((e) => {
          if (e.id === action.payload) return { ...e, zIndex: minAbove };
          if (e.zIndex === minAbove) return { ...e, zIndex: el.zIndex };
          return e;
        }),
      }));
    }

    case 'SEND_BACKWARD': {
      const el = present.elements.find((e) => e.id === action.payload);
      if (!el) return state;
      const below = present.elements.filter((e) => e.zIndex < el.zIndex);
      if (!below.length) return state;
      const maxBelow = Math.max(...below.map((e) => e.zIndex));
      return pushHistory(state, update({
        elements: present.elements.map((e) => {
          if (e.id === action.payload) return { ...e, zIndex: maxBelow };
          if (e.zIndex === maxBelow) return { ...e, zIndex: el.zIndex };
          return e;
        }),
      }));
    }

    case 'BRING_TO_FRONT': {
      const max = Math.max(...present.elements.map((e) => e.zIndex));
      return pushHistory(state, update({
        elements: present.elements.map((e) =>
          e.id === action.payload ? { ...e, zIndex: max + 1 } : e,
        ),
      }));
    }

    case 'SEND_TO_BACK': {
      const min = Math.min(...present.elements.map((e) => e.zIndex));
      return pushHistory(state, update({
        elements: present.elements.map((e) =>
          e.id === action.payload ? { ...e, zIndex: min - 1 } : e,
        ),
      }));
    }

    default:
      return state;
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SELECT':        return { ...state, selectedIds: action.payload };
    case 'TOGGLE_PREVIEW': return { ...state, previewMode: !state.previewMode, selectedIds: [] };
    case 'SET_ZOOM':      return { ...state, zoom: action.payload };
    case 'SET_CLIPBOARD': return { ...state, clipboard: action.payload };
    default:              return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThermalContextValue {
  template: ThermalTemplate;
  canUndo: boolean;
  canRedo: boolean;
  selectedIds: string[];
  selectedElements: ThermalElement[];
  zoom: number;
  previewMode: boolean;
  clipboard: ThermalElement | null;

  // Template actions
  undo(): void;
  redo(): void;
  loadTemplate(t: ThermalTemplate): void;
  setTemplateName(name: string): void;
  updatePageSettings(changes: Partial<ThermalPageSettings>): void;

  // Element actions
  addElement(el: ThermalElement): void;
  updateElement(id: string, changes: Partial<ThermalElement>): void;
  deleteElements(ids: string[]): void;
  moveElements(ids: string[], dxMm: number, dyMm: number): void;
  duplicateElement(id: string): void;
  bringForward(id: string): void;
  sendBackward(id: string): void;
  bringToFront(id: string): void;
  sendToBack(id: string): void;

  // UI actions
  selectElements(ids: string[]): void;
  togglePreview(): void;
  setZoom(z: number): void;
  setClipboard(el: ThermalElement | null): void;
  dropElement(type: Parameters<typeof createThermalElement>[0], xMm: number, yMm: number): void;
}

const ThermalContext = createContext<ThermalContextValue | null>(null);

export function ThermalProvider({ children }: { children: ReactNode }) {
  const [histState, dispatch] = useReducer(thermalReducer, {
    past: [],
    present: createDefaultThermalTemplate(),
    future: [],
  });
  const [ui, uiDispatch] = useReducer(uiReducer, DEFAULT_UI);

  const template = histState.present;

  const selectedElements = useMemo(
    () => template.elements.filter((el) => ui.selectedIds.includes(el.id)),
    [template.elements, ui.selectedIds],
  );

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const loadTemplate = useCallback((t: ThermalTemplate) => dispatch({ type: 'LOAD_TEMPLATE', payload: t }), []);
  const setTemplateName = useCallback((name: string) => dispatch({ type: 'SET_TEMPLATE_NAME', payload: name }), []);
  const updatePageSettings = useCallback((changes: Partial<ThermalPageSettings>) => dispatch({ type: 'UPDATE_PAGE_SETTINGS', payload: changes }), []);
  const addElement = useCallback((el: ThermalElement) => dispatch({ type: 'ADD_ELEMENT', payload: el }), []);
  const updateElement = useCallback((id: string, changes: Partial<ThermalElement>) => dispatch({ type: 'UPDATE_ELEMENT', payload: { id, changes } }), []);
  const deleteElements = useCallback((ids: string[]) => dispatch({ type: 'DELETE_ELEMENTS', payload: ids }), []);
  const moveElements = useCallback((ids: string[], dxMm: number, dyMm: number) => dispatch({ type: 'MOVE_ELEMENTS', payload: { ids, dxMm, dyMm } }), []);
  const duplicateElement = useCallback((id: string) => dispatch({ type: 'DUPLICATE_ELEMENT', payload: id }), []);
  const bringForward = useCallback((id: string) => dispatch({ type: 'BRING_FORWARD', payload: id }), []);
  const sendBackward = useCallback((id: string) => dispatch({ type: 'SEND_BACKWARD', payload: id }), []);
  const bringToFront = useCallback((id: string) => dispatch({ type: 'BRING_TO_FRONT', payload: id }), []);
  const sendToBack = useCallback((id: string) => dispatch({ type: 'SEND_TO_BACK', payload: id }), []);

  const selectElements = useCallback((ids: string[]) => uiDispatch({ type: 'SELECT', payload: ids }), []);
  const togglePreview = useCallback(() => uiDispatch({ type: 'TOGGLE_PREVIEW' }), []);
  const setZoom = useCallback((z: number) => uiDispatch({ type: 'SET_ZOOM', payload: z }), []);
  const setClipboard = useCallback((el: ThermalElement | null) => uiDispatch({ type: 'SET_CLIPBOARD', payload: el }), []);

  const dropElement = useCallback((
    type: Parameters<typeof createThermalElement>[0],
    xMm: number,
    yMm: number,
  ) => {
    const el = createThermalElement(type, xMm, yMm, template.elements, template.page);
    dispatch({ type: 'ADD_ELEMENT', payload: el });
    uiDispatch({ type: 'SELECT', payload: [el.id] });
  }, [template.elements, template.page]);

  const value = useMemo<ThermalContextValue>(() => ({
    template,
    canUndo: histState.past.length > 0,
    canRedo: histState.future.length > 0,
    selectedIds: ui.selectedIds,
    selectedElements,
    zoom: ui.zoom,
    previewMode: ui.previewMode,
    clipboard: ui.clipboard,
    undo, redo, loadTemplate, setTemplateName, updatePageSettings,
    addElement, updateElement, deleteElements, moveElements, duplicateElement,
    bringForward, sendBackward, bringToFront, sendToBack,
    selectElements, togglePreview, setZoom, setClipboard, dropElement,
  }), [
    template, histState.past.length, histState.future.length,
    ui.selectedIds, ui.zoom, ui.previewMode, ui.clipboard,
    selectedElements,
    undo, redo, loadTemplate, setTemplateName, updatePageSettings,
    addElement, updateElement, deleteElements, moveElements, duplicateElement,
    bringForward, sendBackward, bringToFront, sendToBack,
    selectElements, togglePreview, setZoom, setClipboard, dropElement,
  ]);

  return <ThermalContext.Provider value={value}>{children}</ThermalContext.Provider>;
}

export function useThermal(): ThermalContextValue {
  const ctx = useContext(ThermalContext);
  if (!ctx) throw new Error('useThermal must be used inside <ThermalProvider>');
  return ctx;
}
