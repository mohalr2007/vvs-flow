import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/ROT";

export const Route = createFileRoute("/dashboard/rot")({
  head: () => ({
    meta: [
      { title: "ROT — VVS Flow" },
      { name: "description", content: "ROT deduction summaries ready for export." },
      { property: "og:title", content: "ROT — VVS Flow" },
      { property: "og:description", content: "ROT deduction summaries ready for export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
