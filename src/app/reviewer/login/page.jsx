import { ClipboardCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentReviewer } from "@/lib/reviewer-auth";
import { ReviewerLoginForm } from "./login-form";
export default async function ReviewerLoginPage() {
    if (await currentReviewer())
        redirect("/reviewer");
    return <main className="auth-page"><section className="auth-intro reviewer-intro"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div><p className="system-label">Editorial review</p><h1>Assess knowledge before it reaches the public</h1><ul><li><ClipboardCheck size={19}/>Structured safety and evidence checks</li><li><ShieldCheck size={19}/>Independent, auditable decisions</li></ul></div></section><section className="auth-panel"><div><p className="eyebrow">Restricted access</p><h2>Reviewer sign in</h2><p>Use your verified editorial account.</p><ReviewerLoginForm /><Link className="back-link" href="/">Return to public search</Link></div></section></main>;
}
