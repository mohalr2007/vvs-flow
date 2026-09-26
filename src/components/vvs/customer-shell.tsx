import { Link } from "@tanstack/react-router";
import { Menu, Phone } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";

export function CustomerShell({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b border-foreground/8 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 lg:px-8">
        <Brand />
        {!minimal && <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground md:inline">Västerås · Certified VVS</span>
          <Button asChild size="sm" variant="outline"><Link to="/emergency"><Phone /> Emergency</Link></Button>
          <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/book">Book service</Link></Button>
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Menu"><Menu /></Button>
        </div>}
      </div>
    </header>
    <main>{children}</main>
    {!minimal && <footer className="border-t border-foreground/8 bg-owner px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-muted-foreground sm:flex-row"><span>Ekström VVS · Västerås</span><span>Every inquiry gets an outcome.</span></div></footer>}
  </div>;
}
