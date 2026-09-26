// Backend-agnostic service layer. UI code imports from here; implementations are
// server functions backed by Lovable Cloud and can be swapped without UI changes.
import * as pub from "./public.functions";
import * as own from "./owner.functions";

export const bookingService = { understand: pub.understandRequest, slots: pub.getAvailableSlots, create: pub.createBooking, byToken: pub.getBookingByToken, confirmAccess: pub.confirmAccess, rescheduleOptions: pub.getRescheduleOptions, reschedule: pub.rescheduleBooking };
export const offerService = { get: pub.getOffer, respond: pub.respondOffer };
export const fileService = { createUpload: pub.createPhotoUpload };
export const aiService = { understand: pub.understandRequest, inbox: own.understandInbox };
export const ownerService = { status: own.getOwnerStatus, claim: own.claimOwnership, overview: own.getOverview, settings: own.getSettings, saveSettings: own.saveSettings, reset: own.resetDemo, advance: own.advanceClock };
export const jobService = { list: own.listJobs, get: own.getJob, save: own.saveJob, approve: own.approveJob, schedule: own.scheduleJob, setStatus: own.setJobStatus, calendar: own.getCalendar, fromInbox: own.createJobFromInbox };
export const waitlistService = { get: own.getWaitlist, match: own.findMatches, sendOffer: own.sendOffer };
export const leadService = { list: own.listLeads, setStage: own.setLeadStage };
export const projectService = { list: own.listProjects, advance: own.advanceProject };
export const rotService = { list: own.listRot, setStatus: own.setRotStatus };
