import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Projects";

export const Route = createFileRoute("/dashboard/projects")({
  head: () => ({
    meta: [
      { title: "Projects — VVS Flow" },
      { name: "description", content: "Larger renovation projects and their progress." },
      { property: "og:title", content: "Projects — VVS Flow" },
      { property: "og:description", content: "Larger renovation projects and their progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
