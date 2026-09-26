export function downloadIcs({ title, start, minutes, location }: { title: string; start: string; minutes: number; location: string }) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const s = new Date(start), e = new Date(s.getTime() + minutes * 60000);
  const esc = (v: string) => v.replace(/([,;\\])/g, "\\$1");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VVS Flow//EN", "BEGIN:VEVENT", `UID:${crypto.randomUUID()}@vvsflow`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${esc(title)}`, `LOCATION:${esc(location)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a"); a.href = url; a.download = "ekstrom-vvs-appointment.ics"; a.click(); URL.revokeObjectURL(url);
}
