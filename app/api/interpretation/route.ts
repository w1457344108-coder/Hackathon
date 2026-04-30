import { NextRequest } from "next/server";
import { createSSEStream, sseResponse } from "@/lib/stream-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const country: string = body.country || "China";
  const query: string = body.query || body.intent || `Interpret legal provisions on cross-border data transfer under ${country} law`;

  const stream = createSSEStream("interpretation", query, country);
  return sseResponse(stream);
}
