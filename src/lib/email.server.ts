// Server-only email sending via the Resend connector gateway.
// Never import this file from client code.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "Ekström VVS <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; reason?: string }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return { sent: false, reason: "Email is not configured." };
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Email send failed [${res.status}]: ${body}`);
    return { sent: false, reason: `Provider error ${res.status}` };
  }
  return { sent: true };
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
