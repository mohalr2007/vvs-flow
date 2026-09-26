import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ownerService } from "@/lib/services";
import { errMsg } from "./query-state";

export function DemoControls() {
  const reset = useServerFn(ownerService.reset);
  const advance = useServerFn(ownerService.advance);
  const qc = useQueryClient();
  const [busy, setBusy] = useState("");
  const run = async (label: string, fn: () => Promise<unknown>) => { setBusy(label); try { await fn(); await qc.invalidateQueries(); toast.success(`${label} done`); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); } };
  return <Card className="rounded-md border-dashed p-4 shadow-none"><p className="text-xs font-bold text-muted-foreground">DEMO CONTROLS</p><p className="mt-1 text-xs text-muted-foreground">Simulated clock and data — separate from real business actions.</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!!busy} onClick={() => { if (confirm("Reset all demo data?")) run("Reset", () => reset()); }}><RotateCcw/>{busy === "Reset" ? "Resetting…" : "Reset Demo"}</Button><Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("Advance 15 min", () => advance({ data: { minutes: 15 } }))}>Advance 15 min</Button><Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("Advance 24 hours", () => advance({ data: { minutes: 1440 } }))}>Advance 24 hours</Button></div></Card>;
}

