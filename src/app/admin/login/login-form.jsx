"use client";
import { useActionState } from "react";
import { KeyRound, LogIn, Mail } from "lucide-react";
import { adminLoginAction } from "../actions";
export function AdminLoginForm() {
    const [state, action, pending] = useActionState(adminLoginAction, { message: "" });
    return <form className="login-form" action={action}><label htmlFor="admin-email">Email address</label><div className="field-with-icon"><Mail size={18}/><input id="admin-email" name="email" type="email" autoComplete="username" required/></div><label htmlFor="admin-password">Password</label><div className="field-with-icon"><KeyRound size={18}/><input id="admin-password" name="password" type="password" autoComplete="current-password" required/></div>{state.message && <p className="form-error" role="alert">{state.message}</p>}<button type="submit" disabled={pending}><LogIn size={18}/>{pending ? "Signing in…" : "Sign in"}</button></form>;
}
