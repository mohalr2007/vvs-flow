import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Jobs";

export const Route = createFileRoute("/dashboard/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — VVS Flow" },
      { name: "description", content: "All plumbing jobs and requests." },
      { property: "og:title", content: "Jobs — VVS Flow" },
      { property: "og:description", content: "All plumbing jobs and requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
