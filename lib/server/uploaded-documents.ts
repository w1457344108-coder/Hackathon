import { createRequire } from "node:module";

type PdfParseResult = {
  text?: string;
};

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

type MammothModule = {
  extractRawText(input: { buffer: Buffer }): Promise<{ value?: string }>;
};

export interface UploadedDocumentSummary {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  characterCount: number;
  excerpt: string;
}

export interface UploadedDocumentContext {
  files: UploadedDocumentSummary[];
  combinedText: string;
}

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as PdfParseFn;
const mammoth = require("mammoth") as MammothModule;

export const MAX_UPLOAD_FILES = 3;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_EXCERPT_CHARS_PER_FILE = 4000;
const MAX_COMBINED_CONTEXT_CHARS = 12000;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function getReadableSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function isPdfFile(file: File) {
  return getExtension(file.name) === "pdf" || file.type === "application/pdf";
}

function isDocxFile(file: File) {
  return (
    getExtension(file.name) === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export function validateUploadedFileSet(files: File[]) {
  if (files.length > MAX_UPLOAD_FILES) {
    throw new Error(`Upload at most ${MAX_UPLOAD_FILES} files at once.`);
  }

  files.forEach((file) => {
    const extension = getExtension(file.name);

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`${file.name} is larger than the 20MB upload limit.`);
    }

    if (extension === "doc") {
      throw new Error(`${file.name} is an old Word DOC file. Please upload a DOCX file.`);
    }

    if (!isPdfFile(file) && !isDocxFile(file)) {
      throw new Error(`${file.name} is not supported. Upload PDF or DOCX files.`);
    }
  });
}

async function parsePdfFile(file: File) {
  const parsed = await pdfParse(Buffer.from(await file.arrayBuffer()));
  return collapseWhitespace(parsed.text ?? "");
}

async function parseDocxFile(file: File) {
  const parsed = await mammoth.extractRawText({
    buffer: Buffer.from(await file.arrayBuffer())
  });
  return collapseWhitespace(parsed.value ?? "");
}

async function parseUploadedFile(file: File) {
  if (isPdfFile(file)) {
    return parsePdfFile(file);
  }

  if (isDocxFile(file)) {
    return parseDocxFile(file);
  }

  throw new Error(`${file.name} is not supported. Upload PDF or DOCX files.`);
}

export async function parseUploadedDocuments(files: File[]): Promise<UploadedDocumentContext> {
  validateUploadedFileSet(files);

  const summaries = await Promise.all(
    files.map(async (file) => {
      const text = await parseUploadedFile(file);

      if (!text) {
        throw new Error(`${file.name} did not contain readable text.`);
      }

      return {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        characterCount: text.length,
        excerpt: text.slice(0, MAX_EXCERPT_CHARS_PER_FILE)
      } satisfies UploadedDocumentSummary;
    })
  );

  return {
    files: summaries,
    combinedText: summaries
      .map(
        (summary) =>
          `File: ${summary.fileName}\nSize: ${getReadableSize(summary.sizeBytes)}\nExcerpt:\n${summary.excerpt}`
      )
      .join("\n\n")
      .slice(0, MAX_COMBINED_CONTEXT_CHARS)
  };
}

export function buildUploadedDocumentQuery(
  userQuery: string,
  uploadedDocumentContext: UploadedDocumentContext | null
) {
  if (!uploadedDocumentContext || uploadedDocumentContext.files.length === 0) {
    return userQuery;
  }

  return [
    userQuery,
    "",
    "Uploaded document context used:",
    ...uploadedDocumentContext.files.map(
      (file) =>
        `Attached file: ${file.fileName} (${getReadableSize(file.sizeBytes)}, ${file.characterCount} characters)`
    ),
    "",
    uploadedDocumentContext.combinedText,
    "",
    "When answering, use the uploaded document context together with the Pillar 6/7 evidence workflow. If uploaded text conflicts with official legal evidence, explain the conflict and cite the stronger authority."
  ].join("\n");
}
