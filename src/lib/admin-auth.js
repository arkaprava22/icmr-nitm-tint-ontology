import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findPractitionerBySession } from "@/lib/dev-workflow-store";
import { SESSION_COOKIE } from "@/lib/practitioner-auth";
export async function currentAdministrator() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const user = token ? findPractitionerBySession(token) : null;
    return user?.role === "ADMINISTRATOR" ? user : null;
}
export async function requireAdministrator() {
    const administrator = await currentAdministrator();
    if (!administrator || administrator.verificationStatus !== "VERIFIED")
        redirect("/admin/login");
    return administrator;
}
