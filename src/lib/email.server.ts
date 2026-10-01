// Server-only email sending via Resend.
// Supports both direct Resend API (standard on Vercel/production) and Lovable connector gateway.
// Never import this file from client code.

export function getAppUrl(): string {
  const envUrl = process.env["APP_URL"] || process.env["PUBLIC_APP_URL"];
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  const vercelProd = process.env["VERCEL_PROJECT_PRODUCTION_URL"];
  if (vercelProd) {
    return `https://${vercelProd.replace(/\/$/, "")}`;
  }
  const vercelUrl = process.env["VERCEL_URL"];
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }
  // Published site: always reachable by customers (the editor preview domain returns a proxy error).
  return "https://pro-flow-ops.lovable.app";
}

export function getFromEmail(): string {
  return (
    process.env["RESEND_FROM_EMAIL"] ||
    process.env["FROM_EMAIL"] ||
    "Ekström VVS <onboarding@resend.dev>"
  );
}

// Public base URL used in email links (booking/offer pages).
export const bookingUrl = (token: string) => `${getAppUrl()}/access/${token}`;
export const offerUrl = (token: string) => `${getAppUrl()}/offer/${token}`;

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ sent: boolean; reason?: string }> {
  // 1. EmailJS support (100% free, no domain needed, works directly with Gmail)
  const emailjsServiceId = process.env["EMAILJS_SERVICE_ID"];
  const emailjsTemplateId = process.env["EMAILJS_TEMPLATE_ID"];
  const emailjsPublicKey = process.env["EMAILJS_PUBLIC_KEY"];
  const emailjsPrivateKey = process.env["EMAILJS_PRIVATE_KEY"];
  let emailjsReason: string | null = null;

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey && emailjsPrivateKey) {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          accessToken: emailjsPrivateKey,
          template_params: {
            to_email: to,
            recipient: to,
            email: to,
            to: to,
            subject: subject,
            title: subject,
            email_subject: subject,
            // Body aliases: whichever variable the EmailJS template references
            // ({{{html_message}}}, {{content}}, {{body}}…) always carries the HTML.
            message: html,
            html_message: html,
            html: html,
            content: html,
            body: html,
            html_content: html,
            email_html: html,
            company_name: "Ekström VVS",
            app_url: getAppUrl(),
          },
        }),
      });

      if (res.ok) {
        return { sent: true };
      }
      const errText = await res.text();
      emailjsReason = `EmailJS error: ${errText}`;
      console.warn(emailjsReason);
      if (!process.env["RESEND_API_KEY"]) {
        return { sent: false, reason: emailjsReason };
      }
    } catch (err) {
      emailjsReason = `EmailJS error: ${err instanceof Error ? err.message : "network error"}`;
      console.warn("EmailJS exception:", err);
      if (!process.env["RESEND_API_KEY"]) {
        return { sent: false, reason: emailjsReason };
      }
    }
  } else {
    emailjsReason = "EmailJS is not configured (missing EMAILJS_* environment variables).";
  }

  // 2. Resend API support
  const resendKey = process.env["RESEND_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  if (resendKey) {
    const from = getFromEmail();
    try {
      if (lovableKey) {
        try {
          const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": resendKey,
            },
            body: JSON.stringify({ from, to: [to], subject, html }),
          });
          if (res.ok) return { sent: true };
        } catch {}
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });

      if (res.ok) {
        return { sent: true };
      }
      const body = await res.text();
      const reason = [emailjsReason, `Resend error ${res.status}: ${body}`].filter(Boolean).join(" | ");
      console.error(`sendEmail failed: ${reason}`);
      return { sent: false, reason };
    } catch (err) {
      const reason = [emailjsReason, `Resend error: ${err instanceof Error ? err.message : "unknown"}`].filter(Boolean).join(" | ");
      console.error(`sendEmail failed: ${reason}`);
      return { sent: false, reason };
    }
  }

  console.error(`sendEmail failed: ${emailjsReason}`);
  return { sent: false, reason: emailjsReason ?? "No email engine is configured." };
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function layout(title: string, body: string, subtitle?: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background-color: #0b1a28; padding: 24px 28px; border-bottom: 3px solid #0891b2;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.03em;">
                EKSTRÖM <span style="color: #22d3ee;">VVS</span>
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em;">
                Certified Plumbing & Heating • Västerås
              </p>
            </td>
            <td align="right">
              <span style="display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; background-color: rgba(8,145,178,0.2); color: #22d3ee; border: 1px solid rgba(8,145,178,0.4); border-radius: 16px;">
                Official Notification
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 28px 28px 20px 28px;">
        <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #0f172a; font-weight: 600;">
          ${esc(title)}
        </h2>
        ${subtitle ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">${esc(subtitle)}</p>` : ''}
        <div style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${body}
        </div>
      </td>
    </tr>

    <!-- Support -->
    <tr>
      <td style="padding: 0 28px 24px 28px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px;">
          <tr>
            <td style="font-size: 12px; color: #64748b; line-height: 1.5;">
              <strong style="color: #0f172a;">Questions or urgent help?</strong><br>
              24/7 emergency line: <strong style="color: #0891b2;">021-123 456</strong> · Reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">
          Ekström VVS AB · Kopparlunden, 721 30 Västerås, Sweden
        </p>
        <p style="margin: 0;">
          Certified plumbing &amp; heating service. This message was automatically generated by the VVS Flow booking system.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function button(href: string, label: string) {
  return `<table border="0" cellspacing="0" cellpadding="0" style="margin: 22px 0 10px 0;">
    <tr>
      <td align="center" style="border-radius: 8px; background-color: #0891b2;">
        <a href="${href}" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; letter-spacing: 0.02em;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── BOOKING CONFIRMATION ────────────────────────────────────────────────────
export function bookingConfirmationEmail(p: {
  name: string;
  title: string;
  when: string | null;
  ref: string;
  accessUrl: string | null;
}) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      Thank you for choosing <strong>Ekström VVS</strong>. Your service appointment has been confirmed and registered in our dispatch system.
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 35%;">Service:</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${esc(p.title)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">Scheduled Time:</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0891b2;">${p.when ? esc(p.when) : 'We will contact you shortly to confirm exact timing'}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">Booking Reference:</td>
        <td style="padding: 12px 16px; font-size: 13px; font-family: monospace; font-weight: 600; color: #0f172a;">${esc(p.ref)}</td>
      </tr>
    </table>

    <p style="margin: 0 0 6px 0; color: #475569; font-size: 13px;">
      You can track technician status, update property access instructions, or make changes anytime through your personal portal:
    </p>
    ${p.accessUrl ? button(p.accessUrl, "View & Manage My Booking") : ""}
  `;

  return {
    subject: `Booking Confirmed — ${p.ref}: ${p.title} · Ekström VVS`,
    html: layout("Booking Confirmation", content, `Reference: ${p.ref}`),
  };
}

// ─── EMERGENCY REQUEST CONFIRMATION ──────────────────────────────────────────
export function emergencyConfirmationEmail(p: {
  name: string;
  title: string;
  eta: string;
  ref: string;
  accessUrl: string | null;
}) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${esc(p.name)}</strong>,</p>
    <div style="background-color: #fef2f2; border: 2px solid #f87171; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #991b1b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">🚨 Emergency Request Received</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #7f1d1d;">
        Mats has received your urgent request and is being dispatched as fast as possible.
      </p>
      <div style="background-color: #ffffff; border-radius: 6px; padding: 12px; border: 1px solid #fca5a5;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-family: monospace;">Estimated Arrival Window</p>
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">${esc(p.eta)}</p>
      </div>
    </div>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 35%;">Issue:</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${esc(p.title)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-size: 12px; color: #64748b;">Emergency Reference:</td>
        <td style="padding: 10px 16px; font-size: 13px; font-family: monospace; font-weight: 700; color: #dc2626;">${esc(p.ref)}</td>
      </tr>
    </table>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 0 0 16px 0; font-size: 12px; color: #92400e;">
      <strong>⚠️ Safety reminder while waiting:</strong>
      <ul style="margin: 6px 0 0 0; padding-left: 20px;">
        <li>Turn off the main water shutoff valve if accessible.</li>
        <li>Stay away from wet electrical outlets.</li>
        <li>Move valuables away from water flow.</li>
      </ul>
    </div>

    ${p.accessUrl ? button(p.accessUrl, "Track Emergency Status") : ""}
  `;

  return {
    subject: `🚨 Emergency Received (${p.ref}) — Estimated arrival ${p.eta} · Ekström VVS`,
    html: layout("Urgent Dispatch Confirmation", content, `Ref: ${p.ref}`),
  };
}

// ─── PROJECT / NEW INSTALLATION REQUEST ──────────────────────────────────────
export function projectRequestEmail(p: {
  name: string;
  title: string;
  ref: string;
}) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      Thank you for contacting <strong>Ekström VVS</strong> regarding your upcoming installation project. We have successfully registered your request.
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 20px 0;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 35%;">Project:</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${esc(p.title)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">Request Reference:</td>
        <td style="padding: 12px 16px; font-size: 13px; font-family: monospace; font-weight: 600; color: #0891b2;">${esc(p.ref)}</td>
      </tr>
    </table>

    <p style="margin: 0 0 10px 0; color: #475569; font-size: 13px;">
      Mats will personally review your specifications and contact you to schedule a free on-site visit and provide a detailed estimate.
    </p>
  `;

  return {
    subject: `Project Request Received — ${p.ref}: ${p.title} · Ekström VVS`,
    html: layout("Project Request Received", content, `Reference: ${p.ref}`),
  };
}

// ─── WAITLIST SLOT OFFER (cancellation recovery) ─────────────────────────────
export function offerEmail(p: {
  name: string;
  title: string;
  when: string;
  offerUrl: string;
  minutes?: number;
  deadline?: string;
}) {
  const mins = p.minutes ?? 30;
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      Good news — <strong>Mats has found a free time for your job</strong>. A slot just opened in his schedule and you are first in line on the waitlist.
    </p>

    <div style="background-color: #ecfeff; border: 1px solid #a5f3fc; border-radius: 10px; padding: 18px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #0e7490; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Proposed date &amp; time</p>
      <p style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #0f172a;">${esc(p.when)}</p>
      <p style="margin: 0; font-size: 13px; color: #155e75;">Job: <strong>${esc(p.title)}</strong></p>
    </div>

    <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0f172a; text-align: center;">Do you confirm this appointment?</p>
    <p style="margin: 0 0 4px 0; font-size: 13px; color: #475569; text-align: center;">
      Please confirm within <strong>${mins} minutes</strong>${p.deadline ? ` (before <strong>${esc(p.deadline)}</strong>)` : ""}.
    </p>

    ${button(p.offerUrl, "Yes, confirm my appointment")}

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin: 18px 0 0 0; font-size: 13px; color: #92400e;">
      If you don't confirm in time, this slot is automatically offered to the next person on the waitlist. You keep your place for future openings.
    </div>

    <p style="margin: 14px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
      Button not working? Copy this link into your browser:<br>
      <a href="${esc(p.offerUrl)}" style="color: #0891b2; word-break: break-all;">${esc(p.offerUrl)}</a>
    </p>
  `;

  return {
    subject: `Mats found a time for you: ${p.when} — please confirm within ${mins} min`,
    html: layout("Please confirm your appointment", content, `Confirm within ${mins} minutes`),
  };
}

// ─── 24H REMINDER ────────────────────────────────────────────────────────────
export function reminder24hEmail(p: {
  name: string;
  title: string;
  when: string;
  ref: string;
  accessUrl: string | null;
}) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      This is a friendly reminder that your certified plumbing appointment is scheduled for <strong>tomorrow</strong>. Please make sure you or someone authorized will be available at the property.
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 35%;">Service:</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${esc(p.title)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">Scheduled Time:</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 15px; font-weight: 700; color: #0891b2;">${esc(p.when)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">Reference:</td>
        <td style="padding: 12px 16px; font-size: 13px; font-family: monospace; font-weight: 600; color: #0f172a;">${esc(p.ref)}</td>
      </tr>
    </table>

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin: 0 0 18px 0; font-size: 13px; color: #1e40af;">
      📋 <strong>Preparation:</strong> Please ensure our technician has easy access to the work area, main water shutoff, or heating system.
    </div>

    ${p.accessUrl ? button(p.accessUrl, "Confirm & View Booking Details") : ""}
  `;

  return {
    subject: `🔔 Reminder — Appointment Tomorrow at ${p.when} (${p.ref})`,
    html: layout("Appointment Reminder — Tomorrow", content, `24 hours remaining · Reference: ${p.ref}`),
  };
}

// ─── 1H REMINDER ─────────────────────────────────────────────────────────────
export function reminder1hEmail(p: {
  name: string;
  title: string;
  when: string;
  ref: string;
  accessUrl: string | null;
}) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hello <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      Your certified plumbing technician is scheduled to arrive at your address in approximately <strong>1 hour</strong>.
    </p>

    <div style="background-color: #0b1a28; border-radius: 10px; padding: 20px 24px; margin: 0 0 20px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em;">Estimated arrival today:</p>
      <p style="margin: 0; font-size: 26px; font-weight: 700; color: #22d3ee; letter-spacing: 0.02em;">${esc(p.when)}</p>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">${esc(p.title)}</p>
    </div>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 18px 0; overflow: hidden;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 40%;">Booking Reference:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-family: monospace; font-weight: 600; color: #0f172a;">${esc(p.ref)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; color: #64748b;">Direct Dispatch:</td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a;">Ekström VVS · 021-123 456</td>
      </tr>
    </table>

    ${p.accessUrl ? button(p.accessUrl, "View Live Booking Portal") : ""}
  `;

  return {
    subject: `🚐 Technician Arriving in 1 Hour — ${p.when} (${p.ref})`,
    html: layout("Your Technician Is On The Way", content, `1 hour remaining · Reference: ${p.ref}`),
  };
}

