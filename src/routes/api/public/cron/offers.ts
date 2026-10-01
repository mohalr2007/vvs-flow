// Called every minute by the scheduler: expires unanswered waitlist offers and
// passes the slot to the next waitlist candidate, without anyone opening the app.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/offers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { cascadeWaitlistOffer } = await import("@/lib/owner.functions");
        const { data: s } = await db.from("settings").select("clock_offset_minutes").eq("id", 1).maybeSingle();
        const now = new Date(Date.now() + (s?.clock_offset_minutes ?? 0) * 60000);
        const { data } = await db.from("offers").select("id,waitlist_id,source_job_id").eq("status", "pending").lt("expires_at", now.toISOString());
        let cascaded = 0;
        for (const o of data ?? []) {
          const { data: upd } = await db.from("offers").update({ status: "expired" }).eq("id", o.id).eq("status", "pending").select("id");
          if (!upd?.length) continue;
          await db.from("waitlist_entries").update({ status: "waiting" }).eq("id", o.waitlist_id);
          if (o.source_job_id && (await cascadeWaitlistOffer(db as never, o.source_job_id, now, 30).catch(() => false))) cascaded++;
        }
        return Response.json({ expired: data?.length ?? 0, cascaded });
      },
    },
  },
});
