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
  return "https://id-preview--b9506bcd-256a-4188-834f-9981db88d72f.lovable.app";
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
  const resendKey = process.env["RESEND_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  if (!resendKey) {
    console.warn("sendEmail: RESEND_API_KEY is not set. Email will not be sent.");
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  const from = getFromEmail();

  try {
    // 1. If running inside Lovable sandbox with connector gateway configured:
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
        if (res.ok) {
          return { sent: true };
        }
        const errText = await res.text();
        console.warn(`Lovable gateway send returned ${res.status}: ${errText}. Falling back to direct Resend API.`);
      } catch (gwErr) {
        console.warn("Lovable gateway failed, attempting direct Resend API:", gwErr);
      }
    }

    // 2. Direct Resend API (standard for Vercel, Node, and custom domain setups)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend API error [${res.status}]: ${body}`);
      return { sent: false, reason: `Resend error ${res.status}: ${body}` };
    }

    return { sent: true };
  } catch (err) {
    console.error("sendEmail exception:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown send error" };
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html lang="sv"><body style="margin:0;background:#f7f6f3;font-family:Arial,sans-serif;color:#23272f">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <p style="font-weight:bold;color:#2f5d8a;margin:0 0 16px">Ekström VVS</p>
    <div style="background:#ffffff;border:1px solid #e6e3dc;border-radius:8px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:12px;color:#8a8f98;margin-top:16px">Ekström VVS · Västerås</p>
  </div></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:20px 0 0"><a href="${href}" style="display:inline-block;background:#2f5d8a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">${label}</a></p>`;
}

export function bookingConfirmationEmail(p: { name: string; title: string; when: string | null; ref: string; accessUrl: string | null }) {
  const rows = [
    `<p style="margin:0 0 8px">Hej ${esc(p.name)},</p>`,
    `<p style="margin:0 0 8px">Din bokning hos Ekström VVS är mottagen.</p>`,
    `<p style="margin:0 0 4px"><strong>${esc(p.title)}</strong></p>`,
    p.when ? `<p style="margin:0 0 4px">Tid: ${esc(p.when)}</p>` : `<p style="margin:0 0 4px">Vi kontaktar dig för att komma överens om en tid.</p>`,
    `<p style="margin:0 0 4px">Referens: ${esc(p.ref)}</p>`,
  ].join("");
  return {
    subject: `Bokningsbekräftelse ${p.ref} — Ekström VVS`,
    html: layout("Tack för din bokning", rows + (p.accessUrl ? button(p.accessUrl, "Visa bokning") : "")),
  };
}

export function offerEmail(p: { name: string; title: string; when: string; offerUrl: string }) {
  const body = [
    `<p style="margin:0 0 8px">Hej ${esc(p.name)},</p>`,
    `<p style="margin:0 0 8px">En tid har blivit ledig för <strong>${esc(p.title)}</strong>:</p>`,
    `<p style="margin:0 0 8px;font-size:18px"><strong>${esc(p.when)}</strong></p>`,
    `<p style="margin:0">Erbjudandet gäller i 15 minuter. Svara snabbt om du vill ha tiden.</p>`,
  ].join("");
  return {
    subject: `Ledig tid: ${p.when} — Ekström VVS`,
    html: layout("En tid har blivit ledig", body + button(p.offerUrl, "Svara på erbjudandet")),
  };
}
