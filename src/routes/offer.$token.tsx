import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Offer";

export const Route = createFileRoute("/offer/$token")({
  head: () => ({
    meta: [
      { title: "A time opened for you — Ekström VVS" },
      { name: "description", content: "Review and accept your reserved appointment time." },
      { property: "og:title", content: "A time opened for you — Ekström VVS" },
      { property: "og:description", content: "Review and accept your reserved appointment time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
