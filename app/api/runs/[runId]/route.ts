import { getWorkflowRun } from "@/lib/server/run-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      runId: string;
    }>;
  }
) {
  const { runId } = await context.params;

  try {
    const storedRun = await getWorkflowRun(runId);
    return NextResponse.json(storedRun.workflowResult);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load analysis run."
      },
      { status: 404 }
    );
  }
}
