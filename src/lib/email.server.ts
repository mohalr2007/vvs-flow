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
  // 1. EmailJS support (100% free, no domain needed, works directly with Gmail)
  const emailjsServiceId = process.env["EMAILJS_SERVICE_ID"] || "service_default";
  const emailjsTemplateId = process.env["EMAILJS_TEMPLATE_ID"] || "template_default";
  const emailjsPublicKey = process.env["EMAILJS_PUBLIC_KEY"] || "WMKnGylJlm0kUN8g2";
  const emailjsPrivateKey = process.env["EMAILJS_PRIVATE_KEY"] || "BopuvPQv944TyBz9oCkdI";

  if (emailjsServiceId && emailjsTemplateId && emailjsServiceId !== "service_default" && emailjsTemplateId !== "template_default") {
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
            subject: subject,
            message: html,
            html_message: html,
            company_name: "Ekström VVS",
            app_url: getAppUrl(),
          },
        }),
      });

      if (res.ok) {
        return { sent: true };
      }
      const errText = await res.text();
      console.warn(`EmailJS send returned ${res.status}: ${errText}`);
      if (!process.env["RESEND_API_KEY"]) {
        return { sent: false, reason: `EmailJS error: ${errText}` };
      }
    } catch (err) {
      console.warn("EmailJS exception:", err);
      if (!process.env["RESEND_API_KEY"]) {
        return { sent: false, reason: err instanceof Error ? err.message : "EmailJS network error" };
      }
    }
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
      console.error(`Resend API error [${res.status}]: ${body}`);
      return { sent: false, reason: `Resend error ${res.status}: ${body}` };
    } catch (err) {
      console.error("Resend exception:", err);
      return { sent: false, reason: err instanceof Error ? err.message : "Unknown send error" };
    }
  }

  if (!process.env["EMAILJS_SERVICE_ID"] && !resendKey) {
    console.warn("sendEmail: Neither EmailJS nor Resend is configured.");
    return {
      sent: false,
      reason: "Email service not ready: please set EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID in Vercel environment variables.",
    };
  }

  return { sent: true };
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function layout(title: string, body: string, subtitle?: string) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- En-tête officiel Marine & Cyan -->
    <tr>
      <td style="background-color: #0b1a28; padding: 24px 28px; border-bottom: 3px solid #0891b2;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.03em;">
                EKSTRÖM <span style="color: #22d3ee;">VVS</span>
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em;">
                Auktoriserad VVS-montör • Västerås
              </p>
            </td>
            <td align="right">
              <span style="display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; background-color: rgba(8,145,178,0.2); color: #22d3ee; border: 1px solid rgba(8,145,178,0.4); border-radius: 16px;">
                Confirmation officielle
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Corps du message -->
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

    <!-- Contact & Assistance -->
    <tr>
      <td style="padding: 0 28px 24px 28px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px;">
          <tr>
            <td style="font-size: 12px; color: #64748b; line-height: 1.5;">
              <strong style="color: #0f172a;">Une question ou une urgence ?</strong><br>
              Intervention rapide 24h/24 : <strong style="color: #0891b2;">021-123 456</strong> · Réponse directe par email.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pied de page -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #475569;">
          Ekström VVS AB · Kopparlunden, 721 30 Västerås, Suède
        </p>
        <p style="margin: 0;">
          Service certifié de plomberie et chauffage. Ce message a été généré automatiquement suite à votre réservation.
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

export function bookingConfirmationEmail(p: { name: string; title: string; when: string | null; ref: string; accessUrl: string | null }) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hej <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      Tack för din bokning hos <strong>Ekström VVS</strong>. Din förfrågan är bekräftad och registrerad i vårt system.
    </p>

    <!-- Détails du rendez-vous -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; width: 35%;">Tjänst / Intervention :</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${esc(p.title)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">Planerad tid :</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0891b2;">${p.when ? esc(p.when) : 'Vi kontaktar dig för exakt tid'}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">Referensnummer :</td>
        <td style="padding: 12px 16px; font-size: 13px; font-family: monospace; font-weight: 600; color: #0f172a;">${esc(p.ref)}</td>
      </tr>
    </table>

    <p style="margin: 0 0 6px 0; color: #475569; font-size: 13px;">
      Du kan följa status på din bokning eller göra ändringar när som helst via din personliga länk :
    </p>
    ${p.accessUrl ? button(p.accessUrl, "Se och hantera din bokning") : ""}
  `;

  return {
    subject: `Bekräftelse ${p.ref} : ${p.title} — Ekström VVS`,
    html: layout("Bokningsbekräftelse", content, `Referens : ${p.ref}`),
  };
}

export function offerEmail(p: { name: string; title: string; when: string; offerUrl: string }) {
  const content = `
    <p style="margin: 0 0 14px 0; font-size: 15px;">Hej <strong>${esc(p.name)}</strong>,</p>
    <p style="margin: 0 0 18px 0; color: #475569;">
      Goda nyheter ! En tidigare tid har blivit ledig i vårt schema för din förfrågan :
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Nytt ledigt datum :</p>
      <p style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #15803d;">${esc(p.when)}</p>
      <p style="margin: 0; font-size: 12px; color: #166534;">För : ${esc(p.title)}</p>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 0 0 18px 0; font-size: 13px; color: #92400e;">
      ⏱ <strong>Begränsad giltighetstid :</strong> Detta erbjudande är reserverat för dig i <strong>15 minuter</strong>. Om du inte bekräftar går turen vidare till nästa person i kön.
    </div>

    ${button(p.offerUrl, "Acceptera tiden nu")}
  `;

  return {
    subject: `Ledig tid erbjudande : ${p.when} — Ekström VVS`,
    html: layout("Ny ledig tid för din VVS-service", content),
  };
}
