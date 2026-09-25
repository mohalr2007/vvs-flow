export type JobStatus =
  | "new" | "qualified" | "held" | "confirmed" | "access_confirmed"
  | "in_progress" | "completed" | "cancelled" | "expired" | "waitlisted"
  | "needs_assessment";

export type ProjectStatus =
  | "project_request" | "site_visit_requested" | "site_visit_scheduled"
  | "owner_review" | "project_approved" | "scheduled" | "in_progress" | "completed";

export type Job = {
  id: string; customer: string; title: string; time: string; duration: string;
  zone: string; status: JobStatus; urgency: "Low" | "Normal" | "High" | "Emergency";
  confidence: number; value: number; description: string;
};

export type WaitlistMatch = {
  id: string; customer: string; title: string; zone: string; score: number;
  flexibility: string; breakdown: { label: string; points: number }[];
};

export const jobs: Job[] = [
  { id: "JOB-2048", customer: "Anna Lindberg", title: "Kitchen sink leak", time: "08:30", duration: "60–120 min", zone: "723", status: "confirmed", urgency: "High", confidence: 94, value: 2450, description: "Water collecting under the kitchen cabinet when the tap is used." },
  { id: "JOB-2049", customer: "Erik Sjöberg", title: "Faucet repair", time: "10:30", duration: "60 min", zone: "724", status: "access_confirmed", urgency: "Normal", confidence: 91, value: 1750, description: "Bathroom tap drips continuously and the handle feels loose." },
  { id: "JOB-2050", customer: "Sara Nilsson", title: "Boiler service", time: "13:00", duration: "90 min", zone: "726", status: "held", urgency: "Normal", confidence: 88, value: 3200, description: "Annual boiler inspection and pressure check." },
  { id: "JOB-2051", customer: "Oskar Berg", title: "Unknown pressure noise", time: "New", duration: "Set duration", zone: "722", status: "needs_assessment", urgency: "Normal", confidence: 42, value: 0, description: "A pulsing sound comes from the wall whenever the upstairs shower is running." },
];

export const waitlist: WaitlistMatch[] = [
  { id: "W-11", customer: "Anna Lindberg", title: "Kitchen leak", zone: "723", score: 92, flexibility: "Flexible", breakdown: [{ label: "Same zone", points: 40 }, { label: "Duration fits", points: 30 }, { label: "Flexibility", points: 15 }, { label: "Waiting duration", points: 5 }, { label: "Urgency", points: 2 }] },
  { id: "W-12", customer: "Erik Holm", title: "Toilet repair", zone: "724", score: 86, flexibility: "After 12:00", breakdown: [{ label: "Nearby zone", points: 34 }, { label: "Duration fits", points: 30 }, { label: "Flexibility", points: 12 }, { label: "Waiting duration", points: 7 }, { label: "Urgency", points: 3 }] },
  { id: "W-13", customer: "Sara Ek", title: "Faucet repair", zone: "726", score: 71, flexibility: "Any weekday", breakdown: [{ label: "Travel fit", points: 24 }, { label: "Duration fits", points: 28 }, { label: "Flexibility", points: 12 }, { label: "Waiting duration", points: 5 }, { label: "Urgency", points: 2 }] },
];

export const projects = [
  { id: "P-301", title: "Bathroom renovation", customer: "Familjen Åberg", status: "site_visit_requested" as ProjectStatus, budget: "80–120k SEK" },
  { id: "P-302", title: "Kitchen installation", customer: "Maria Wallin", status: "owner_review" as ProjectStatus, budget: "35–50k SEK" },
  { id: "P-303", title: "Boiler replacement", customer: "BRF Eken", status: "project_approved" as ProjectStatus, budget: "145k SEK" },
];

export const leads = [
  { name: "Linn Persson", work: "Outdoor tap", stage: "New", value: "2,200 SEK" },
  { name: "BRF Solrosen", work: "Pipe inspection", stage: "Qualified", value: "18,000 SEK" },
  { name: "David Lund", work: "Shower mixer", stage: "Held", value: "3,400 SEK" },
  { name: "Elin Fors", work: "Radiator noise", stage: "Abandoned", value: "2,800 SEK" },
];

export const schedule = [
  { time: "08:30", title: "Kitchen leak", customer: "Anna Lindberg", status: "Confirmed", tone: "success" },
  { time: "10:30", title: "Faucet repair", customer: "Erik Sjöberg", status: "Access confirmed", tone: "success" },
  { time: "12:15", title: "Travel buffer", customer: "Skiljebo → Haga", status: "25 min", tone: "muted" },
  { time: "13:00", title: "Boiler service", customer: "Sara Nilsson", status: "Needs access", tone: "warning" },
  { time: "15:30", title: "Emergency buffer", customer: "Reserved capacity", status: "Available", tone: "info" },
];
