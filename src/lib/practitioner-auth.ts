import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findPractitionerBySession } from "@/lib/dev-workflow-store";

export const SESSION_COOKIE = "tint_practitioner_session";

export async function currentPractitioner() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? findPractitionerBySession(token) : null;
}

export async function requirePractitioner() {
  const practitioner = await currentPractitioner();
  if (!practitioner || practitioner.role !== "PRACTITIONER" || practitioner.verificationStatus !== "VERIFIED") redirect("/practitioner/login");
  return practitioner;
}
