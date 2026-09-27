import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Inbox";

export const Route = createFileRoute("/dashboard/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — VVS Flow" },
      { name: "description", content: "Turn customer messages into jobs with AI help." },
      { property: "og:title", content: "Inbox — VVS Flow" },
      { property: "og:description", content: "Turn customer messages into jobs with AI help." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
