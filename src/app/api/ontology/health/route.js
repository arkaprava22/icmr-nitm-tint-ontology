import { ontologyStoreStatus } from "@/lib/rdf-store";
export const dynamic = "force-dynamic";
export async function GET() {
    const result = await ontologyStoreStatus();
    return Response.json(result, { status: result.status === "available" ? 200 : 503 });
}
