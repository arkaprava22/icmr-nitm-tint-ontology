import { BadgeCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentPractitioner } from "@/lib/practitioner-auth";
import { LoginForm } from "./login-form";
export default async function PractitionerLoginPage() {
    if (await currentPractitioner())
        redirect("/practitioner");
    return (<main className="auth-page">
      <section className="auth-intro"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div><p className="system-label">Practitioner portal</p><h1>Contribute trusted traditional-medicine knowledge</h1><ul><li><BadgeCheck size={19}/>Credential-aware contributor identity</li><li><ShieldCheck size={19}/>Independent review before publication</li></ul></div></section>
      <section className="auth-panel"><div><p className="eyebrow">Secure access</p><h2>Practitioner sign in</h2><p>Use your verified practitioner account.</p><LoginForm /><Link className="back-link" href="/">Return to public search</Link></div></section>
    </main>);
}
