import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/ProjectDetail";

export const Route = createFileRoute("/dashboard/projects_/$projectId")({
  head: () => ({
    meta: [
      { title: "Project detail — VVS Flow" },
      { name: "description", content: "Plan and follow a renovation project." },
      { property: "og:title", content: "Project detail — VVS Flow" },
      { property: "og:description", content: "Plan and follow a renovation project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
