import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Settings";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — VVS Flow" },
      { name: "description", content: "Business details, hours and scheduling rules." },
      { property: "og:title", content: "Settings — VVS Flow" },
      { property: "og:description", content: "Business details, hours and scheduling rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
