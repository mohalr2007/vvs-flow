// Public customer server functions. Every write is validated and token-scoped server-side.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { findSlots } from "./scheduling";
import { zoneFromAddress } from "./time";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function context() {
  const db = await admin();
  const { data: s } = await db.from("settings").select("*").eq("id", 1).single();
  const settings = s ?? { work_start_hour: 8, work_end_hour: 17, clock_offset_minutes: 0, business_name: "Ekström VVS", rest_days: [0, 6] };
  const now = new Date(Date.now() + settings.clock_offset_minutes * 60000);
  return { db, settings, now };
}
async function slotsFor(duration: number, zone: string, excludeJobId?: string) {
  const { db, settings, now } = await context();
  const { data: jobs, error: jobsError } = await db.from("jobs").select("id,scheduled_at,duration_min,zone,status").not("scheduled_at", "is", null);
  console.log("[slotsFor] now:", now.toISOString(), "jobs:", JSON.stringify(jobs), "error:", jobsError?.message);
  return findSlots({ jobs: (jobs ?? []).filter((j) => j.id !== excludeJobId), now, duration, zone, startHour: settings.work_start_hour, endHour: settings.work_end_hour, restDays: settings.rest_days });
}
async function expireOffers(db: Awaited<ReturnType<typeof admin>>, now: Date) {
  const { data } = await db.from("offers").select("id,waitlist_id").eq("status", "pending").lt("expires_at", now.toISOString());
  for (const o of data ?? []) {
    await db.from("offers").update({ status: "expired" }).eq("id", o.id);
    await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", o.waitlist_id);
  }
}

const text = (max: number) => z.string().trim().min(1).max(max);
const token = z.object({ token: z.string().regex(/^[a-f0-9]{32}$/) });

export const understandRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ message: text(1500), kind: z.enum(["repair", "project", "emergency"]) }).parse(d))
  .handler(async ({ data }) => {
    const { extractRequest } = await import("./ai.server");
    return extractRequest(data.message, data.kind);
  });

export const getAvailableSlots = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ duration: z.number().int().min(15).max(480), address: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => ({ groups: await slotsFor(data.duration, zoneFromAddress(data.address)) }));

export const createPhotoUpload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ext: z.enum(["jpg", "jpeg", "png", "webp", "heic"]) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const path = `intake/${crypto.randomUUID()}.${data.ext}`;
    const { data: up, error } = await db.storage.from("job-photos").createSignedUploadUrl(path);
    if (error || !up) throw new Error("Photo upload is unavailable right now.");
    return { path, token: up.token };
  });

const bookingSchema = z.object({
  kind: z.enum(["repair", "project", "emergency"]),
  name: text(120), phone: text(40), address: text(200), description: text(1500),
  title: z.string().max(120).nullable(), urgency: z.enum(["Low", "Normal", "High", "Emergency"]).nullable(),
  duration_min: z.number().int().min(15).max(480).nullable(), price_high: z.number().min(0).max(1000000).nullable(),
  confidence: z.number().min(0).max(100).nullable(), missing_fields: z.array(z.string().max(80)).max(5).nullable(),
  slotStart: z.string().datetime().nullable(), photoPath: z.string().regex(/^intake\/[a-f0-9-]+\.\w+$/).nullable(),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const { db, now } = await context();
    const zone = zoneFromAddress(data.address);
    if (data.kind === "project") {
      const { data: p, error } = await db.from("projects").insert({ title: data.title ?? "Project request", customer_name: data.name, phone: data.phone, address: data.address, description: data.description, status: "site_visit_requested" }).select("ref").single();
      if (error) throw new Error("Your request could not be saved. Please try again.");
      return { type: "project" as const, ref: p.ref, accessToken: null, scheduledAt: null, eta: null };
    }
    if (data.kind === "emergency") {
      const eta = new Date(Math.ceil((now.getTime() + 35 * 60000) / 300000) * 300000);
      const { data: j, error } = await db.from("jobs").insert({ customer_name: data.name, phone: data.phone, address: data.address, zone, title: data.title ?? "Emergency leak", description: data.description, status: "new", urgency: "Emergency", is_emergency: true, confidence: data.confidence ?? 0, duration_min: data.duration_min ?? 90, value: data.price_high ?? 0, scheduled_at: eta.toISOString(), photo_path: data.photoPath }).select("ref,access_token").single();
      if (error) throw new Error("Your emergency request could not be saved. Please call us directly.");
      return { type: "emergency" as const, ref: j.ref, accessToken: j.access_token, scheduledAt: eta.toISOString(), eta: { from: eta.toISOString(), to: new Date(eta.getTime() + 25 * 60000).toISOString() } };
    }
    const confidence = data.confidence ?? 0;
    const lowConfidence = confidence < 60 || !data.slotStart;
    if (data.slotStart) {
      const groups = await slotsFor(data.duration_min ?? 60, zone);
      if (!groups.some((g) => g.slots.some((s) => s.start === data.slotStart))) throw new Error("That time was just taken. Please choose another time.");
    }
    const { data: j, error } = await db.from("jobs").insert({ customer_name: data.name, phone: data.phone, address: data.address, zone, title: data.title ?? "Plumbing request", description: data.description, status: lowConfidence ? "needs_assessment" : "confirmed", urgency: data.urgency ?? "Normal", confidence, duration_min: data.duration_min ?? 60, value: data.price_high ?? 0, missing_fields: data.missing_fields ?? [], scheduled_at: lowConfidence ? null : data.slotStart, photo_path: data.photoPath }).select("ref,access_token,scheduled_at").single();
    if (error) throw new Error("Your booking hasn't been confirmed. Please try again.");
    return { type: lowConfidence ? ("assessment" as const) : ("booked" as const), ref: j.ref, accessToken: j.access_token, scheduledAt: j.scheduled_at, eta: null };
  });

const publicJob = "ref,title,customer_name,address,scheduled_at,duration_min,value,status,access_status,zone";

export const getBookingByToken = createServerFn({ method: "POST" })
  .inputValidator((d) => token.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: job } = await db.from("jobs").select(publicJob).eq("access_token", data.token).maybeSingle();
    return { job };
  });

export const confirmAccess = createServerFn({ method: "POST" })
  .inputValidator((d) => token.extend({ choice: z.enum(["Yes, I'll be home", "Key with neighbor", "Door code available", "I need to arrange access"]) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const ready = data.choice !== "I need to arrange access";
    const { data: job, error } = await db.from("jobs").update({ access_status: data.choice, ...(ready ? { status: "access_confirmed" as const } : {}) }).eq("access_token", data.token).in("status", ["confirmed", "access_confirmed"]).select("ref").maybeSingle();
    if (error || !job) throw new Error("This appointment can no longer be updated.");
    return { ok: true };
  });

export const getRescheduleOptions = createServerFn({ method: "POST" })
  .inputValidator((d) => token.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: job } = await db.from("jobs").select("id," + publicJob).eq("access_token", data.token).maybeSingle();
    if (!job) return { job: null, groups: [] };
    const j = job as unknown as { id: string; duration_min: number; zone: string };
    return { job, groups: await slotsFor(j.duration_min, j.zone, j.id) };
  });

export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => token.extend({ slotStart: z.string().datetime() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: job } = await db.from("jobs").select("id,duration_min,zone,status").eq("access_token", data.token).maybeSingle();
    if (!job || !["confirmed", "access_confirmed"].includes(job.status)) throw new Error("This appointment can no longer be rescheduled.");
    const groups = await slotsFor(job.duration_min, job.zone, job.id);
    if (!groups.some((g) => g.slots.some((s) => s.start === data.slotStart))) throw new Error("That time is no longer available.");
    await db.from("jobs").update({ scheduled_at: data.slotStart, status: "confirmed", access_status: null }).eq("id", job.id);
    return { ok: true, scheduledAt: data.slotStart };
  });

export const getOffer = createServerFn({ method: "POST" })
  .inputValidator((d) => token.parse(d))
  .handler(async ({ data }) => {
    const { db, now } = await context();
    await expireOffers(db, now);
    const { data: offer } = await db.from("offers").select("status,slot_start,duration_min,expires_at,waitlist_entries(customer_name,title)").eq("token", data.token).maybeSingle();
    if (!offer) return { offer: null };
    return { offer: { ...offer, secondsLeft: Math.max(0, Math.round((new Date(offer.expires_at).getTime() - now.getTime()) / 1000)) } };
  });

export const respondOffer = createServerFn({ method: "POST" })
  .inputValidator((d) => token.extend({ accept: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { db, now } = await context();
    await expireOffers(db, now);
    const { data: offer } = await db.from("offers").select("*,waitlist_entries(*)").eq("token", data.token).maybeSingle();
    if (!offer || offer.status !== "pending") throw new Error(offer?.status === "expired" ? "This offer has expired." : "This offer is no longer available.");
    const w = offer.waitlist_entries as unknown as { id: string; customer_name: string; phone: string; title: string; zone: string; urgency: string; value: number };
    if (!data.accept) {
      await db.from("offers").update({ status: "declined" }).eq("id", offer.id);
      await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", w.id);
      return { status: "declined" as const, accessToken: null };
    }
    const { data: claimed } = await db.from("offers").update({ status: "accepted" }).eq("id", offer.id).eq("status", "pending").select("id").maybeSingle();
    if (!claimed) throw new Error("This offer is no longer available.");
    const { data: job } = await db.from("jobs").insert({ customer_name: w.customer_name, phone: w.phone, zone: w.zone, title: w.title, description: "Recovered from waitlist offer.", status: "confirmed", urgency: w.urgency, confidence: 100, duration_min: offer.duration_min, value: w.value, scheduled_at: offer.slot_start }).select("access_token").single();
    await db.from("waitlist_entries").update({ status: "booked" }).eq("id", w.id);
    if (offer.source_job_id) await db.from("jobs").update({ status: "expired" }).eq("id", offer.source_job_id);
    return { status: "accepted" as const, accessToken: job?.access_token ?? null };
  });
