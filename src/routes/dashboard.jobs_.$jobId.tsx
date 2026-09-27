import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/JobDetail";

export const Route = createFileRoute("/dashboard/jobs_/$jobId")({
  head: () => ({
    meta: [
      { title: "Job detail — VVS Flow" },
      { name: "description", content: "Review and schedule a plumbing job." },
      { property: "og:title", content: "Job detail — VVS Flow" },
      { property: "og:description", content: "Review and schedule a plumbing job." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
