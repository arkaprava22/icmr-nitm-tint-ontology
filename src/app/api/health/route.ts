import { NextResponse } from "next/server";
import { ontologyStoreStatus } from "@/lib/rdf-store";
import { workflowStoreStatus } from "@/lib/dev-workflow-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [ontology, workflow] = await Promise.all([ontologyStoreStatus(), Promise.resolve(workflowStoreStatus())]);
  return NextResponse.json({
    status: ontology.status === "available" && workflow.status === "available" ? "ok" : "degraded",
    service: "tint-web",
    workflow,
    ontology,
  });
}
