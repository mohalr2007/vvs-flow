import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function CustomerShell({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 lg:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          {!minimal && <>
            <span className="hidden text-sm text-muted-foreground md:inline">Västerås · Certified plumbing</span>
            <Button asChild size="sm" variant="outline"><Link to="/emergency"><Phone /> Emergency</Link></Button>
            <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/book">Book service</Link></Button>
          </>}
          <ThemeToggle />
        </div>
      </div>
    </header>
    <main>{children}</main>
    {!minimal && <footer className="bg-owner px-5 py-12 text-owner-foreground"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Brand inverted/><p className="mt-3 text-sm text-owner-foreground/60">Certified plumbing service in Västerås.</p></div><div className="text-sm text-owner-foreground/60 sm:text-right"><p>Every inquiry gets an outcome.</p><p className="mt-1">© 2026 Ekström VVS</p></div></div></footer>}
  </div>;
}
