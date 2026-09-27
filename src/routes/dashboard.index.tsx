import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Overview";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — VVS Flow" },
      { name: "description", content: "Today's jobs, requests and schedule at a glance." },
      { property: "og:title", content: "Overview — VVS Flow" },
      { property: "og:description", content: "Today's jobs, requests and schedule at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
