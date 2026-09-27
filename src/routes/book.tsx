import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Book";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a plumber — Ekström VVS" },
      { name: "description", content: "Describe your plumbing job and pick an available time." },
      { property: "og:title", content: "Book a plumber — Ekström VVS" },
      { property: "og:description", content: "Describe your plumbing job and pick an available time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
