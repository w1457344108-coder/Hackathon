import { runMultiAgentWorkflow } from "@/lib/agents";
import { SupportedCountry, StreamEventName, WorkflowResult } from "@/lib/types";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function createEvent(event: StreamEventName, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function parseBody(body: unknown): {
  countryA: SupportedCountry;
  countryB?: SupportedCountry | null;
  businessScenario?: string;
  userQuery?: string;
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
    userQuery: input.userQuery
  };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const body = parseBody(await request.json());

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEventName, data: unknown) => {
        controller.enqueue(encoder.encode(createEvent(event, data)));
      };

      try {
        send("workflow", {
          status: "running",
          message: "Multi-agent workflow initiated."
        });

        const result: WorkflowResult = await runMultiAgentWorkflow(body.countryA, body.countryB, {
          businessScenario: body.businessScenario,
          userQuery: body.userQuery
        });

        send("research", result.research);
        send("policy", result.policyAnalysis);

        if (result.comparison) {
          send("comparison", result.comparison);
        }

        send("report", result.report);
        send("done", result);
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
