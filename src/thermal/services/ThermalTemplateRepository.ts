import { v4 as uuidv4 } from 'uuid';
import { ThermalTemplate } from '../types/thermal.types';

const ITEM_KEY  = 'thermal_designer_template';   // single active template
const INDEX_KEY = 'thermal_designer_index';       // list of saved template ids
const PREFIX    = 'thermal_designer_tpl_';        // per-template key prefix

// ─── Active-template persistence (auto-save / auto-load) ─────────────────────

export function saveActiveTemplate(template: ThermalTemplate): void {
  try {
    localStorage.setItem(ITEM_KEY, JSON.stringify(template));
  } catch {
    // storage full — silently skip
  }
}

export function loadActiveTemplate(): ThermalTemplate | null {
  try {
    const raw = localStorage.getItem(ITEM_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as ThermalTemplate;
    if (t.type !== 'THERMAL') return null;
    return t;
  } catch {
    return null;
  }
}

// ─── Named template library ───────────────────────────────────────────────────

function readIndex(): string[] {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]'); }
  catch { return []; }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function readTemplate(id: string): ThermalTemplate | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as ThermalTemplate) : null;
  } catch { return null; }
}

function writeTemplate(t: ThermalTemplate): void {
  localStorage.setItem(`${PREFIX}${t.id}`, JSON.stringify(t));
}

export const thermalTemplateRepository = {
  save(template: ThermalTemplate): void {
    const now = new Date().toISOString();
    const toSave: ThermalTemplate = { ...template, updatedAt: now };
    writeTemplate(toSave);
    const index = readIndex();
    if (!index.includes(toSave.id)) writeIndex([...index, toSave.id]);
    // also persist as active
    saveActiveTemplate(toSave);
  },

  list(): ThermalTemplate[] {
    return readIndex()
      .map(readTemplate)
      .filter((t): t is ThermalTemplate => t !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  delete(id: string): void {
    localStorage.removeItem(`${PREFIX}${id}`);
    writeIndex(readIndex().filter((i) => i !== id));
  },

  duplicate(id: string): ThermalTemplate {
    const src = readTemplate(id);
    if (!src) throw new Error(`Template ${id} not found`);
    const now = new Date().toISOString();
    const copy: ThermalTemplate = { ...src, id: uuidv4(), name: `${src.name} (Copy)`, createdAt: now, updatedAt: now };
    writeTemplate(copy);
    writeIndex([...readIndex(), copy.id]);
    return copy;
  },
};
