// Public customer server functions. Every write is validated and token-scoped server-side.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { findSlots, jobOverlaps } from "./scheduling";
import { zoneFromAddress } from "./time";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function context() {
  const db = await admin();
  const { data: s } = await db.from("settings").select("*").eq("id", 1).single();
  const settings = s ?? { work_start_hour: 8, work_end_hour: 17, clock_offset_minutes: 0, business_name: "Ekström VVS", rest_days: [0, 6], route_buffer_min: 10, day_start_mode: "business", day_end_mode: "none", home_lat: null, home_lng: null, custom_lat: null, custom_lng: null };
  const now = new Date(Date.now() + settings.clock_offset_minutes * 60000);
  return { db, settings, now };
}
type Coords = { lat: number; lng: number } | null;
// Coordinates for slot math: the pinned location when present, otherwise the typed address is
// geocoded server-side so OSRM route feasibility governs availability in every case —
// the fixed 20-minute zone buffer remains only as the last-resort fallback when the
// geocoder is unreachable.
async function resolveCoords(lat?: number | null, lng?: number | null, address?: string): Promise<Coords> {
  if (lat != null && lng != null) return { lat, lng };
  if (!address || address.trim().length < 4) return null;
  try {
    const { searchAddresses } = await import("./location.server");
    const hits = await searchAddresses(address.trim());
    if (hits[0]) return { lat: hits[0].lat, lng: hits[0].lng };
  } catch { /* geocoder unreachable — caller falls back to zone-based slots */ }
  return null;
}
// Route-aware when the customer location is known; falls back to zone gaps for legacy jobs without coordinates.
async function slotsFor(duration: number, zone: string, customer: Coords, excludeJobId?: string) {
  const { db, settings, now } = await context();
  const { data: jobs } = await db.from("jobs").select("id,scheduled_at,duration_min,zone,status,lat,lng").not("scheduled_at", "is", null);
  const list = (jobs ?? []).filter((j) => j.id !== excludeJobId);
  if (customer) {
    const { routeSlots } = await import("./route.server");
    const r = await routeSlots({ jobs: list, settings: settings as Parameters<typeof routeSlots>[0]["settings"], now, duration, zone, customer });
    return { groups: r.groups, feasible: r.feasible, routeUnavailable: r.routeUnavailable };
  }
  const groups = findSlots({ jobs: list, now, duration, zone, startHour: settings.work_start_hour, endHour: settings.work_end_hour, restDays: settings.rest_days });
  return { groups, feasible: new Set(groups.flatMap((g) => g.slots.map((x) => x.start))), routeUnavailable: false };
}
// Hard "slot already taken" check: any active job overlapping [start, start+duration).
// Used at submit time so a stale list can never book an impossible slot.
async function slotTaken(db: Awaited<ReturnType<typeof admin>>, start: string, durationMin: number, excludeJobId?: string) {
  const s = new Date(start).getTime(), e = s + durationMin * 60000;
  let q = db.from("jobs").select("id,scheduled_at,duration_min,status").not("scheduled_at", "is", null);
  if (excludeJobId) q = q.neq("id", excludeJobId);
  const { data: others } = await q;
  return (others ?? []).some((o) => jobOverlaps(o, s, e));
}
// Atomic guard: after inserting, if another active job overlaps, the later writer backs out.
async function conflictAfterInsert(db: Awaited<ReturnType<typeof admin>>, id: string, start: string, duration: number) {
  const s = new Date(start).getTime(), e = s + duration * 60000;
  const { data: mine } = await db.from("jobs").select("created_at").eq("id", id).single();
  const { data: others } = await db.from("jobs").select("id,scheduled_at,duration_min,created_at,status").neq("id", id).not("scheduled_at", "is", null)
    .gte("scheduled_at", new Date(s - 8 * 3600000).toISOString()).lte("scheduled_at", new Date(e).toISOString());
  return (others ?? []).some((o) => {
    if (!jobOverlaps(o, s, e)) return false;
    return o.created_at < (mine?.created_at ?? "") || (o.created_at === mine?.created_at && o.id < id);
  });
}
async function expireOffers(db: Awaited<ReturnType<typeof admin>>, now: Date) {
  const { data } = await db.from("offers").select("id,waitlist_id,source_job_id,slot_start,duration_min").eq("status", "pending").lt("expires_at", now.toISOString());
  for (const o of data ?? []) {
    await db.from("offers").update({ status: "expired" }).eq("id", o.id);
    await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", o.waitlist_id);
    if (o.source_job_id) {
      const { cascadeWaitlistOffer } = await import("./owner.functions");
      await cascadeWaitlistOffer(db, o.source_job_id, now, 30).catch((e) => console.warn("Cascade failed:", e));
    } else {
      // Direct owner proposal: the same owner-chosen time goes to the next candidate in line.
      const { cascadeDirectOffer } = await import("./owner.functions");
      await cascadeDirectOffer(db, o, now).catch((e) => console.warn("Direct cascade failed:", e));
    }
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
  .inputValidator((d) => z.object({ duration: z.number().int().min(15).max(480), address: z.string().max(200), lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    const customer = await resolveCoords(data.lat, data.lng, data.address);
    if (customer) {
      const { isInsideServiceArea } = await import("./location.server");
      if (!isInsideServiceArea(customer.lat, customer.lng)) return { groups: [], routeUnavailable: false, outsideArea: true };
    }
    const r = await slotsFor(data.duration, zoneFromAddress(data.address), customer);
    return { groups: r.groups, routeUnavailable: r.routeUnavailable, outsideArea: false };
  });

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
  name: text(120), phone: text(40), email: z.string().trim().email().max(160).or(z.literal("")), address: text(200), description: text(1500),
  title: z.string().max(120).nullable(), urgency: z.enum(["Low", "Normal", "High", "Emergency"]).nullable(),
  duration_min: z.number().int().min(15).max(480).nullable(), price_high: z.number().min(0).max(1000000).nullable(),
  confidence: z.number().min(0).max(100).nullable(), missing_fields: z.array(z.string().max(80)).max(5).nullable(),
  slotStart: z.string().nullable(), photoPath: z.string().regex(/^intake\/[a-f0-9-]+\.\w+$/).nullable(),
  lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional(),
  accessChoice: z.string().nullable().optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const { db, now } = await context();
    const zone = zoneFromAddress(data.address);
    // Service-area validation and route-aware slots apply to pinned AND typed addresses:
    // the address is geocoded server-side when no map pin was set.
    const customerCoords = await resolveCoords(data.lat, data.lng, data.address);
    if (customerCoords) {
      const { isInsideServiceArea, SERVICE_AREA } = await import("./location.server");
      if (!isInsideServiceArea(customerCoords.lat, customerCoords.lng))
        throw new Error(`This address is outside our service area (${SERVICE_AREA.name} + ${SERVICE_AREA.radiusKm} km). Please call us for options.`);
    }
    const coords = customerCoords ?? {};
    if (data.kind === "project") {
      const { data: p, error } = await db.from("projects").insert({ title: data.title ?? "Project request", customer_name: data.name, phone: data.phone, email: data.email, address: data.address, description: data.description, status: "site_visit_requested", ...coords }).select("ref").single();
      if (error) throw new Error("Your request could not be saved. Please try again.");
      if (data.email) {
        const { sendEmail, projectRequestEmail } = await import("./email.server");
        const mail = projectRequestEmail({ name: data.name, title: data.title ?? "Project request", ref: p.ref });
        await sendEmail(data.email, mail.subject, mail.html).catch(() => null);
      }
      return { type: "project" as const, ref: p.ref, accessToken: null, scheduledAt: null, eta: null };
    }
    if (data.kind === "emergency") {
      const eta = new Date(Math.ceil((now.getTime() + 35 * 60000) / 300000) * 300000);
      const { data: j, error } = await db.from("jobs").insert({ customer_name: data.name, phone: data.phone, email: data.email, address: data.address, zone, title: data.title ?? "Emergency leak", description: data.description, status: "new", urgency: "Emergency", is_emergency: true, confidence: data.confidence ?? 0, duration_min: data.duration_min ?? 90, value: data.price_high ?? 0, access_status: data.accessChoice ?? null, scheduled_at: eta.toISOString(), photo_path: data.photoPath, ...coords }).select("ref,access_token").single();
      if (error) throw new Error("Your emergency request could not be saved. Please call us directly.");
      if (data.email) {
        const { sendEmail, emergencyConfirmationEmail, bookingUrl } = await import("./email.server");
        const etaStr = `${new Date(eta).toLocaleTimeString("en-GB", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" })} – ${new Date(eta.getTime() + 25 * 60000).toLocaleTimeString("en-GB", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" })}`;
        const mail = emergencyConfirmationEmail({ name: data.name, title: data.title ?? "Emergency leak", eta: etaStr, ref: j.ref, accessUrl: bookingUrl(j.access_token) });
        await sendEmail(data.email, mail.subject, mail.html).catch(() => null);
      }
      return { type: "emergency" as const, ref: j.ref, accessToken: j.access_token, scheduledAt: eta.toISOString(), eta: { from: eta.toISOString(), to: new Date(eta.getTime() + 25 * 60000).toISOString() } };
    }
    const confidence = data.confidence ?? 0;
    const lowConfidence = confidence < 60 || !data.slotStart;
    if (data.slotStart) {
      const scheduledDate = new Date(data.slotStart);
      if (!isNaN(scheduledDate.getTime())) {
        data.slotStart = scheduledDate.toISOString();
      }
      // Backend revalidation: the slot must still be feasible at submit time — route-aware when the
      // customer location is known (pinned or geocoded), calendar-gap based otherwise — not only
      // when it was first listed.
      const re = await slotsFor(data.duration_min ?? 60, zone, customerCoords);
      if (!re.routeUnavailable && !re.feasible.has(data.slotStart)) {
        throw new Error("That time is no longer available. Please choose another time.");
      }
      if (await slotTaken(db, data.slotStart, data.duration_min ?? 60)) {
        throw new Error("That time is already booked. Please choose another time.");
      }
    }
    const ready = Boolean(data.accessChoice && data.accessChoice !== "I need to arrange access");
    const initialStatus = lowConfidence ? "needs_assessment" : (ready ? "access_confirmed" : "confirmed");
    const { data: j, error } = await db.from("jobs").insert({ customer_name: data.name, phone: data.phone, email: data.email, address: data.address, zone, title: data.title ?? "Plumbing request", description: data.description, status: initialStatus, access_status: data.accessChoice ?? null, urgency: data.urgency ?? "Normal", confidence, duration_min: data.duration_min ?? 60, value: data.price_high ?? 0, missing_fields: data.missing_fields ?? [], scheduled_at: lowConfidence ? null : data.slotStart, photo_path: data.photoPath, ...coords }).select("ref,access_token,scheduled_at").single();
    if (error) throw new Error("Your booking hasn't been confirmed. Please try again.");
    if (j.scheduled_at) {
      const { data: row } = await db.from("jobs").select("id").eq("access_token", j.access_token).single();
      if (row && (await conflictAfterInsert(db, row.id, j.scheduled_at, data.duration_min ?? 60))) {
        await db.from("jobs").delete().eq("id", row.id);
        throw new Error("That time was just taken. Please choose another time.");
      }
    }
    if (data.email) {
      const { sendEmail, bookingConfirmationEmail, bookingUrl } = await import("./email.server");
      const when = j.scheduled_at ? new Date(j.scheduled_at).toLocaleString("en-GB", { timeZone: "Europe/Stockholm", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : null;
      const mail = bookingConfirmationEmail({ name: data.name, title: data.title ?? "Plumbing request", when, ref: j.ref, accessUrl: bookingUrl(j.access_token) });
      await sendEmail(data.email, mail.subject, mail.html).catch(() => null);
    }
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
    const { data: pos } = await db.from("jobs").select("lat,lng,address").eq("access_token", data.token).maybeSingle();
    const j = job as unknown as { id: string; duration_min: number; zone: string };
    const r = await slotsFor(j.duration_min, j.zone, await resolveCoords(pos?.lat, pos?.lng, pos?.address ?? undefined), j.id);
    return { job, groups: r.groups, routeUnavailable: r.routeUnavailable };
  });

export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => token.extend({ slotStart: z.string().datetime() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: job } = await db.from("jobs").select("id,duration_min,zone,status,lat,lng,scheduled_at,address").eq("access_token", data.token).maybeSingle();
    if (!job || !["confirmed", "access_confirmed"].includes(job.status)) throw new Error("This appointment can no longer be rescheduled.");
    const r = await slotsFor(job.duration_min, job.zone, await resolveCoords(job.lat, job.lng, job.address), job.id);
    if (!r.feasible.has(data.slotStart)) throw new Error("That time is no longer available.");
    await db.from("jobs").update({ scheduled_at: data.slotStart, status: "confirmed", access_status: null }).eq("id", job.id);
    // Final guard against a concurrent booking that slipped in: roll back to the original time.
    if (await slotTaken(db, data.slotStart, job.duration_min, job.id)) {
      await db.from("jobs").update({ scheduled_at: job.scheduled_at ?? null }).eq("id", job.id);
      throw new Error("That time was just taken. Please choose another time.");
    }
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
  .inputValidator((d) => token.extend({ accept: z.boolean(), address: z.string().trim().max(200).optional(), lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { db, now } = await context();
    await expireOffers(db, now);
    const { data: offer } = await db.from("offers").select("*,waitlist_entries(*)").eq("token", data.token).maybeSingle();
    if (!offer || offer.status !== "pending" || !offer.waitlist_entries) throw new Error(offer?.status === "expired" ? "This offer has expired." : "This offer is no longer available.");
    const w = offer.waitlist_entries as unknown as { id: string; customer_name: string; phone: string; email: string; title: string; zone: string; urgency: string; value: number };
    if (!data.accept) {
      await db.from("offers").update({ status: "declined" }).eq("id", offer.id);
      await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", w.id);
      if (offer.source_job_id) {
        const { cascadeWaitlistOffer } = await import("./owner.functions");
        await cascadeWaitlistOffer(db, offer.source_job_id, now, 30).catch((e) => console.warn("Cascade failed:", e));
      } else {
        // Declined direct proposal: the same owner-chosen time goes to the next candidate.
        const { cascadeDirectOffer } = await import("./owner.functions");
        await cascadeDirectOffer(db, offer, now).catch((e) => console.warn("Direct cascade failed:", e));
      }
      return { status: "declined" as const, accessToken: null };
    }
    // Mats needs to know exactly where to go: the recovered booking must carry an address.
    const address = (data.address ?? "").trim();
    if (address.length < 4) throw new Error("Please add your address so Mats knows where to go.");
    const coords = await resolveCoords(data.lat, data.lng, address);
    if (coords) {
      const { isInsideServiceArea, SERVICE_AREA } = await import("./location.server");
      if (!isInsideServiceArea(coords.lat, coords.lng))
        throw new Error(`This address is outside our service area (${SERVICE_AREA.name} + ${SERVICE_AREA.radiusKm} km). Please call us for options.`);
    }
    // The freed slot must still be free: the owner may have re-booked that time after the offer went out.
    if (await slotTaken(db, offer.slot_start, offer.duration_min)) {
      await db.from("offers").update({ status: "expired" }).eq("id", offer.id).eq("status", "pending");
      await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", w.id);
      throw new Error("That time was just booked by someone else. You keep your waitlist priority.");
    }
    const { data: claimed } = await db.from("offers").update({ status: "accepted" }).eq("id", offer.id).eq("status", "pending").select("id").maybeSingle();
    if (!claimed) throw new Error("This offer is no longer available.");
    // Recover the freed slot in place: the cancelled booking itself becomes the new confirmed appointment,
    // with a fresh access token so the previous customer's portal link stops working.
    const recovery = {
      customer_name: w.customer_name, phone: w.phone, email: w.email || "", title: w.title || "Plumbing request",
      description: "Recovered from waitlist offer.", status: "confirmed" as const, urgency: w.urgency || "Normal",
      confidence: 100, duration_min: offer.duration_min, value: w.value || 0, zone: w.zone || "",
      address, lat: coords?.lat ?? null, lng: coords?.lng ?? null, photo_path: null, access_status: null, missing_fields: [] as string[],
      is_emergency: false, access_token: crypto.randomUUID().replaceAll("-", ""),
    };
    const recoveryFields = Object.keys(recovery).join(",");
    type JobUpdate = import("@/integrations/supabase/types").TablesUpdate<"jobs">;
    const sourceId = offer.source_job_id;
    let job: { id: string; ref: string; access_token: string } | null = null;
    let snapshot: JobUpdate | null = null;
    if (sourceId) {
      const { data: src } = await db.from("jobs").select(recoveryFields).eq("id", sourceId).single();
      if (src) snapshot = src as JobUpdate;
    }
    if (snapshot && sourceId) {
      const { data: updated, error: updErr } = await db.from("jobs").update(recovery).eq("id", sourceId).select("id,ref,access_token").single();
      if (!updErr && updated) job = updated;
    }
    if (!job) {
      // Fallback when the original booking row is gone (e.g. deleted source job).
      const { data: inserted, error: insErr } = await db.from("jobs").insert({ ...recovery, scheduled_at: offer.slot_start }).select("id,ref,access_token").single();
      if (insErr || !inserted) {
        await db.from("offers").update({ status: "expired" }).eq("id", offer.id);
        await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", w.id);
        throw new Error("Could not secure the booking. Please try again.");
      }
      job = inserted;
    }
    // Final race guard: if another booking slipped into the slot after the pre-check, roll the recovery back.
    if (await slotTaken(db, offer.slot_start, offer.duration_min, job.id)) {
      if (snapshot) await db.from("jobs").update(snapshot).eq("id", job.id);
      else await db.from("jobs").delete().eq("id", job.id);
      await db.from("offers").update({ status: "expired" }).eq("id", offer.id);
      await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", w.id);
      throw new Error("That time was just taken. You keep your waitlist priority.");
    }
    await db.from("waitlist_entries").update({ status: "booked" }).eq("id", w.id);
    if (w.email) {
      const { sendEmail, bookingConfirmationEmail, bookingUrl } = await import("./email.server");
      const when = new Date(offer.slot_start).toLocaleString("en-GB", { timeZone: "Europe/Stockholm", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      const mail = bookingConfirmationEmail({ name: w.customer_name, title: w.title || "Plumbing Service", when, ref: job.ref, accessUrl: bookingUrl(job.access_token) });
      await sendEmail(w.email, mail.subject, mail.html).catch(() => null);
    }
    return { status: "accepted" as const, accessToken: job.access_token };
  });

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(80),
      phone: z.string().max(40).optional(),
      email: z.string().email(),
      address: z.string().min(1).max(200),
      title: z.string().max(120).optional(),
      duration_min: z.number().int().min(15).max(480).optional(),
      urgency: z.string().optional(),
      flexibility: z.string().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const { db } = await context();
    // Waitlist candidates are offered recovered slots near them: a pinned address must be in the service area.
    if (data.lat != null && data.lng != null) {
      const { isInsideServiceArea, SERVICE_AREA } = await import("./location.server");
      if (!isInsideServiceArea(data.lat, data.lng))
        throw new Error(`This address is outside our service area (${SERVICE_AREA.name} + ${SERVICE_AREA.radiusKm} km). Please call us for options.`);
    }
    const zone = zoneFromAddress(data.address);
    const { data: entry, error } = await db.from("waitlist_entries").insert({
      customer_name: data.name,
      phone: data.phone || "",
      email: data.email,
      title: data.title || "Plumbing request",
      zone,
      duration_min: data.duration_min || 60,
      urgency: data.urgency || "Normal",
      flexibility: data.flexibility || "Flexible",
      status: "waiting",
      value: 1800,
    }).select("id").single();
    if (error) throw new Error("Could not join waitlist. Please try again.");

    if (data.email) {
      const { sendEmail, layout } = await import("./email.server");
      const content = `
        <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${data.name}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #475569;">
          You are now registered on the <strong>Ekström VVS Priority Waitlist</strong> for:
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 0 0 18px 0;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #166534; font-family: monospace; text-transform: uppercase;">Service Request</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #15803d;">${data.title || "Plumbing service"}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #166534;">Zone: ${zone} · Address: ${data.address}</p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 0 0 14px 0; font-size: 13px; color: #475569;">
          <strong>⚡ How priority recovery works:</strong>
          <p style="margin: 6px 0 0 0; line-height: 1.5;">
            Whenever another customer cancels or reschedules on Mats's route near you, our system instantly selects the best match and sends an exclusive <strong>30-minute priority booking link</strong> straight to your email.
          </p>
        </div>
        <p style="margin: 0 0 18px 0; font-size: 13px; color: #475569; background-color: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 12px 14px;">
          <strong>No action is needed right now.</strong> This email is your registration receipt — your personal <strong>confirm button</strong> arrives in the priority offer email the moment a slot opens for you.
        </p>
      `;
      const mailHtml = layout("Priority Waitlist Confirmation", content, "Ekström VVS • Priority Waitlist");
      await sendEmail(data.email, `✓ Registered on Priority Waitlist · Ekström VVS`, mailHtml).catch(() => null);
    }
    return { ok: true, id: entry.id };
  });

