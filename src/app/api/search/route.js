import { normalizeSearchInput, searchKnowledge } from "@/lib/rdf-store";
export const dynamic = "force-dynamic";
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = normalizeSearchInput(searchParams.get("q") ?? "");
    const language = searchParams.get("lang") === "hi" ? "hi" : "en";
    if (query.length < 2) {
        return Response.json({ query, language, results: [], message: "Enter at least two characters." }, { status: 400 });
    }
    try {
        const results = await searchKnowledge(query, language);
        return Response.json({ query, language, results });
    }
    catch {
        return Response.json({ query, language, results: [], message: "Knowledge search is temporarily unavailable." }, { status: 503 });
    }
}
