import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  buildUploadedDocumentQuery,
  validateUploadedFileSet
} from "../lib/server/uploaded-documents.ts";

function makeFile(name: string, size: number, type = "application/pdf") {
  return {
    name,
    size,
    type,
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
  } as File;
}

test("upload validation allows at most three files of 20MB each", () => {
  assert.doesNotThrow(() =>
    validateUploadedFileSet([
      makeFile("one.pdf", MAX_UPLOAD_BYTES),
      makeFile("two.docx", MAX_UPLOAD_BYTES, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      makeFile("three.pdf", 1024)
    ])
  );

  assert.throws(
    () =>
      validateUploadedFileSet([
        makeFile("one.pdf", 1),
        makeFile("two.pdf", 1),
        makeFile("three.pdf", 1),
        makeFile("four.pdf", 1)
      ]),
    /at most 3 files/i
  );
});

test("upload validation rejects old Word and oversized files", () => {
  assert.throws(() => validateUploadedFileSet([makeFile("legacy.doc", 1024)]), /DOCX/i);
  assert.throws(
    () => validateUploadedFileSet([makeFile("huge.pdf", MAX_UPLOAD_BYTES + 1)]),
    /20MB/i
  );
});

test("uploaded document context is merged into the user query", () => {
  const mergedQuery = buildUploadedDocumentQuery("Analyze this transfer.", {
    files: [
      {
        fileName: "policy.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1200,
        characterCount: 67,
        excerpt: "Customer data may be transferred only after a security assessment."
      }
    ],
    combinedText: "Customer data may be transferred only after a security assessment."
  });

  assert.match(mergedQuery, /Analyze this transfer/);
  assert.match(mergedQuery, /Uploaded document context used/);
  assert.match(mergedQuery, /policy\.pdf/);
  assert.match(mergedQuery, /security assessment/);
});
