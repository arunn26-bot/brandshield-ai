import type { GuidelinePage } from "./extract";

interface TextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
}
interface PdfPage {
  getTextContent(): Promise<{ items: TextItem[] }>;
}
interface PdfDocument {
  numPages: number;
  getPage(page: number): Promise<PdfPage>;
}
interface PdfModule {
  getDocument(params: {
    data: Uint8Array;
    useSystemFonts?: boolean;
    isEvalSupported?: boolean;
    disableFontFace?: boolean;
  }): { promise: Promise<PdfDocument> };
}

/** Rebuilds visual lines from positioned PDF text items. */
function pageText(items: TextItem[]): string {
  let out = "";
  let lastY: number | null = null;
  for (const item of items) {
    if (!item.str) continue;
    const y = item.transform?.[5];
    if (out && y !== undefined && lastY !== null && Math.abs(y - lastY) > 2) out += "\n";
    else if (out && !out.endsWith("\n") && !out.endsWith(" ")) out += " ";
    out += item.str;
    if (item.hasEOL) out += "\n";
    if (y !== undefined) lastY = y;
  }
  return out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function readPdf(bytes: Uint8Array): Promise<GuidelinePage[]> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfModule;
  const doc = await pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  const pages: GuidelinePage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push({ page: i, text: pageText(content.items) });
  }
  return pages;
}

async function readDocx(bytes: Uint8Array): Promise<GuidelinePage[]> {
  const mammoth = (await import("mammoth")) as {
    extractRawText(input: { buffer: Buffer }): Promise<{ value: string }>;
  };
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return [{ page: 1, text: value.trim() }];
}

function readText(bytes: Uint8Array): GuidelinePage[] {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  // A form feed is how many tools mark a page break in plain text exports.
  return text
    .split(/\f/)
    .map((chunk, i) => ({ page: i + 1, text: chunk.trim() }))
    .filter((p) => p.text);
}

export async function readGuideline(fileName: string, bytes: Uint8Array): Promise<GuidelinePage[]> {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return readPdf(bytes);
  if (ext === "docx") return readDocx(bytes);
  if (ext === "txt" || ext === "md") return readText(bytes);
  throw new Error("Unsupported file. Upload a PDF, DOCX, TXT or MD file.");
}
