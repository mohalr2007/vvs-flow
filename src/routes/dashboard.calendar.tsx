import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Calendar";

export const Route = createFileRoute("/dashboard/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — VVS Flow" },
      { name: "description", content: "Weekly schedule of jobs and project days." },
      { property: "og:title", content: "Calendar — VVS Flow" },
      { property: "og:description", content: "Weekly schedule of jobs and project days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
