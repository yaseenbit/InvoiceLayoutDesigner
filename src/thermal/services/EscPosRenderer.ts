/**
 * EscPosRenderer
 * ──────────────
 * Converts a ThermalTemplate + receipt data into raw ESC/POS bytes.
 *
 * The output Uint8Array can be sent directly to a thermal printer via:
 *   • Web Serial API   → sendViaWebSerial()
 *   • WebUSB           → sendViaWebUsb()
 *   • Download as .bin → downloadEscPosFile()
 *
 * Layout strategy:
 *   - Elements are sorted by yMm and rendered top-to-bottom.
 *   - Elements at the same y-coordinate (within SAME_LINE_THRESHOLD_MM)
 *     are merged into one line using left/right column splitting.
 *   - Vertical gaps between elements are translated to ESC d (feed lines).
 *
 * Tested against: Epson TM-T20III, EPSON TM-T88VI, Bixolon SRP-350,
 *                 Xprinter XP-N160I, TVS RP-3220 Star.
 */

import {
  ThermalTemplate,
  ThermalElement,
  ThermalItemsTableElement,
  ThermalTotalsElement,
  ThermalBarcodeElement,
  ThermalQrElement,
  ThermalTextElement,
  ThermalFieldElement,
  ThermalLineElement,
  ThermalSpacerElement,
  ThermalElementStyle,
} from '../types/thermal.types';
import { ThermalReceiptData } from '../types/receipt-data.types';
import { ThermalResolvedData } from '../types/receipt-data.types';
import { resolveThermalData } from './ThermalDataResolver';

// ─── ESC/POS constants ────────────────────────────────────────────────────────

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;
const HT  = 0x09; // horizontal tab (unused but defined)
const NUL = 0x00;
const FS  = 0x1c;

// Printer commands as byte arrays
const CMD = {
  INIT:             [ESC, 0x40],
  LF:               [LF],
  FEED_1:           [ESC, 0x64, 1],

  ALIGN_LEFT:       [ESC, 0x61, 0],
  ALIGN_CENTER:     [ESC, 0x61, 1],
  ALIGN_RIGHT:      [ESC, 0x61, 2],

  BOLD_ON:          [ESC, 0x45, 1],
  BOLD_OFF:         [ESC, 0x45, 0],

  UNDERLINE_OFF:    [ESC, 0x2d, 0],
  UNDERLINE_ON:     [ESC, 0x2d, 1],
  UNDERLINE_2:      [ESC, 0x2d, 2],  // 2-dot underline

  ITALIC_ON:        [ESC, 0x34, 1],  // not all printers support this
  ITALIC_OFF:       [ESC, 0x34, 0],

  FONT_A:           [ESC, 0x4d, 0],  // larger (12×24)
  FONT_B:           [ESC, 0x4d, 1],  // smaller (9×17)

  SIZE_NORMAL:      [GS,  0x21, 0x00],  // 1×1
  SIZE_DH:          [GS,  0x21, 0x01],  // 1×2 (double height)
  SIZE_DW:          [GS,  0x21, 0x10],  // 2×1 (double width)
  SIZE_DWH:         [GS,  0x21, 0x11],  // 2×2 (double width+height)

  RESET_MODES:      [ESC, 0x21, 0x00],  // ESC ! — reset all print modes

  LINE_SPACING_DEF: [ESC, 0x32],        // default (1/6 inch = ~4.23mm)
  LINE_SPACING_MED: [ESC, 0x33, 0x28], // n/180 inch = 40/180 = 5.6mm

  CUT_PARTIAL:      [GS,  0x56, 0x42, 0x00],
  CUT_FULL:         [GS,  0x56, 0x41],

  BARCODE_HEIGHT:   [GS,  0x68, 60],   // barcode height in dots (default 162)
  BARCODE_WIDTH:    [GS,  0x77, 2],    // barcode module width 2 (1–6)
  BARCODE_HRI_NONE: [GS,  0x48, 0],   // HRI chars: none
  BARCODE_HRI_BEL:  [GS,  0x48, 1],   // HRI below barcode
  BARCODE_HRI_AB:   [GS,  0x48, 3],   // HRI above+below
} as const;

// ─── ESC/POS builder ──────────────────────────────────────────────────────────

class EscPosBuilder {
  private bytes: number[] = [];

  push(...cmds: (number | readonly number[])[]) {
    for (const c of cmds) {
      if (Array.isArray(c)) this.bytes.push(...(c as number[]));
      else if (typeof c === 'number') this.bytes.push(c);
      else this.bytes.push(...Array.from(c as readonly number[]));
    }
    return this;
  }

  text(s: string) {
    this.bytes.push(...encodeText(s));
    return this;
  }

  lf(n = 1) {
    for (let i = 0; i < n; i++) this.bytes.push(LF);
    return this;
  }

  feed(n: number) {
    if (n <= 0) return this;
    if (n === 1) { this.push(CMD.LF); return this; }
    this.push([ESC, 0x64, Math.min(n, 255)]);
    return this;
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

// ─── Text encoding (CP437 / latin-1) ─────────────────────────────────────────

const CHAR_MAP: Record<string, number> = {
  '₹': 0x52,  // Rupee → R
  '€': 0x80,  // Euro (CP1252 position)
  '£': 0xa3,
  '¥': 0xa5,
  '©': 0xa9,
  '®': 0xae,
  '°': 0xf8,  // degree sign (CP437)
  '½': 0xab,
  '¼': 0xac,
  '‘': 0x27, '’': 0x27,  // ' '
  '“': 0x22, '”': 0x22,  // " "
  '–': 0x2d, '—': 0x2d,  // – —
  ' ': 0x20,  // NBSP
  '…': 0x2e,  // …
  'à': 0xe0, 'á': 0xe1,  // à á
  'è': 0xe8, 'é': 0xe9,  // è é
  'ì': 0xec, 'í': 0xed,  // ì í
  'ò': 0xf2, 'ó': 0xf3,  // ò ó
  'ù': 0xf9, 'ú': 0xfa,  // ù ú
};

function encodeText(s: string): number[] {
  return Array.from(s).map((ch) => {
    const code = ch.charCodeAt(0);
    if (code < 0x80) return code;  // ASCII passthrough
    if (CHAR_MAP[ch] !== undefined) return CHAR_MAP[ch];
    if (code < 0x100) return code; // latin-1 direct
    return 0x3f;                   // '?' for everything else
  });
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

/** Characters per line for a given paper width */
function charsPerLine(widthMm: number): number {
  // Empirically: 80mm = 48 chars (Font A), scale linearly
  return Math.floor((widthMm / 80) * 48);
}

/** Approximate mm → feed-line count (default line spacing ≈ 4.23mm) */
const LINE_MM = 4.23;
function mmToLines(mm: number): number {
  return Math.max(0, Math.round(mm / LINE_MM));
}

/** Pad/truncate a string to exactly `width` chars */
function col(s: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string {
  const safe = s.replace(/\r?\n/g, ' ').substring(0, width * 2); // allow UTF glyphs
  // truncate to fit
  let out = '';
  let len = 0;
  for (const ch of safe) {
    const w = ch.charCodeAt(0) > 0x7f ? 2 : 1; // CJK-like = 2 cols
    if (len + w > width) break;
    out += ch; len += w;
  }
  const pad = width - len;
  if (align === 'right')  return ' '.repeat(pad) + out;
  if (align === 'center') return ' '.repeat(Math.floor(pad / 2)) + out + ' '.repeat(Math.ceil(pad / 2));
  return out + ' '.repeat(pad);
}

/** Split lineWidth into integer column widths from widthRatio[], last col absorbs rounding */
function splitColumns(ratios: number[], lineWidth: number): number[] {
  const widths = ratios.map((r) => Math.floor(r * lineWidth));
  const remainder = lineWidth - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += remainder;
  return widths;
}

function dashedLine(lineWidth: number, ch = '-'): string {
  return ch.repeat(lineWidth);
}

// ─── Font size → ESC/POS mode ─────────────────────────────────────────────────

interface FontMode {
  sizeCmd: readonly number[];
  fontCmd: readonly number[];
  widthMultiplier: number;  // 1 = normal, 2 = double-width
  heightMultiplier: number; // 1 = normal, 2 = double-height
}

function fontMode(fontSizePt: number): FontMode {
  if (fontSizePt <= 8) {
    return { sizeCmd: CMD.SIZE_NORMAL, fontCmd: CMD.FONT_B, widthMultiplier: 1, heightMultiplier: 1 };
  } else if (fontSizePt <= 11) {
    return { sizeCmd: CMD.SIZE_NORMAL, fontCmd: CMD.FONT_A, widthMultiplier: 1, heightMultiplier: 1 };
  } else if (fontSizePt <= 14) {
    return { sizeCmd: CMD.SIZE_DH, fontCmd: CMD.FONT_A, widthMultiplier: 1, heightMultiplier: 2 };
  } else {
    return { sizeCmd: CMD.SIZE_DWH, fontCmd: CMD.FONT_A, widthMultiplier: 2, heightMultiplier: 2 };
  }
}

/** Effective chars-per-line accounting for font magnification */
function effectiveCols(lineWidth: number, fm: FontMode): number {
  return Math.floor(lineWidth / fm.widthMultiplier);
}

// ─── Per-element renderers ────────────────────────────────────────────────────

function applyStyle(b: EscPosBuilder, style: ThermalElementStyle) {
  const fm = fontMode(style.fontSizePt ?? 9);
  b.push(fm.fontCmd, fm.sizeCmd);
  b.push(style.bold      ? CMD.BOLD_ON       : CMD.BOLD_OFF);
  b.push(style.underline ? CMD.UNDERLINE_ON  : CMD.UNDERLINE_OFF);

  const alignMap = { left: CMD.ALIGN_LEFT, center: CMD.ALIGN_CENTER, right: CMD.ALIGN_RIGHT };
  b.push(alignMap[style.textAlign ?? 'left'] ?? CMD.ALIGN_LEFT);
}

function resetStyle(b: EscPosBuilder) {
  b.push(CMD.BOLD_OFF, CMD.UNDERLINE_OFF, CMD.SIZE_NORMAL, CMD.FONT_A, CMD.ALIGN_LEFT, CMD.RESET_MODES);
}

function renderText(b: EscPosBuilder, el: ThermalTextElement, lineWidth: number) {
  applyStyle(b, el.style);
  b.text(el.content).lf();
  resetStyle(b);
}

function renderField(b: EscPosBuilder, el: ThermalFieldElement, resolved: ThermalResolvedData, lineWidth: number) {
  const val = resolved[el.binding] ?? el.fallback ?? el.binding;
  applyStyle(b, el.style);
  b.text(val).lf();
  resetStyle(b);
}

function renderLine(b: EscPosBuilder, el: ThermalLineElement, lineWidth: number) {
  const ch = el.dashed ? '-' : '─'; // box-drawing line or hyphen
  b.push(CMD.ALIGN_LEFT).text(dashedLine(lineWidth, '-')).lf();
}

function renderItemsTable(
  b: EscPosBuilder,
  el: ThermalItemsTableElement,
  items: ThermalReceiptData['items'],
  lineWidth: number,
) {
  const fm = fontMode(el.rowFontSizePt);
  const eCols = effectiveCols(lineWidth, fm);
  const colWidths = splitColumns(el.columns.map((c) => c.widthRatio), eCols);

  // Header
  if (el.headerVisible) {
    const hfm = fontMode(el.headerFontSizePt);
    b.push(hfm.fontCmd, hfm.sizeCmd, CMD.BOLD_ON, CMD.ALIGN_LEFT);
    const hCols = effectiveCols(lineWidth, hfm);
    const hWidths = splitColumns(el.columns.map((c) => c.widthRatio), hCols);
    const headerLine = el.columns.map((c, i) => col(c.title, hWidths[i], c.align)).join('');
    b.text(headerLine).lf();
    b.push(CMD.BOLD_OFF, CMD.SIZE_NORMAL, CMD.FONT_A);
    b.text(dashedLine(lineWidth, '-')).lf();
  }

  // Data rows
  b.push(fm.fontCmd, fm.sizeCmd, CMD.ALIGN_LEFT);
  items.forEach((item, rowIdx) => {
    const map = item as unknown as Record<string, unknown>;
    const rowLine = el.columns.map((c, i) => {
      const val = map[c.binding];
      const display = typeof val === 'number'
        ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(val ?? '');
      return col(display, colWidths[i], c.align);
    }).join('');
    b.text(rowLine).lf();

    if (el.separatorBetweenRows && rowIdx < items.length - 1) {
      b.text(dashedLine(eCols, '-')).lf();
    }
  });

  resetStyle(b);
}

function renderTotals(
  b: EscPosBuilder,
  el: ThermalTotalsElement,
  resolved: ThermalResolvedData,
  lineWidth: number,
) {
  const fm = fontMode(el.fontSizePt);
  const eCols = effectiveCols(lineWidth, fm);
  const labelW = Math.floor((el.labelWidthPercent / 100) * eCols);
  const valueW = eCols - labelW;

  el.rows.filter((r) => r.visible).forEach((row) => {
    const val = resolved[row.binding] ?? '—';

    if (row.separator) {
      b.push(CMD.SIZE_NORMAL, CMD.FONT_A).text(dashedLine(lineWidth, '-')).lf();
    }

    b.push(fm.fontCmd, fm.sizeCmd);
    if (row.bold) b.push(CMD.BOLD_ON);

    const line = col(row.label, labelW, 'left') + col(val, valueW, 'right');
    b.text(line).lf();

    if (row.bold) b.push(CMD.BOLD_OFF);
  });

  resetStyle(b);
}

function renderBarcode(
  b: EscPosBuilder,
  el: ThermalBarcodeElement,
  resolved: ThermalResolvedData,
) {
  const val = resolved[el.binding] ?? el.value ?? '';
  if (!val) return;

  b.push(CMD.ALIGN_CENTER);
  b.push(CMD.BARCODE_HEIGHT);   // set height
  b.push(CMD.BARCODE_WIDTH);    // set module width
  b.push(el.showText ? CMD.BARCODE_HRI_BEL : CMD.BARCODE_HRI_NONE);

  switch (el.format) {
    case 'EAN13': {
      // GS k m n d1..dn  (function B)
      const data = encodeText(val.substring(0, 12));
      b.push([GS, 0x6b, 67, data.length, ...data]); // m=67=EAN13
      break;
    }
    case 'CODE128':
    default: {
      // CODE128 with charset B: prefix {B
      const prefix = [0x7b, 0x42]; // {B
      const data = encodeText(val);
      const len = prefix.length + data.length;
      b.push([GS, 0x6b, 73, len, ...prefix, ...data]); // m=73=CODE128
      break;
    }
  }
  b.lf();
  b.push(CMD.ALIGN_LEFT);
}

function renderQrCode(
  b: EscPosBuilder,
  el: ThermalQrElement,
  resolved: ThermalResolvedData,
) {
  const val = resolved[el.binding] ?? (el as { value?: string }).value ?? '';
  if (!val) return;

  const data = encodeText(val);
  const dataLen = data.length + 3; // 3 = cn fn m overhead
  const pL = dataLen & 0xff;
  const pH = (dataLen >> 8) & 0xff;

  b.push(CMD.ALIGN_CENTER);

  // 1. Set model 2
  b.push([GS, 0x28, 0x6b, 4, 0, 49, 65, 50, 0]);
  // 2. Set dot size (3 = medium)
  b.push([GS, 0x28, 0x6b, 3, 0, 49, 67, 3]);
  // 3. Error correction level M
  b.push([GS, 0x28, 0x6b, 3, 0, 49, 69, 49]);
  // 4. Store data
  b.push([GS, 0x28, 0x6b, pL, pH, 49, 80, 48, ...data]);
  // 5. Print
  b.push([GS, 0x28, 0x6b, 3, 0, 49, 81, 48]);

  b.lf();
  b.push(CMD.ALIGN_LEFT);
}

function renderSpacer(b: EscPosBuilder, el: ThermalSpacerElement) {
  const lines = mmToLines(el.heightMm);
  if (lines > 0) b.feed(lines);
}

// ─── Same-line merging ────────────────────────────────────────────────────────

/** Elements within this many mm are treated as "same horizontal line" */
const SAME_LINE_THRESHOLD_MM = 3;

type ElGroup = ThermalElement[]; // elements rendered on the same line

function groupByLine(elements: ThermalElement[]): ElGroup[] {
  const sorted = [...elements].sort((a, b) => a.yMm - b.yMm);
  const groups: ElGroup[] = [];

  for (const el of sorted) {
    const lastGroup = groups[groups.length - 1];
    const lastY = lastGroup?.[0]?.yMm ?? -Infinity;
    if (lastGroup && Math.abs(el.yMm - lastY) <= SAME_LINE_THRESHOLD_MM) {
      lastGroup.push(el);
    } else {
      groups.push([el]);
    }
  }

  return groups;
}

/** For a group of ≥2 same-line text/field elements, render as a single line
 *  using left (first) and right (last) alignment, or left/center/right split. */
function renderSameLineGroup(
  b: EscPosBuilder,
  group: ThermalElement[],
  resolved: ThermalResolvedData,
  lineWidth: number,
) {
  if (group.length === 1) return false; // single element — use normal render

  // Only merge simple text/field elements
  const mergeable = group.every((el) => el.type === 'text' || el.type === 'field');
  if (!mergeable) return false;

  // Sort left-to-right by xMm
  const sorted = [...group].sort((a, b) => a.xMm - b.xMm);

  if (sorted.length === 2) {
    const left  = sorted[0];
    const right = sorted[1];
    const lText = left.type  === 'text' ? (left  as ThermalTextElement).content  : resolved[(left  as ThermalFieldElement).binding] ?? '';
    const rText = right.type === 'text' ? (right as ThermalTextElement).content  : resolved[(right as ThermalFieldElement).binding] ?? '';
    const lfm   = fontMode(left.style.fontSizePt ?? 9);
    const rfm   = fontMode(right.style.fontSizePt ?? 9);
    // Use the smaller mode for the combined line
    const eCols = Math.floor(lineWidth / Math.max(lfm.widthMultiplier, rfm.widthMultiplier));
    const halfW = Math.floor(eCols / 2);
    const lw    = halfW;
    const rw    = eCols - halfW;

    // Apply the left element's font/bold
    b.push(lfm.fontCmd, lfm.sizeCmd);
    if (left.style.bold)  b.push(CMD.BOLD_ON);
    if (right.style.bold) {
      // left half normal, right half bold — ESC/POS can't mix per-char, approximate
      b.push(CMD.ALIGN_LEFT);
      b.text(col(lText, lw, 'left') + col(rText, rw, 'right')).lf();
    } else {
      b.push(CMD.ALIGN_LEFT);
      b.text(col(lText, lw, 'left') + col(rText, rw, 'right')).lf();
    }
    resetStyle(b);
    return true;
  }

  return false; // ≥3 on same line — fall back to sequential
}

// ─── Main render ──────────────────────────────────────────────────────────────

export interface EscPosOptions {
  /** Chars per line override (auto-detected from paper width if omitted) */
  lineWidth?: number;
  /** Feed lines after all content before cut */
  feedLinesAtEnd?: number;
  /** Paper cut command at end (default: true) */
  cutAtEnd?: boolean;
  /** Use partial cut (default) vs full cut */
  fullCut?: boolean;
  /** ESC/POS code page byte for international chars (default: 0 = CP437) */
  codePage?: number;
}

export function renderToEscPos(
  template: ThermalTemplate,
  data: ThermalReceiptData,
  opts: EscPosOptions = {},
): Uint8Array {
  const {
    feedLinesAtEnd = 5,
    cutAtEnd       = true,
    fullCut        = false,
    codePage       = 0,
  } = opts;

  const resolved  = resolveThermalData(data);
  const lineWidth = opts.lineWidth ?? charsPerLine(template.page.widthMm);
  const b         = new EscPosBuilder();

  // ── Init ──
  b.push(CMD.INIT);

  // Set code page
  if (codePage !== 0) {
    b.push([ESC, 0x74, codePage]); // ESC t n
  }

  // Default line spacing
  b.push(CMD.LINE_SPACING_DEF);

  // ── Render elements ──
  const visibleEls = template.elements.filter((el) => el.visible !== false);
  const groups = groupByLine(visibleEls);

  let prevGroupEndY = 0;

  for (const group of groups) {
    const groupY = group[0].yMm;
    const groupH = Math.max(...group.map((el) => el.heightMm));

    // Insert gap feed lines
    const gapMm = groupY - prevGroupEndY;
    const gapLines = mmToLines(Math.max(0, gapMm - LINE_MM)); // subtract 1 natural line
    if (gapLines > 0) b.feed(Math.min(gapLines, 10)); // cap to avoid huge gaps

    // Try same-line merge
    const merged = renderSameLineGroup(b, group, resolved, lineWidth);

    if (!merged) {
      for (const el of group) {
        if (el.locked === false && el.visible === false) continue;

        switch (el.type) {
          case 'text':
            renderText(b, el, lineWidth);
            break;
          case 'field':
            renderField(b, el, resolved, lineWidth);
            break;
          case 'line':
            renderLine(b, el, lineWidth);
            break;
          case 'image':
            // Image rasterisation requires canvas API — emit a placeholder text
            b.push(CMD.ALIGN_CENTER).text('[LOGO]').lf().push(CMD.ALIGN_LEFT);
            break;
          case 'thermalItemsTable':
            renderItemsTable(b, el, data.items, lineWidth);
            break;
          case 'thermalTotals':
            renderTotals(b, el, resolved, lineWidth);
            break;
          case 'barcode':
            renderBarcode(b, el, resolved);
            break;
          case 'qrCode':
            renderQrCode(b, el as ThermalQrElement, resolved);
            break;
          case 'spacer':
            renderSpacer(b, el);
            break;
        }
      }
    }

    prevGroupEndY = groupY + groupH;
  }

  // ── Footer ──
  if (feedLinesAtEnd > 0) b.feed(feedLinesAtEnd);
  if (cutAtEnd) b.push(fullCut ? CMD.CUT_FULL : CMD.CUT_PARTIAL);

  return b.toUint8Array();
}

// ─── Browser delivery helpers ─────────────────────────────────────────────────

export function downloadEscPosFile(
  template: ThermalTemplate,
  data: ThermalReceiptData,
  opts?: EscPosOptions,
): void {
  const bytes    = renderToEscPos(template, data, opts);
  const blob     = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `receipt_${data.receipt.number}.bin`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Send to a thermal printer via Web Serial API.
 * Requires Chrome/Edge ≥ 89 and a HTTPS/localhost context.
 *
 * Usage: await sendViaWebSerial(template, data)
 */
export async function sendViaWebSerial(
  template: ThermalTemplate,
  data: ThermalReceiptData,
  opts?: EscPosOptions & { baudRate?: number },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serial = (navigator as any).serial;
  if (!serial) throw new Error('Web Serial API not supported in this browser.');

  const bytes = renderToEscPos(template, data, opts);
  const port  = await serial.requestPort();
  await port.open({ baudRate: opts?.baudRate ?? 9600 });

  const writer = port.writable.getWriter();
  try {
    await writer.write(bytes);
  } finally {
    writer.releaseLock();
    await port.close();
  }
}

/**
 * Send to a thermal printer via WebUSB.
 * Requires Chrome/Edge ≥ 61 and a HTTPS/localhost context.
 *
 * Usage: await sendViaWebUsb(template, data)
 */
export async function sendViaWebUsb(
  template: ThermalTemplate,
  data: ThermalReceiptData,
  opts?: EscPosOptions & { endpointNumber?: number },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usb = (navigator as any).usb;
  if (!usb) throw new Error('WebUSB API not supported in this browser.');

  const bytes  = renderToEscPos(template, data, opts);
  const device = await usb.requestDevice({ filters: [] });

  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  await device.claimInterface(0);

  const endpoint = opts?.endpointNumber ?? 1;
  await device.transferOut(endpoint, bytes);
  await device.close();
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

/**
 * Returns a human-readable hex + ASCII dump of the ESC/POS bytes,
 * useful for debugging and verifying output before sending to printer.
 */
export function hexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  const KNOWN: Record<number, string> = {
    0x0a: 'LF',
    0x0d: 'CR',
    0x1b: 'ESC',
    0x1d: 'GS',
    0x1c: 'FS',
    0x00: 'NUL',
  };

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hex   = Array.from(chunk).map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(chunk).map((b) => {
      if (KNOWN[b]) return `[${KNOWN[b]}]`;
      return b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';
    }).join('');
    lines.push(`${i.toString(16).padStart(4, '0')}  ${hex.padEnd(47)}  ${ascii}`);
  }

  return lines.join('\n');
}
