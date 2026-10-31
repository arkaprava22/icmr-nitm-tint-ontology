import { getRemedyDetail, type SearchLanguage } from "@/lib/rdf-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const language: SearchLanguage = new URL(request.url).searchParams.get("lang") === "hi" ? "hi" : "en";
  try {
    const remedy = await getRemedyDetail(id, language);
    if (!remedy) return Response.json({ message: "Remedy not found." }, { status: 404 });
    return Response.json(remedy);
  } catch {
    return Response.json({ message: "Remedy not found." }, { status: 404 });
  }
}
