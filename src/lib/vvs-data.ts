// Central typed business entities for VVS Flow. Shapes mirror the database schema.
import type { Tables, Enums } from "@/integrations/supabase/types";

export type JobStatus = Enums<"job_status">;
export type ProjectStatus = Enums<"project_status">;
export type Job = Tables<"jobs">;
export type Project = Tables<"projects">;
export type Lead = Tables<"leads">;
export type WaitlistEntry = Tables<"waitlist_entries">;
export type Offer = Tables<"offers">;
export type RotRecord = Tables<"rot_records">;
export type Settings = Tables<"settings">;
export type SlotGroup = { day: string; slots: { start: string; travel: string }[] };

export const statusLabel = (s: string) => s.replaceAll("_", " ");
export const statusTone = (s: string): "neutral" | "success" | "warning" | "danger" | "info" =>
  s === "confirmed" || s === "access_confirmed" || s === "completed" ? "success"
  : s === "needs_assessment" || s === "held" || s === "new" ? "warning"
  : s === "cancelled" || s === "expired" ? "danger"
  : s === "qualified" || s === "in_progress" ? "info" : "neutral";

export const PROJECT_STEPS: ProjectStatus[] = ["project_request", "site_visit_requested", "site_visit_scheduled", "owner_review", "project_approved", "scheduled", "in_progress", "completed"];
export const ACCESS_OPTIONS = ["Yes, I'll be home", "Key with neighbor", "Door code available", "I need to arrange access"] as const;
