import { runMultiAgentWorkflow } from "@/lib/agents";
import { createWorkflowRun } from "@/lib/server/run-store";
import { parseUploadedDocuments, UploadedDocumentContext } from "@/lib/server/uploaded-documents";
import { SupportedCountry, StreamEventName, WorkflowResult } from "@/lib/types";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function createEvent(event: StreamEventName, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function parseBody(body: unknown): {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario?: string;
  userQuery?: string;
  uploadedDocumentContext?: UploadedDocumentContext | null;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body.");
  }

  const input = body as {
    countryA?: SupportedCountry;
    countryB?: SupportedCountry | null;
    businessScenario?: string;
    userQuery?: string;
  };

  if (!input.countryA) {
    throw new Error("countryA is required.");
  }

  return {
    countryA: input.countryA,
    countryB: input.countryB ?? null,
    businessScenario: input.businessScenario,
    userQuery: input.userQuery,
    uploadedDocumentContext: null
  };
}

function parseCountry(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? (value.trim() as SupportedCountry) : null;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function parseRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return parseBody(await request.json());
  }

  const formData = await request.formData();
  const countryA = parseCountry(formData.get("countryA"));

  if (!countryA) {
    throw new Error("countryA is required.");
  }

  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);

  return {
    countryA,
    countryB: parseCountry(formData.get("countryB")),
    businessScenario: parseOptionalString(formData.get("businessScenario")),
    userQuery: parseOptionalString(formData.get("userQuery")),
    uploadedDocumentContext: files.length ? await parseUploadedDocuments(files) : null
  };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEventName, data: unknown) => {
        controller.enqueue(encoder.encode(createEvent(event, data)));
      };

      try {
        const body = await parseRequestBody(request);

        send("workflow", {
          status: "running",
          message: "Multi-agent workflow initiated."
        });

        const result = await runMultiAgentWorkflow(body.countryA, body.countryB, {
          businessScenario: body.businessScenario,
          userQuery: body.userQuery,
          uploadedDocumentContext: body.uploadedDocumentContext
        });
        const persistedRun = await createWorkflowRun(result);
        const persistedResult: WorkflowResult = {
          ...result,
          analysisRunId: persistedRun.runId
        };

        send("research", persistedResult.research);
        send("policy", persistedResult.policyAnalysis);

        if (persistedResult.comparison) {
          send("comparison", persistedResult.comparison);
        }

        send("report", persistedResult.report);
        send("done", persistedResult);
      } catch (error) {
        send("error", {
          message:
            error instanceof Error ? error.message : "Unexpected error while running analysis."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
