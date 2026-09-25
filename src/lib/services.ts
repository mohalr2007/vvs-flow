import { jobs, leads, projects, waitlist } from "./vvs-data";

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

export const bookingService = {
  async understandRequest(message: string) {
    await delay();
    return { title: message.toLowerCase().includes("toilet") ? "Toilet leak" : "Kitchen sink leak", urgency: "High", duration: "60–120 min" };
  },
  async findEmergencyAvailability() { await delay(); return { eta: "14:20–14:45", note: "Based on current workload and travel zone." }; },
};
export const jobService = { async list() { await delay(); return jobs; } };
export const waitlistService = { async list() { await delay(); return waitlist; } };
export const leadService = { async list() { await delay(); return leads; } };
export const projectService = { async list() { await delay(); return projects; } };
export const fileService = { async prepareUpload(file: File) { await delay(200); return { name: file.name, status: "demo-only" as const }; } };
export const aiService = { async extract(message: string) { return bookingService.understandRequest(message); } };
