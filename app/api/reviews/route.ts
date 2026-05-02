import { applyReviewUpdateToWorkflowResult } from "@/lib/agents";
import { getWorkflowRun, saveWorkflowRun, updateWorkflowRun } from "@/lib/server/run-store";
import { EvidenceReviewStatus } from "@/lib/pillar6-schema";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isEvidenceReviewStatus(value: string): value is EvidenceReviewStatus {
  return (
    value === "Pending Review" ||
    value === "Approved" ||
    value === "Needs Revision" ||
    value === "Rejected"
  );
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ message: "runId is required." }, { status: 400 });
  }

  try {
    const storedRun = await getWorkflowRun(runId);
    return NextResponse.json({
      analysisRunId: storedRun.runId,
      evidenceRecords: storedRun.workflowResult.evidenceRecords,
      auditItems: storedRun.workflowResult.supportingAgentResults.auditCitation.data?.auditItems ?? []
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load stored review state."
      },
      { status: 404 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    runId?: string;
    evidenceId?: string;
    reviewStatus?: string;
    reviewerNote?: string;
  };

  if (!body.runId || !body.evidenceId || !body.reviewStatus) {
    return NextResponse.json(
      { message: "runId, evidenceId, and reviewStatus are required." },
      { status: 400 }
    );
  }

  if (!isEvidenceReviewStatus(body.reviewStatus)) {
    return NextResponse.json({ message: "Invalid reviewStatus." }, { status: 400 });
  }

  try {
    const updatedWorkflowResult = await updateWorkflowRun(body.runId, (workflowResult) =>
      applyReviewUpdateToWorkflowResult(workflowResult, {
        evidenceId: body.evidenceId as string,
        reviewStatus: body.reviewStatus as EvidenceReviewStatus,
        reviewerNote: body.reviewerNote ?? ""
      })
    );

    await saveWorkflowRun(updatedWorkflowResult);

    return NextResponse.json({
      analysisRunId: updatedWorkflowResult.analysisRunId,
      evidenceRecord: updatedWorkflowResult.evidenceRecords.find(
        (record) => record.evidenceId === body.evidenceId
      ),
      auditItem:
        updatedWorkflowResult.supportingAgentResults.auditCitation.data?.auditItems.find(
          (item) => item.evidenceId === body.evidenceId
        ) ?? null,
      exportPackage: updatedWorkflowResult.supportingAgentResults.legalReviewExport.data ?? null
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to persist review state."
      },
      { status: 500 }
    );
  }
}
