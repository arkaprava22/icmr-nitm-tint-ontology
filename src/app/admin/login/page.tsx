import { DatabaseZap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdministrator } from "@/lib/admin-auth";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await currentAdministrator()) redirect("/admin");
  return <main className="auth-page"><section className="auth-intro admin-intro"><Link className="brand" href="/"><span className="brand-mark">T</span><span>TINT</span></Link><div><p className="system-label">Publication control</p><h1>Release reviewed knowledge with confidence</h1><ul><li><ShieldCheck size={19} />Approved records only</li><li><DatabaseZap size={19} />Audited ontology publication</li></ul></div></section><section className="auth-panel"><div><p className="eyebrow">Privileged access</p><h2>Administrator sign in</h2><p>Use your authorized publication account.</p><AdminLoginForm /><Link className="back-link" href="/">Return to public search</Link></div></section></main>;
}
