// Owner-only server functions. Every call requires a signed-in user with the owner role;
// reads/writes run as that user so database security rules apply.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findSlots, scoreMatch } from "./scheduling";
import { startOfStockholmDay } from "./time";

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };

async function guard(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "owner" });
  if (!data) throw new Error("Forbidden: owner access required.");
  const { data: s } = await ctx.supabase.from("settings").select("*").eq("id", 1).single();
  if (!s) throw new Error("Settings missing. Reset the demo from Settings.");
  const now = new Date(Date.now() + s.clock_offset_minutes * 60000);
  return { db: ctx.supabase, settings: s, now };
}
async function expireOffers(db: Ctx["supabase"], now: Date) {
  const { data } = await db.from("offers").select("id,waitlist_id").eq("status", "pending").lt("expires_at", now.toISOString());
  for (const o of data ?? []) {
    await db.from("offers").update({ status: "expired" }).eq("id", o.id);
    await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", o.waitlist_id);
  }
}
const owner = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]); // kept for type reuse; exports must use the direct chain below
const id = z.object({ id: z.string().uuid() });

export const getOwnerStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  if (data) return { isOwner: true, claimable: false };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner");
  return { isOwner: false, claimable: (count ?? 0) === 0 };
});

export const claimOwnership = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner");
  if ((count ?? 0) > 0) throw new Error("This workspace already has an owner.");
  const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "owner" });
  if (error) throw new Error("Could not activate owner access.");
  return { ok: true };
});

export const getOverview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db, now, settings } = await guard(context);
  await expireOffers(db, now);
  const [{ data: jobs }, { data: projects }, { data: leads }, { data: offers }] = await Promise.all([
    db.from("jobs").select("*").order("scheduled_at", { ascending: true }),
    db.from("projects").select("id,status"),
    db.from("leads").select("value,stage"),
    db.from("offers").select("source_job_id,status"),
  ]);
  const all = jobs ?? [];
  const dayStart = startOfStockholmDay(now), dayEnd = startOfStockholmDay(now, 1), tomorrowEnd = startOfStockholmDay(now, 2);
  const inRange = (iso: string | null, a: Date, b: Date) => !!iso && new Date(iso) >= a && new Date(iso) < b;
  const review = all.filter((j) => j.status === "new" || j.status === "qualified");
  const assessment = all.filter((j) => j.status === "needs_assessment");
  const access = all.filter((j) => j.status === "confirmed" && inRange(j.scheduled_at, now, tomorrowEnd));
  const recovered = new Set((offers ?? []).filter((o) => o.status === "accepted").map((o) => o.source_job_id));
  const openSlots = all.filter((j) => j.status === "cancelled" && j.scheduled_at && new Date(j.scheduled_at) > now && !recovered.has(j.id));
  const brf = (projects ?? []).filter((p) => p.status === "owner_review");
  const abandoned = (leads ?? []).filter((l) => l.stage === "Abandoned");
  const revenueAtRisk = [...review, ...assessment, ...openSlots].reduce((a, j) => a + j.value, 0) + abandoned.reduce((a, l) => a + l.value, 0);
  const today = all.filter((j) => inRange(j.scheduled_at, dayStart, dayEnd) && j.status !== "expired");
  const bookedMin = today.filter((j) => j.status !== "cancelled").reduce((a, j) => a + j.duration_min, 0);
  const capacity = Math.max(0, (settings.work_end_hour - settings.work_start_hour) * 60 - bookedMin);
  return {
    now: now.toISOString(), ownerName: settings.owner_name,
    counts: { review: review.length, assessment: assessment.length, access: access.length, openSlots: openSlots.length, projects: brf.length, abandoned: abandoned.length },
    firstOpenSlot: openSlots[0]?.scheduled_at ?? null,
    revenueAtRisk, capacityMin: capacity, today,
  };
});

export const listJobs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db } = await guard(context);
  const { data, error } = await db.from("jobs").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Jobs could not be loaded.");
  return data;
});

export const getJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { data: job } = await db.from("jobs").select("*").eq("id", data.id).maybeSingle();
  let photoUrl: string | null = null;
  if (job?.photo_path) photoUrl = (await db.storage.from("job-photos").createSignedUrl(job.photo_path, 600)).data?.signedUrl ?? null;
  return { job, photoUrl };
});

const jobEdit = z.object({ title: z.string().min(1).max(120), urgency: z.enum(["Low", "Normal", "High", "Emergency"]), duration_min: z.number().int().min(15).max(480), zone: z.string().max(10), value: z.number().int().min(0).max(10000000), description: z.string().max(2000), site_visit: z.boolean() });

export const saveJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.extend({ fields: jobEdit }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { error } = await db.from("jobs").update(data.fields).eq("id", data.id);
  if (error) throw new Error("Changes could not be saved.");
  return { ok: true };
});

export const approveJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.extend({ fields: jobEdit }).parse(d)).handler(async ({ context, data }) => {
  const { db, now, settings } = await guard(context);
  const { error } = await db.from("jobs").update({ ...data.fields, status: "qualified", missing_fields: [] }).eq("id", data.id);
  if (error) throw new Error("Approval could not be saved.");
  const { data: jobs } = await db.from("jobs").select("scheduled_at,duration_min,zone,status").not("scheduled_at", "is", null);
  return { groups: findSlots({ jobs: jobs ?? [], now, duration: data.fields.duration_min, zone: data.fields.zone, startHour: settings.work_start_hour, endHour: settings.work_end_hour, restDays: settings.rest_days }) };
});

export const scheduleJob = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.extend({ slotStart: z.string().datetime() }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { error } = await db.from("jobs").update({ scheduled_at: data.slotStart, status: "confirmed" }).eq("id", data.id);
  if (error) throw new Error("The appointment could not be scheduled.");
  return { ok: true };
});

export const setJobStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.extend({ status: z.enum(["cancelled", "in_progress", "completed", "waitlisted", "held"]) }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { data: job } = await db.from("jobs").select("*").eq("id", data.id).single();
  if (!job) throw new Error("Job not found.");
  await db.from("jobs").update({ status: data.status }).eq("id", data.id);
  if (data.status === "completed") await db.from("rot_records").insert({ customer: job.customer_name, work: job.title, labor: Math.round(job.value * 0.7), materials: Math.round(job.value * 0.3), status: "Review" });
  if (data.status === "waitlisted") await db.from("waitlist_entries").insert({ customer_name: job.customer_name, phone: job.phone, title: job.title, zone: job.zone, duration_min: job.duration_min, urgency: job.urgency, value: job.value });
  return { ok: true };
});

export const getCalendar = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ offsetDays: z.number().int().min(-60).max(60) }).parse(d)).handler(async ({ context, data }) => {
  const { db, now, settings } = await guard(context);
  const from = startOfStockholmDay(now, data.offsetDays), to = startOfStockholmDay(now, data.offsetDays + 7);
  const { data: jobs } = await db.from("jobs").select("id,title,customer_name,zone,status,scheduled_at,duration_min").gte("scheduled_at", from.toISOString()).lt("scheduled_at", to.toISOString()).neq("status", "expired");
  const fromD = new Date(from.getTime() + 12 * 3600000).toISOString().slice(0, 10), toD = new Date(to.getTime() + 12 * 3600000).toISOString().slice(0, 10);
  const { data: tasks } = await db.from("project_tasks").select("id,title,work_date,start_hour,end_hour,done,project_id,projects(customer_name,ref)").gte("work_date", fromD).lt("work_date", toD);
  return { from: from.toISOString(), now: now.toISOString(), jobs: jobs ?? [], tasks: tasks ?? [], restDays: settings.rest_days, workStart: settings.work_start_hour, workEnd: settings.work_end_hour };
});

export const getWaitlist = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db, now } = await guard(context);
  await expireOffers(db, now);
  const [{ data: entries }, { data: slots }, { data: offers }] = await Promise.all([
    db.from("waitlist_entries").select("*").in("status", ["waiting", "offered"]).order("created_at"),
    db.from("jobs").select("id,title,zone,duration_min,scheduled_at,value").eq("status", "cancelled").gt("scheduled_at", now.toISOString()).order("scheduled_at"),
    db.from("offers").select("*,waitlist_entries(customer_name,title,email)").order("created_at", { ascending: false }).limit(20),
  ]);
  const withTime = (offers ?? []).map((o) => ({ ...o, secondsLeft: Math.max(0, Math.round((new Date(o.expires_at).getTime() - now.getTime()) / 1000)) }));
  const recovered = new Set(withTime.filter((o) => o.status === "accepted").map((o) => o.source_job_id));
  return { entries: entries ?? [], slots: (slots ?? []).filter((s) => !recovered.has(s.id)), offers: withTime };
});

export const findMatches = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.parse(d)).handler(async ({ context, data }) => {
  const { db, now } = await guard(context);
  const { data: slot } = await db.from("jobs").select("zone,duration_min").eq("id", data.id).single();
  if (!slot) throw new Error("Slot not found.");
  const { data: entries } = await db.from("waitlist_entries").select("*").eq("status", "waiting");
  return (entries ?? []).map((e) => ({ entry: e, ...scoreMatch(e, slot, now) })).sort((a, b) => b.score - a.score);
});

export const sendOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ jobId: z.string().uuid(), waitlistId: z.string().uuid() }).parse(d)).handler(async ({ context, data }) => {
  const { db, now } = await guard(context);
  const { data: slot } = await db.from("jobs").select("zone,duration_min,scheduled_at").eq("id", data.jobId).single();
  const { data: entry } = await db.from("waitlist_entries").select("*").eq("id", data.waitlistId).eq("status", "waiting").single();
  if (!slot?.scheduled_at || !entry) throw new Error("This customer or slot is no longer available.");
  const { data: pending } = await db.from("offers").select("id").eq("source_job_id", data.jobId).eq("status", "pending").maybeSingle();
  if (pending) throw new Error("An offer for this slot is already waiting for an answer.");
  const { score, breakdown } = scoreMatch(entry, slot, now);
  const { data: offer, error } = await db.from("offers").insert({ waitlist_id: entry.id, source_job_id: data.jobId, slot_start: slot.scheduled_at, duration_min: slot.duration_min, expires_at: new Date(now.getTime() + 15 * 60000).toISOString(), score, breakdown }).select("token").single();
  if (error) throw new Error("The offer could not be created.");
  await db.from("waitlist_entries").update({ status: "offered" }).eq("id", entry.id);
  let emailed = false;
  if (entry.email) {
    const { sendEmail, offerEmail, offerUrl } = await import("./email.server");
    const when = new Date(slot.scheduled_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    const mail = offerEmail({ name: entry.customer_name, title: entry.title, when, offerUrl: offerUrl(offer.token) });
    emailed = (await sendEmail(entry.email, mail.subject, mail.html).catch(() => ({ sent: false }))).sent;
  }
  return { token: offer.token, secondsLeft: 900, emailed };
});

export const listLeads = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db } = await guard(context);
  return (await db.from("leads").select("*").order("created_at", { ascending: false })).data ?? [];
});
export const setLeadStage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.extend({ stage: z.enum(["New", "Qualified", "Held", "Abandoned", "Converted"]) }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  await db.from("leads").update({ stage: data.stage }).eq("id", data.id);
  return { ok: true };
});

const PROJECT_FLOW = ["project_request", "site_visit_requested", "site_visit_scheduled", "owner_review", "project_approved", "scheduled", "in_progress", "completed"] as const;
export const listProjects = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db } = await guard(context);
  return (await db.from("projects").select("*").order("created_at", { ascending: false })).data ?? [];
});
export const advanceProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { data: p } = await db.from("projects").select("status").eq("id", data.id).single();
  const i = PROJECT_FLOW.indexOf(p!.status);
  const next = PROJECT_FLOW[Math.min(PROJECT_FLOW.length - 1, i + 1)]!;
  await db.from("projects").update({ status: next }).eq("id", data.id);
  return { status: next };
});

export const getProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.parse(d)).handler(async ({ context, data }) => {
  const { db, settings } = await guard(context);
  const { data: project } = await db.from("projects").select("*").eq("id", data.id).single();
  if (!project) throw new Error("Project not found.");
  const { data: tasks } = await db.from("project_tasks").select("*").eq("project_id", data.id).order("work_date").order("created_at");
  return { project, tasks: tasks ?? [], restDays: settings.rest_days, workStart: settings.work_start_hour, workEnd: settings.work_end_hour };
});
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const addDay = (s: string, n: number) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dow = (s: string) => new Date(s + "T12:00:00Z").getUTCDay();
/** Re-lays out every working day of a project sequentially from its start date, skipping the owner's rest days unless worked on purpose. */
async function relayout(db: Ctx["supabase"], projectId: string, restDays: number[]) {
  const { data: p } = await db.from("projects").select("start_date,worked_rest_dates").eq("id", projectId).single();
  if (!p?.start_date) return;
  const { data: tasks } = await db.from("project_tasks").select("id,work_date,is_extension,created_at").eq("project_id", projectId);
  const ordered = (tasks ?? []).sort((a, b) => Number(a.is_extension) - Number(b.is_extension) || a.work_date.localeCompare(b.work_date) || a.created_at.localeCompare(b.created_at));
  let cur = p.start_date, guardN = 0;
  for (const t of ordered) {
    while (restDays.includes(dow(cur)) && !p.worked_rest_dates.includes(cur) && guardN++ < 400) cur = addDay(cur, 1);
    if (t.work_date !== cur) await db.from("project_tasks").update({ work_date: cur }).eq("id", t.id);
    cur = addDay(cur, 1);
  }
}
export const planProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ projectId: z.string().uuid(), startDate: dateStr, days: z.number().int().min(1).max(120), title: z.string().trim().min(1).max(120) }).parse(d)).handler(async ({ context, data }) => {
  const { db, settings } = await guard(context);
  const { count } = await db.from("project_tasks").select("id", { count: "exact", head: true }).eq("project_id", data.projectId);
  if (count) throw new Error("This site is already planned. Add delay days instead, or reset the plan.");
  await db.from("projects").update({ start_date: data.startDate, planned_days: data.days, worked_rest_dates: [] }).eq("id", data.projectId);
  const rows = Array.from({ length: data.days }, (_, i) => ({ project_id: data.projectId, title: `${data.title} · day ${i + 1}`, work_date: addDay(data.startDate, i), start_hour: settings.work_start_hour, end_hour: settings.work_end_hour, notes: "" }));
  const { error } = await db.from("project_tasks").insert(rows);
  if (error) throw new Error(error.message);
  await relayout(db, data.projectId, settings.rest_days);
  return { count: rows.length };
});
export const extendProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ projectId: z.string().uuid(), days: z.number().int().min(1).max(5), reason: z.string().trim().max(300) }).parse(d)).handler(async ({ context, data }) => {
  const { db, settings } = await guard(context);
  const { data: p } = await db.from("projects").select("start_date").eq("id", data.projectId).single();
  if (!p?.start_date) throw new Error("Plan the site first.");
  const { count } = await db.from("project_tasks").select("id", { count: "exact", head: true }).eq("project_id", data.projectId).eq("is_extension", true);
  const rows = Array.from({ length: data.days }, (_, i) => ({ project_id: data.projectId, title: `Delay day ${(count ?? 0) + i + 1}`, work_date: "2999-12-31", start_hour: settings.work_start_hour, end_hour: settings.work_end_hour, notes: data.reason, is_extension: true }));
  const { error } = await db.from("project_tasks").insert(rows);
  if (error) throw new Error(error.message);
  await relayout(db, data.projectId, settings.rest_days);
  return { count: rows.length };
});
export const toggleRestDay = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ projectId: z.string().uuid(), date: dateStr }).parse(d)).handler(async ({ context, data }) => {
  const { db, settings } = await guard(context);
  const { data: p } = await db.from("projects").select("worked_rest_dates").eq("id", data.projectId).single();
  const list = p?.worked_rest_dates ?? [];
  const next = list.includes(data.date) ? list.filter((x) => x !== data.date) : [...list, data.date];
  await db.from("projects").update({ worked_rest_dates: next }).eq("id", data.projectId);
  await relayout(db, data.projectId, settings.rest_days);
  return { working: next.includes(data.date) };
});
export const resetProjectPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  await db.from("project_tasks").delete().eq("project_id", data.id);
  await db.from("projects").update({ start_date: null, planned_days: 0, worked_rest_dates: [] }).eq("id", data.id);
  return { ok: true };
});
const checklist = z.array(z.object({ text: z.string().trim().min(1).max(200), done: z.boolean() })).max(50);
export const updateProjectTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ id: z.string().uuid(), done: z.boolean().optional(), remove: z.boolean().optional(), title: z.string().trim().min(1).max(120).optional(), notes: z.string().max(1000).optional(), checklist: checklist.optional(), start_hour: z.number().int().min(0).max(23).optional(), end_hour: z.number().int().min(1).max(24).optional() }).parse(d)).handler(async ({ context, data }) => {
  const { db, settings } = await guard(context);
  const { id: taskId, remove, ...patch } = data;
  if (remove) {
    const { data: t } = await db.from("project_tasks").select("project_id,is_extension").eq("id", taskId).single();
    if (!t?.is_extension) throw new Error("Only delay days can be removed. Reset the plan to change the length.");
    await db.from("project_tasks").delete().eq("id", taskId);
    await relayout(db, t.project_id, settings.rest_days);
    return { ok: true };
  }
  if (patch.start_hour !== undefined && patch.end_hour !== undefined && patch.end_hour <= patch.start_hour) throw new Error("End must be after start.");
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as import("@/integrations/supabase/types").TablesUpdate<"project_tasks">;
  const { error } = await db.from("project_tasks").update(clean).eq("id", taskId);
  if (error) throw new Error(error.message);
  return { ok: true };
});
const quote = z.object({
  materials: z.array(z.object({ name: z.string().trim().min(1).max(120), qty: z.number().min(0).max(100000), unit_price: z.number().min(0).max(10000000) })).max(100),
  labor: z.number().min(0).max(100000000),
  deposit: z.number().min(0).max(100000000),
  installments: z.array(z.object({ label: z.string().trim().min(1).max(80), amount: z.number().min(0).max(100000000), due: z.string().max(10), paid: z.boolean() })).max(24),
  notes: z.string().max(3000),
  valid_until: z.string().max(10),
  status: z.enum(["draft", "sent", "accepted", "declined"]),
});
export type Quote = z.infer<typeof quote>;
export const saveProjectQuote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ projectId: z.string().uuid(), quote }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const total = data.quote.materials.reduce((s, m) => s + m.qty * m.unit_price, 0) + data.quote.labor;
  const { error } = await db.from("projects").update({ quote: data.quote, budget: `${Math.round(total).toLocaleString("sv-SE")} SEK` }).eq("id", data.projectId);
  if (error) throw new Error(error.message);
  return { total };
});
export const setProjectStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(PROJECT_FLOW) }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  await db.from("projects").update({ status: data.status }).eq("id", data.id);
  return { status: data.status };
});

export const understandInbox = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ text: z.string().trim().min(1).max(2000) }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { extractRequest } = await import("./ai.server");
  const res = await extractRequest(data.text, "message");
  if ("data" in res) await db.from("inbox_messages").insert({ body: data.text, result: res.data });
  return res;
});
export const createJobFromInbox = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ text: z.string().max(2000), title: z.string().max(120), urgency: z.string().max(20), duration_min: z.number().int(), value: z.number().int(), confidence: z.number().int(), location: z.string().max(120).nullable(), missing: z.array(z.string()) }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  const { data: job, error } = await db.from("jobs").insert({ customer_name: "Inbox customer", title: data.title, description: data.text, urgency: data.urgency, duration_min: data.duration_min, value: data.value, confidence: data.confidence, address: data.location ?? "", missing_fields: data.missing, status: data.confidence < 60 ? "needs_assessment" : "new" }).select("id").single();
  if (error) throw new Error("Job could not be created.");
  return { id: job.id };
});

export const listRot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db } = await guard(context);
  return (await db.from("rot_records").select("*").order("created_at", { ascending: false })).data ?? [];
});
export const setRotStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => id.extend({ status: z.enum(["Ready", "Review", "Exported"]) }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  await db.from("rot_records").update({ status: data.status }).eq("id", data.id);
  return { ok: true };
});

export const getSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => (await guard(context)).settings);
export const saveSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ business_name: z.string().min(1).max(80), owner_name: z.string().min(1).max(80), service_area: z.string().max(80), emergency_buffer_min: z.number().int().min(0).max(480), work_start_hour: z.number().int().min(0).max(23), work_end_hour: z.number().int().min(1).max(24), hourly_rate: z.number().int().min(0).max(10000), rest_days: z.array(z.number().int().min(0).max(6)).max(6), route_buffer_min: z.number().int().min(0).max(120), day_start_mode: z.enum(["business", "home", "custom"]), day_end_mode: z.enum(["none", "business", "home", "custom"]), home_address: z.string().max(300), home_lat: z.number().min(-90).max(90).nullable(), home_lng: z.number().min(-180).max(180).nullable(), custom_address: z.string().max(300), custom_lat: z.number().min(-90).max(90).nullable(), custom_lng: z.number().min(-180).max(180).nullable() }).parse(d)).handler(async ({ context, data }) => {
  const { db } = await guard(context);
  if (data.work_end_hour <= data.work_start_hour) throw new Error("Working day must end after it starts.");
  for (const k of ["home", "custom"] as const) if ([data.day_start_mode, data.day_end_mode].includes(k) && (data[`${k}_lat`] == null || data[`${k}_lng`] == null)) throw new Error(`Set the ${k} location before using it as a start or end point.`);
  const { error } = await db.from("settings").update(data).eq("id", 1);
  if (error) throw new Error("Settings could not be saved.");
  return { ok: true };
});

export const resetDemo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await guard(context);
  const { error } = await context.supabase.rpc("reset_demo");
  if (error) throw new Error("Demo reset failed.");
  return { ok: true };
});
export const clearAppointments = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { db } = await guard(context);
  const o = await db.from("offers").delete().not("id", "is", null);
  if (o.error) throw new Error("Offers could not be cleared: " + o.error.message);
  const t = await db.from("project_tasks").delete().not("id", "is", null);
  if (t.error) throw new Error("Site work could not be cleared: " + t.error.message);
  const j = await db.from("jobs").delete().not("id", "is", null);
  if (j.error) throw new Error("Appointments could not be cleared: " + j.error.message);
  return { ok: true };
});
export const advanceClock = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ minutes: z.union([z.literal(15), z.literal(1440)]) }).parse(d)).handler(async ({ context, data }) => {
  const { db, settings } = await guard(context);
  await db.from("settings").update({ clock_offset_minutes: settings.clock_offset_minutes + data.minutes }).eq("id", 1);
  return { ok: true };
});
