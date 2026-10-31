import { AlertTriangle, HeartHandshake, Languages, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/lib/config";
import { FeedbackForm } from "./feedback-form";

export default function FeedbackPage() {
  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/" aria-label={`${appConfig.name} home`}>
          <span className="brand-mark">T</span><span>{appConfig.name}</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Search</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/trust">Trust</Link>
          <Link className="language-button" href="/feedback" title="Language support planned">
            <Languages size={18} aria-hidden="true" /><span>English</span>
          </Link>
        </nav>
      </header>

      <section className="feedback-hero" aria-labelledby="feedback-heading">
        <div>
          <p className="system-label">Citizen feedback</p>
          <h1 id="feedback-heading">Help improve traditional medicine knowledge</h1>
          <p>Flag safety concerns, unclear wording, missing context, or local knowledge that should be reviewed by the governance team.</p>
        </div>
        <span className="store-health store-available"><HeartHandshake size={18} />Governance intake</span>
      </section>

      <section className="feedback-layout">
        <aside className="feedback-boundary">
          <ShieldCheck size={24} />
          <h2>What happens next</h2>
          <p>Feedback is triaged before it influences any public knowledge record. Safety concerns are separated for priority review.</p>
          <div><AlertTriangle size={19} /><span>Do not use this form for emergencies or personal treatment decisions.</span></div>
        </aside>
        <FeedbackForm />
      </section>
    </main>
  );
}
