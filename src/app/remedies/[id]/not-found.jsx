import { SearchX } from "lucide-react";
import Link from "next/link";
export default function RemedyNotFound() {
    return (<main className="not-found-page">
      <SearchX size={34} aria-hidden="true"/>
      <h1>Knowledge record not found</h1>
      <p>The requested remedy is unavailable or is not permitted in this environment.</p>
      <Link href="/">Return to search</Link>
    </main>);
}
