import { AgentIntentType } from "@/lib/agent-schema";

export function createSSEStream(
  intentType: AgentIntentType,
  query: string,
  country: string
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send("status", { phase: "arbiter", message: "Intent Arbiter classifying query..." });

        const { classifyIntent } = await import("@/lib/agents/intent-arbiter");

        const intentResult = await classifyIntent(query, country);
        send("intent", intentResult);
        send("status", { phase: "reasoner", message: "Legal Reasoner performing $If-Then$ deduction..." });

        const { reasonWithStream } = await import("@/lib/agents/legal-reasoner");

        let streamedText = "";
        const result = await reasonWithStream(
          intentType,
          query,
          country,
          (chunk) => {
            streamedText += chunk;
            send("step", { text: chunk });
          }
        );

        send("result", result);
        send("done", { intent: intentResult, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        send("error", { message });
      } finally {
        controller.close();
      }
    }
  });
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
