import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Access";

export const Route = createFileRoute("/access/$token")({
  head: () => ({
    meta: [
      { title: "Your appointment — Ekström VVS" },
      { name: "description", content: "Confirm access details for your plumbing appointment." },
      { property: "og:title", content: "Your appointment — Ekström VVS" },
      { property: "og:description", content: "Confirm access details for your plumbing appointment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
