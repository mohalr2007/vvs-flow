import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { DemoControls } from "@/components/vvs/demo-controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ownerService } from "@/lib/services";
import type { Settings } from "@/lib/vvs-data";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — VVS Flow" }, { name: "description", content: "Business hours, pricing and demo controls for Ekström VVS." }, { property: "og:title", content: "Settings — VVS Flow" }, { property: "og:description", content: "Configure the VVS Flow workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const get = useServerFn(ownerService.settings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => get() });
  return <div className="space-y-6"><PageHeader title="Settings" description="Business details, working hours and demo controls."/><QueryState q={q}>{(s) => <Form s={s}/>}</QueryState><div className="max-w-2xl"><DemoControls/></div></div>;
}

function Form({ s }: { s: Settings }) {
  const save = useServerFn(ownerService.saveSettings);
  const qc = useQueryClient();
  const [f, setF] = useState(s);
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(s), [s]);
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  return <Card className="max-w-2xl rounded-md p-5 shadow-none"><form onSubmit={async e => { e.preventDefault(); setBusy(true); try { const { id: _i, clock_offset_minutes: _c, ...rest } = f; await save({ data: rest }); await qc.invalidateQueries(); toast.success("Settings saved"); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); } }}>
    <div className="grid gap-5 sm:grid-cols-2"><F label="Business name" id="bn"><Input id="bn" value={f.business_name} onChange={e => setF({ ...f, business_name: e.target.value })}/></F><F label="Owner" id="on"><Input id="on" value={f.owner_name} onChange={e => setF({ ...f, owner_name: e.target.value })}/></F><F label="Service area" id="sa"><Input id="sa" value={f.service_area} onChange={e => setF({ ...f, service_area: e.target.value })}/></F><F label="Hourly rate (SEK)" id="hr"><Input id="hr" type="number" value={f.hourly_rate} onChange={num("hourly_rate")}/></F><F label="Workday starts (hour)" id="ws"><Input id="ws" type="number" min={0} max={23} value={f.work_start_hour} onChange={num("work_start_hour")}/></F><F label="Workday ends (hour)" id="we"><Input id="we" type="number" min={1} max={24} value={f.work_end_hour} onChange={num("work_end_hour")}/></F><F label="Emergency buffer (min)" id="eb"><Input id="eb" type="number" min={0} value={f.emergency_buffer_min} onChange={num("emergency_buffer_min")}/></F></div>
    <Button className="mt-6" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>{f.clock_offset_minutes !== 0 && <p className="mt-4 text-xs text-muted-foreground">Demo clock is {Math.round(f.clock_offset_minutes / 60)}h ahead of real time.</p>}</form></Card>;
}
function F({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div><Label htmlFor={id} className="mb-2 block">{label}</Label>{children}</div>; }
