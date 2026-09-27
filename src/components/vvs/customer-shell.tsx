import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function CustomerShell({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });
  useEffect(() => { const update = () => setScrolled(window.scrollY > 20); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  return <div className="min-h-screen bg-background">
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? "border-b bg-background/90 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Brand inverted={pathname === "/" && !scrolled} />
        <nav className="hidden items-center gap-1 md:flex"><Link to="/" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground" activeProps={{className:"text-primary bg-primary/10"}}>Home</Link><Link to="/book" className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground" activeProps={{className:"text-primary bg-primary/10"}}>Book</Link><Button asChild size="sm"><Link to="/book">Book now</Link></Button><Button asChild size="sm" variant="destructive"><Link to="/emergency"><span className="relative size-1.5 rounded-full bg-destructive-foreground after:absolute after:inset-0 after:rounded-full after:bg-destructive-foreground after:animate-pulse-ring"/>Emergency</Link></Button><ThemeToggle inverted={pathname === "/" && !scrolled}/></nav>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(v => !v)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X/> : <Menu/>}</Button>
      </div>
      {open && <nav className="border-b bg-background/95 px-6 py-4 backdrop-blur-xl md:hidden"><Link to="/" onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 text-sm">Home</Link><Link to="/book" onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 text-sm">Book</Link><Link to="/emergency" onClick={() => setOpen(false)} className="block rounded-lg px-4 py-3 text-sm text-destructive">Emergency</Link></nav>}
    </header>
    <main className={minimal ? "pt-16" : ""}>{children}</main>
    {!minimal && <footer className="border-t border-primary/10 bg-background px-6 py-8"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 sm:flex-row sm:items-end"><Brand/><p className="figma-label text-[10px] text-muted-foreground">© 2026 Ekström VVS · Västerås</p></div></footer>}
  </div>;
}
