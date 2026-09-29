import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Waitlist";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Priority Waitlist — Ekström VVS" },
      { name: "description", content: "Join the priority waitlist and be the first to get a slot when a cancellation opens near you." },
      { property: "og:title", content: "Priority Waitlist — Ekström VVS" },
      { property: "og:description", content: "Join the priority waitlist and be the first to get a slot when a cancellation opens near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
