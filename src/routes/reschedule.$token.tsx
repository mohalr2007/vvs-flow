import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Reschedule";

export const Route = createFileRoute("/reschedule/$token")({
  head: () => ({
    meta: [
      { title: "Reschedule — Ekström VVS" },
      { name: "description", content: "Choose a new available time for your appointment." },
      { property: "og:title", content: "Reschedule — Ekström VVS" },
      { property: "og:description", content: "Choose a new available time for your appointment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
