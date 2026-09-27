import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Waitlist";

export const Route = createFileRoute("/dashboard/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist — VVS Flow" },
      { name: "description", content: "Fill cancelled slots with the best waitlist match." },
      { property: "og:title", content: "Waitlist — VVS Flow" },
      { property: "og:description", content: "Fill cancelled slots with the best waitlist match." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
