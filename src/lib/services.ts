// Backend-agnostic service layer. UI code imports from here; implementations are
// server functions backed by Lovable Cloud and can be swapped without UI changes.
import * as pub from "./public.functions";
import * as own from "./owner.functions";

export const bookingService = { understand: pub.understandRequest, slots: pub.getAvailableSlots, create: pub.createBooking, byToken: pub.getBookingByToken, confirmAccess: pub.confirmAccess, rescheduleOptions: pub.getRescheduleOptions, reschedule: pub.rescheduleBooking, joinWaitlist: pub.joinWaitlist };
export const offerService = { get: pub.getOffer, respond: pub.respondOffer };
export const fileService = { createUpload: pub.createPhotoUpload };
export const aiService = { understand: pub.understandRequest, inbox: own.understandInbox };
export const ownerService = { status: own.getOwnerStatus, claim: own.claimOwnership, overview: own.getOverview, settings: own.getSettings, saveSettings: own.saveSettings, reset: own.resetDemo, clearAppointments: own.clearAppointments, advance: own.advanceClock, testEmail: own.testEmail, demoLogin: own.demoOwnerLogin };
export const jobService = { list: own.listJobs, get: own.getJob, save: own.saveJob, approve: own.approveJob, schedule: own.scheduleJob, setStatus: own.setJobStatus, calendar: own.getCalendar, fromInbox: own.createJobFromInbox };
export const waitlistService = { get: own.getWaitlist, match: own.findMatches, sendOffer: own.sendOffer };
export const leadService = { list: own.listLeads, setStage: own.setLeadStage };
export const projectService = { list: own.listProjects, advance: own.advanceProject, get: own.getProject, plan: own.planProject, extend: own.extendProject, toggleRestDay: own.toggleRestDay, resetPlan: own.resetProjectPlan, saveQuote: own.saveProjectQuote, updateTask: own.updateProjectTask, setStatus: own.setProjectStatus };
export const rotService = { list: own.listRot, setStatus: own.setRotStatus };
