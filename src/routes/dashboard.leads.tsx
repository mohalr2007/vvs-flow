import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Leads";

export const Route = createFileRoute("/dashboard/leads")({
  head: () => ({
    meta: [
      { title: "Leads — VVS Flow" },
      { name: "description", content: "Track leads through the sales pipeline." },
      { property: "og:title", content: "Leads — VVS Flow" },
      { property: "og:description", content: "Track leads through the sales pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
