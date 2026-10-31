import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requirePractitioner } from "@/lib/practitioner-auth";
import { ContributionForm } from "./contribution-form";
export default async function NewContributionPage() {
    const practitioner = await requirePractitioner();
    return (<main className="portal-page">
      <header className="portal-topbar"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div className="portal-identity"><div><strong>{practitioner.displayName}</strong><span>Practitioner portal</span></div></div></header>
      <div className="editor-shell">
        <Link className="back-link" href="/practitioner"><ArrowLeft size={16}/>Dashboard</Link>
        <div className="editor-heading"><div><p className="eyebrow">Structured submission</p><h1>New knowledge contribution</h1><p>Record one focused claim with its preparation, safety context, and evidence.</p></div><aside><ShieldCheck size={20}/><span>This draft will not appear in public search before independent review.</span></aside></div>
        <ContributionForm />
      </div>
    </main>);
}
