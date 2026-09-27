import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LayoutDashboard, BriefcaseBusiness, CalendarDays, ListFilter, Users, FolderKanban, Inbox, ReceiptText, Settings, Menu, LogOut, ShieldAlert, PanelLeftClose, PanelLeftOpen, MoreHorizontal } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { PageSkeleton } from "./owner-ui";
import { supabase } from "@/integrations/supabase/client";
import { ownerService } from "@/lib/services";
import { initials, useAuthUser } from "@/lib/auth";
import { errMsg } from "./query-state";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/jobs", label: "Jobs", exact: false, icon: BriefcaseBusiness },
  { to: "/dashboard/calendar", label: "Calendar", exact: false, icon: CalendarDays },
  { to: "/dashboard/waitlist", label: "Waitlist", exact: false, icon: ListFilter },
  { to: "/dashboard/leads", label: "Leads", exact: false, icon: Users },
  { to: "/dashboard/projects", label: "Projects", exact: false, icon: FolderKanban },
  { to: "/dashboard/inbox", label: "Inbox", exact: false, icon: Inbox },
  { to: "/dashboard/rot", label: "ROT", exact: false, icon: ReceiptText },
  { to: "/dashboard/settings", label: "Settings", exact: false, icon: Settings },
] as const;

function NavItems({ mobile = false, collapsed = false }: { mobile?: boolean; collapsed?: boolean }) {
  return <nav className={mobile ? "space-y-1" : "flex-1 space-y-1 p-3"}>{items.map(({ to, label, icon: Icon, exact }) => <Link key={to} to={to} activeOptions={{ exact }} title={collapsed ? label : undefined} className={`relative flex min-h-11 items-center rounded-lg text-sm font-medium text-owner-foreground/45 transition-colors hover:bg-owner-foreground/6 hover:text-owner-foreground ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`} activeProps={{ className: "bg-primary/10 text-primary after:absolute after:right-0 after:h-5 after:w-0.5 after:rounded-l after:bg-primary" }}><Icon className="size-[18px] shrink-0"/>{!collapsed && <span>{label}</span>}</Link>)}</nav>;
}

function useSignOut() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return async () => { await supabase.auth.signOut(); qc.clear(); navigate({ to: "/login" }); };
}

function AccessGate({ claimable }: { claimable: boolean }) {
  const claim = useServerFn(ownerService.claim);
  const qc = useQueryClient();
  const signOut = useSignOut();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="grid min-h-screen place-items-center bg-background px-5"><Card className="w-full max-w-md rounded-md p-7 shadow-none"><Brand /><span className="mt-8 grid size-11 place-items-center rounded-md bg-warning/15 text-warning-foreground"><ShieldAlert/></span><h1 className="mt-5 text-2xl font-bold">{claimable ? "Activate owner access" : "No access to this workspace"}</h1><p className="mt-2 text-sm text-muted-foreground">{claimable ? "No owner has been set up yet. Activate this account as the Ekström VVS owner." : "This account is signed in but is not the workspace owner."}</p>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<div className="mt-6 grid gap-3">{claimable && <Button disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await claim(); await qc.invalidateQueries(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); } }}>{busy ? "Activating…" : "Activate owner access"}</Button>}<Button variant="outline" onClick={signOut}>Sign out</Button></div></Card></div>;
}

export function OwnerShell() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const current = items.find(i => i.to === pathname)?.label ?? "Dashboard";
  const user = useAuthUser();
  const getStatus = useServerFn(ownerService.status);
  const status = useQuery({ queryKey: ["owner-status"], queryFn: () => getStatus() });
  const signOut = useSignOut();
  const [collapsed, setCollapsed] = useState(false);
  if (status.isPending) return <div className="mx-auto max-w-5xl p-8"><PageSkeleton/></div>;
  if (status.isError) return <div className="grid min-h-screen place-items-center p-6 text-center"><div><p className="font-semibold">The workspace could not be opened.</p><p className="mt-2 text-sm text-muted-foreground">{errMsg(status.error)}</p><Button className="mt-4" onClick={() => status.refetch()}>Try again</Button></div></div>;
  if (!status.data.isOwner) return <AccessGate claimable={status.data.claimable} />;
  const email = user?.email ?? "";
  return <div className={`min-h-screen bg-background transition-[grid-template-columns] lg:grid ${collapsed ? "lg:grid-cols-[64px_minmax(0,1fr)]" : "lg:grid-cols-[240px_minmax(0,1fr)]"}`}>
    <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-primary/10 bg-owner transition-[width] lg:flex ${collapsed ? "w-16" : "w-60"}`}>
      <div className={`flex h-16 items-center border-b border-owner-foreground/10 ${collapsed ? "justify-center" : "justify-between px-3"}`}><Brand inverted compact={collapsed}/><Button size="icon" variant="ghost" className="text-owner-foreground/45 hover:bg-owner-foreground/10 hover:text-owner-foreground" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen/> : <PanelLeftClose/>}</Button></div><NavItems collapsed={collapsed}/>
      <div className="border-t border-owner-foreground/10 p-3"><Button onClick={signOut} variant="ghost" className={`w-full text-owner-foreground/50 hover:bg-owner-foreground/8 hover:text-owner-foreground ${collapsed ? "px-2" : "justify-start"}`} title={collapsed ? "Sign out" : undefined}><LogOut/>{!collapsed && "Sign out"}</Button></div>
    </aside>
    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/10 bg-background/90 px-4 backdrop-blur-xl lg:px-8">
        <Sheet><SheetTrigger asChild><Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation"><Menu/></Button></SheetTrigger><SheetContent side="left" className="w-72 bg-owner text-owner-foreground"><div className="mb-6"><Brand inverted/></div><NavItems mobile /><button onClick={signOut} className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-owner-foreground/65"><LogOut className="size-[18px]"/>Sign out</button></SheetContent></Sheet>
        <span className="truncate text-sm font-semibold lg:hidden">{current}</span>
        <div className="hidden min-w-0 lg:block"><p className="font-display truncate text-sm">VVS Flow</p><p className="figma-label text-[9px] text-primary">Ekström VVS</p></div>
        <div className="flex items-center gap-2"><span className="hidden max-w-48 truncate text-xs text-muted-foreground sm:inline">{email}</span><ThemeToggle/><span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground" title={email}>{initials(email.split("@")[0]?.replace(/[._]/g, " ") ?? "O")}</span></div>
      </header>
      <main className="mx-auto max-w-[1520px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-primary/10 bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">{items.slice(0,5).map(({to,label,icon:Icon,exact}) => <Link key={to} to={to} activeOptions={{exact}} className="figma-label relative flex min-h-16 flex-col items-center justify-center gap-1 text-[8px] text-muted-foreground" activeProps={{className:"text-primary before:absolute before:top-0 before:h-0.5 before:w-6 before:bg-primary"}}><Icon className="size-5"/><span>{label}</span></Link>)}<Link to="/dashboard/settings" className="figma-label flex min-h-16 flex-col items-center justify-center gap-1 text-[8px] text-muted-foreground"><MoreHorizontal className="size-5"/><span>More</span></Link></nav>
  </div>;
}
