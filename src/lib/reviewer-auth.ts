import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findPractitionerBySession } from "@/lib/dev-workflow-store";
import { SESSION_COOKIE } from "@/lib/practitioner-auth";

export async function currentReviewer() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? findPractitionerBySession(token) : null;
  return user?.role === "REVIEWER" ? user : null;
}

export async function requireReviewer() {
  const reviewer = await currentReviewer();
  if (!reviewer || reviewer.verificationStatus !== "VERIFIED") redirect("/reviewer/login");
  return reviewer;
}
