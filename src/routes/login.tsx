import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/vvs/brand";
import { ThemeToggle } from "@/components/vvs/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Owner sign in — VVS Flow" }, { name: "description", content: "Secure owner access for the Ekström VVS operations workspace." }, { property: "og:title", content: "Owner sign in — VVS Flow" }, { property: "og:description", content: "Ekström VVS operations workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message);
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) navigate({ to: "/dashboard" });
      else setNotice("Check your inbox to confirm your email, then sign in.");
    }
  }

  return <div className="relative grid min-h-screen lg:grid-cols-[.9fr_1.1fr]"><div className="absolute right-5 top-5 z-10"><ThemeToggle/></div>
    <aside className="hidden bg-owner p-12 text-owner-foreground lg:flex lg:flex-col lg:justify-between"><Brand inverted/><div><p className="max-w-lg text-4xl font-bold leading-tight">Every inquiry gets an outcome.</p><p className="mt-4 max-w-md text-owner-foreground/60">A focused operating system for Ekström VVS — built around today's work, not vanity analytics.</p></div><p className="text-sm text-owner-foreground/50">Västerås · Sweden</p></aside>
    <main className="grid place-items-center px-5 py-12"><Card className="w-full max-w-md rounded-md p-7 shadow-none"><div className="lg:hidden"><Brand/></div><div className="mt-8 lg:mt-0"><span className="grid size-11 place-items-center rounded-md bg-muted text-primary"><LockKeyhole/></span><h1 className="mt-5 text-3xl font-bold">{mode === "signin" ? "Welcome back, Mats." : "Create owner account"}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to the Ekström VVS workspace." : "The first account activated becomes the workspace owner."}</p></div>
      <form onSubmit={submit} className="mt-8 space-y-4"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 h-12"/></div><div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-12"/></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">{notice}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight/></Button></form>
      <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }} className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline">{mode === "signin" ? "First time? Create the owner account" : "Already have an account? Sign in"}</button>
    </Card></main></div>;
}
