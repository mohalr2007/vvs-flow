import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BriefcaseBusiness, CalendarDays, ListFilter, Users, FolderKanban, Inbox, ReceiptText, Settings, Menu, LogOut } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ownerAuthService } from "@/lib/auth";

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

function NavItems({ mobile = false }: { mobile?: boolean }) {
  return <nav className={mobile ? "space-y-1" : "flex-1 space-y-1 p-3"}>{items.map(({ to, label, icon: Icon, exact }) => <Link key={to} to={to} activeOptions={{ exact }} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-owner-foreground/65 transition-colors hover:bg-owner-foreground/8 hover:text-owner-foreground" activeProps={{ className: "bg-owner-foreground/12 text-owner-foreground" }}><Icon className="size-[18px] shrink-0"/><span>{label}</span></Link>)}</nav>;
}

export function OwnerShell() {
  const session = ownerAuthService.getSession();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const current = items.find(i => i.to === pathname)?.label ?? "Dashboard";
  return <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-owner-foreground/8 bg-owner lg:flex">
      <div className="border-b border-owner-foreground/10 p-5"><Brand inverted /></div><NavItems />
      <div className="border-t border-owner-foreground/10 p-3"><Link to="/login" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-owner-foreground/65 hover:bg-owner-foreground/8"><LogOut className="size-[18px]"/>Sign out</Link></div>
    </aside>
    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-xl lg:px-8">
        <Sheet><SheetTrigger asChild><Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation"><Menu/></Button></SheetTrigger><SheetContent side="left" className="w-72 bg-owner text-owner-foreground"><div className="mb-6"><Brand inverted/></div><NavItems mobile /></SheetContent></Sheet>
        <span className="truncate text-sm font-semibold lg:hidden">{current}</span>
        <div className="hidden min-w-0 lg:block"><p className="truncate text-sm font-semibold">{session.owner.business}</p><p className="text-xs text-muted-foreground">Operations workspace</p></div>
        <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">Demo workspace</span><span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground" title={`${session.owner.name} · frontend demo session`}>{session.owner.initials}</span></div>
      </header>
      <main className="mx-auto max-w-[1520px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">{items.slice(0,5).map(({to,label,icon:Icon,exact}) => <Link key={to} to={to} activeOptions={{exact}} className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground" activeProps={{className:"text-primary"}}><Icon className="size-5"/><span>{label}</span></Link>)}</nav>
  </div>;
}
