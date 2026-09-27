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
import { demoOwnerLogin } from "@/lib/owner.functions";
import loginAsset from "@/assets/vvs-figma-hero.jpg.asset.json";

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

  async function demoLogin() {
    setBusy(true); setError(""); setNotice("");
    try {
      const creds = await demoOwnerLogin();
      const { error } = await supabase.auth.signInWithPassword({ email: creds.email, password: creds.password });
      setBusy(false);
      if (error) return setError(error.message);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Demo login failed.");
    }
  }

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

  return <div className="relative flex min-h-screen bg-background"><div className="absolute right-5 top-5 z-20"><ThemeToggle/></div>
    <aside className="relative hidden w-[480px] shrink-0 overflow-hidden bg-owner p-10 text-owner-foreground lg:flex lg:flex-col"><img src={loginAsset.url} alt="" className="absolute inset-0 size-full object-cover opacity-70"/><div className="absolute inset-0 bg-gradient-to-b from-owner/75 via-owner/35 to-owner/60"/><div className="relative z-10"><Brand inverted/></div><div className="relative z-10 flex flex-1 items-center"><div><p className="max-w-sm font-display text-4xl font-light italic leading-tight">“Every inquiry gets an outcome.”</p><p className="mt-5 text-sm text-primary">Mats Ekström · Owner</p><div className="mt-8 space-y-3 text-sm text-owner-foreground/70"><p>✓ No request falls through the cracks</p><p>✓ AI-assisted — human approved</p><p>✓ ROT summaries ready when needed</p></div></div></div></aside>
    <main className="grid flex-1 place-items-center px-6 py-12"><Card className="w-full max-w-sm border-0 bg-transparent p-0 shadow-none"><div className="lg:hidden"><Brand/></div><div className="mt-8 lg:mt-0"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><LockKeyhole/></span><h1 className="mt-6 font-display text-4xl font-light">{mode === "signin" ? "Welcome back." : "Create account."}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to your VVS Flow dashboard." : "The first account becomes the owner."}</p></div>
      <form onSubmit={submit} className="mt-8 space-y-4"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 h-12"/></div><div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-12"/></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">{notice}</p>}
        <Button type="submit" variant="copper" className="w-full rounded-xl" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight/></Button></form>
      {/* DEV ONLY — remove before launch */}
      <div className="mt-6 rounded-xl border border-dashed border-warning/40 bg-warning/5 p-4">
        <p className="figma-label text-[10px] text-warning">Dev mode — demo access</p>
        <Button type="button" variant="outline" className="mt-3 w-full" size="lg" disabled={busy} onClick={demoLogin}>{busy ? "Please wait…" : "Enter dashboard instantly"}<ArrowRight/></Button>
      </div>
      <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }} className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline">{mode === "signin" ? "First time? Create the owner account" : "Already have an account? Sign in"}</button>
    </Card></main></div>;
}
